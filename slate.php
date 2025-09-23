<?php

// src/Entity/EmailMessage.php
namespace App\Entity;

use App\Validator as AppAssert;
use Symfony\Component\Validator\Constraints as Assert;

class EmailMessage
{
    #[Assert\NotBlank(message: 'Title cannot be blank')]
    #[Assert\Length(
        min: 3,
        max: 255,
        minMessage: 'Title must be at least {{ limit }} characters long',
        maxMessage: 'Title cannot be longer than {{ limit }} characters'
    )]
    private string $title;

    #[Assert\NotBlank(message: 'Subject cannot be blank')]
    #[Assert\Length(
        min: 3,
        max: 255,
        minMessage: 'Subject must be at least {{ limit }} characters long',
        maxMessage: 'Subject cannot be longer than {{ limit }} characters'
    )]
    private string $subject;

    #[Assert\NotBlank(message: 'At least one email is required')]
    #[Assert\Count(
        min: 1,
        minMessage: 'At least one email address is required'
    )]
    #[Assert\All([
        new Assert\NotBlank(message: 'Email cannot be blank'),
        new Assert\Email(message: 'Please provide a valid email address')
    ])]
    private array $emails;

    #[Assert\NotBlank(message: 'Content cannot be blank')]
    #[AppAssert\ValidSlateContent]
    private array $content;

    // Getters and Setters
    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): self
    {
        $this->subject = $subject;
        return $this;
    }

    public function getEmails(): array
    {
        return $this->emails;
    }

    public function setEmails(array $emails): self
    {
        $this->emails = array_filter($emails, fn($email) => !empty(trim($email)));
        return $this;
    }

    public function getContent(): array
    {
        return $this->content;
    }

    public function setContent(array $content): self
    {
        $this->content = $content;
        return $this;
    }
}

// src/Validator/ValidSlateContent.php
namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class ValidSlateContent extends Constraint
{
    public string $message = 'The Slate content is not valid.';
    public string $emptyMessage = 'Content cannot be empty.';
    public string $invalidVariableMessage = 'Invalid variable "{{ variable }}" found in content.';
}

// src/Validator/ValidSlateContentValidator.php
namespace App\Validator;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidSlateContentValidator extends ConstraintValidator
{
    private const ALLOWED_VARIABLES = [
        'user.firstName',
        'user.lastName',
        'user.email',
        'company.name',
        'company.address',
        'order.id',
        'order.total',
        'product.name'
    ];

    public function validate($value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidSlateContent) {
            throw new UnexpectedTypeException($constraint, ValidSlateContent::class);
        }

        if (!is_array($value)) {
            $this->context->buildViolation($constraint->message)->addViolation();
            return;
        }

        if (empty($value) || $this->isContentEmpty($value)) {
            $this->context->buildViolation($constraint->emptyMessage)->addViolation();
            return;
        }

        $this->validateSlateNodes($value, $constraint);
    }

    private function isContentEmpty(array $content): bool
    {
        foreach ($content as $node) {
            if ($this->hasNonEmptyText($node)) {
                return false;
            }
        }
        return true;
    }

    private function hasNonEmptyText(array $node): bool
    {
        if (isset($node['text']) && !empty(trim($node['text']))) {
            return true;
        }

        if (isset($node['isVariable']) && $node['isVariable']) {
            return true;
        }

        if (isset($node['children']) && is_array($node['children'])) {
            foreach ($node['children'] as $child) {
                if ($this->hasNonEmptyText($child)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function validateSlateNodes(array $nodes, ValidSlateContent $constraint): void
    {
        foreach ($nodes as $node) {
            if (isset($node['text']) && isset($node['isVariable']) && $node['isVariable']) {
                $variable = $node['variable'] ?? '';
                if (!in_array($variable, self::ALLOWED_VARIABLES, true)) {
                    $this->context->buildViolation($constraint->invalidVariableMessage)
                        ->setParameter('{{ variable }}', $variable)
                        ->addViolation();
                }
            }

            if (isset($node['children']) && is_array($node['children'])) {
                $this->validateSlateNodes($node['children'], $constraint);
            }
        }
    }
}

// src/Service/SlateToHtmlConverter.php
namespace App\Service;

class SlateToHtmlConverter
{
    public function convert(array $slateContent): string
    {
        $html = '';
        foreach ($slateContent as $node) {
            $html .= $this->convertNode($node);
        }
        return $html;
    }

    private function convertNode(array $node): string
    {
        if (isset($node['text'])) {
            $text = htmlspecialchars($node['text'], ENT_QUOTES, 'UTF-8');
            
            if (isset($node['isVariable']) && $node['isVariable']) {
                $variable = $node['variable'] ?? '';
                return "{{ {$variable} }}";
            }
            
            return $this->applyMarks($text, $node);
        }

        if (isset($node['type'])) {
            switch ($node['type']) {
                case 'paragraph':
                    $content = $this->convertChildren($node['children'] ?? []);
                    return "<p>{$content}</p>";

                default:
                    return $this->convertChildren($node['children'] ?? []);
            }
        }

        return $this->convertChildren($node['children'] ?? []);
    }

    private function convertChildren(array $children): string
    {
        $html = '';
        foreach ($children as $child) {
            $html .= $this->convertNode($child);
        }
        return $html;
    }

    private function applyMarks(string $text, array $node): string
    {
        if (isset($node['bold']) && $node['bold']) {
            $text = "<strong>{$text}</strong>";
        }
        if (isset($node['italic']) && $node['italic']) {
            $text = "<em>{$text}</em>";
        }
        if (isset($node['underline']) && $node['underline']) {
            $text = "<u>{$text}</u>";
        }
        return $text;
    }
}

// src/Service/EmailVariableResolver.php
namespace App\Service;

use App\Entity\User;
use App\Entity\Company;
use App\Entity\Order;
use App\Entity\Product;

class EmailVariableResolver
{
    public function resolveVariables(string $content, array $context): string
    {
        $variables = $this->extractVariables($content);
        
        foreach ($variables as $variable) {
            $value = $this->getVariableValue($variable, $context);
            $content = str_replace("{{ {$variable} }}", $value, $content);
        }
        
        return $content;
    }

    private function extractVariables(string $content): array
    {
        preg_match_all('/\{\{\s*([^}]+)\s*\}\}/', $content, $matches);
        return array_unique($matches[1]);
    }

    private function getVariableValue(string $variable, array $context): string
    {
        $parts = explode('.', $variable);
        
        if (count($parts) !== 2) {
            return "{{ {$variable} }}"; // Return unchanged if invalid format
        }
        
        [$entityType, $property] = $parts;
        
        if (!isset($context[$entityType])) {
            return "{{ {$variable} }}"; // Return unchanged if entity not found
        }
        
        $entity = $context[$entityType];
        
        return match($variable) {
            'user.firstName' => $entity instanceof User ? $entity->getFirstName() : '',
            'user.lastName' => $entity instanceof User ? $entity->getLastName() : '',
            'user.email' => $entity instanceof User ? $entity->getEmail() : '',
            'company.name' => $entity instanceof Company ? $entity->getName() : '',
            'company.address' => $entity instanceof Company ? $entity->getAddress() : '',
            'order.id' => $entity instanceof Order ? (string)$entity->getId() : '',
            'order.total' => $entity instanceof Order ? number_format($entity->getTotal(), 2) : '',
            'product.name' => $entity instanceof Product ? $entity->getName() : '',
            default => "{{ {$variable} }}"
        };
    }
}

// src/Service/EmailService.php
namespace App\Service;

use App\Entity\EmailMessage;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class EmailService
{
    public function __construct(
        private MailerInterface $mailer,
        private Environment $twig,
        private SlateToHtmlConverter $slateConverter,
        private EmailVariableResolver $variableResolver
    ) {}

    public function sendMessage(EmailMessage $emailMessage, array $context = []): void
    {
        $htmlContent = $this->slateConverter->convert($emailMessage->getContent());
        $resolvedContent = $this->variableResolver->resolveVariables($htmlContent, $context);

        $renderedContent = $this->twig->render('emails/custom_message.html.twig', [
            'title' => $emailMessage->getTitle(),
            'content' => $resolvedContent,
            'context' => $context
        ]);

        foreach ($emailMessage->getEmails() as $emailAddress) {
            $email = (new Email())
                ->from('noreply@yourapp.com')
                ->to($emailAddress)
                ->subject($emailMessage->getSubject())
                ->html($renderedContent);

            $this->mailer->send($email);
        }
    }
}

// src/Controller/EmailController.php
namespace App\Controller;

use App\Entity\EmailMessage;
use App\Service\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/email', name: 'api_email_')]
class EmailController extends AbstractController
{
    public function __construct(
        private ValidatorInterface $validator,
        private SerializerInterface $serializer,
        private EmailService $emailService
    ) {}

    #[Route('/send', name: 'send', methods: ['POST'])]
    public function sendEmail(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
            }

            // Create EmailMessage object
            $emailMessage = new EmailMessage();
            $emailMessage->setTitle($data['title'] ?? '');
            $emailMessage->setSubject($data['subject'] ?? '');
            $emailMessage->setEmails($data['emails'] ?? []);
            $emailMessage->setContent($data['content'] ?? []);

            // Validate the email message
            $errors = $this->validator->validate($emailMessage);

            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = [
                        'property' => $error->getPropertyPath(),
                        'message' => $error->getMessage()
                    ];
                }

                return new JsonResponse([
                    'error' => 'Validation failed',
                    'violations' => $errorMessages
                ], Response::HTTP_BAD_REQUEST);
            }

            // Get context for variables (this would come from your business logic)
            $context = $this->getEmailContext();

            // Send the email
            $this->emailService->sendMessage($emailMessage, $context);

            return new JsonResponse([
                'success' => true,
                'message' => 'Email sent successfully',
                'recipients' => count($emailMessage->getEmails())
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Failed to send email',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function getEmailContext(): array
    {
        // This is where you'd fetch the actual entities from your database
        // For example purposes, returning mock data
        return [
            'user' => new class {
                public function getFirstName(): string { return 'John'; }
                public function getLastName(): string { return 'Doe'; }
                public function getEmail(): string { return 'john.doe@example.com'; }
            },
            'company' => new class {
                public function getName(): string { return 'Acme Corp'; }
                public function getAddress(): string { return '123 Business St, City, State 12345'; }
            },
            'order' => new class {
                public function getId(): int { return 12345; }
                public function getTotal(): float { return 299.99; }
            },
            'product' => new class {
                public function getName(): string { return 'Premium Widget'; }
            }
        ];
    }
}

// src/Form/EmailMessageType.php (Optional - for traditional forms)
namespace App\Form;

use App\Entity\EmailMessage;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class EmailMessageType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('title', TextType::class, [
                'required' => true,
                'attr' => ['placeholder' => 'Enter message title']
            ])
            ->add('subject', TextType::class, [
                'required' => true,
                'attr' => ['placeholder' => 'Enter email subject']
            ])
            ->add('emails', CollectionType::class, [
                'entry_type' => EmailType::class,
                'allow_add' => true,
                'allow_delete' => true,
                'by_reference' => false,
            ])
            ->add('content', HiddenType::class, [
                'attr' => ['class' => 'slate-content-field']
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => EmailMessage::class,
        ]);
    }
}
