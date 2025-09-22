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

        if (isset($node['type']) && $node['type'] === 'variable') {
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
            if (isset($node['type']) && $node['type'] === 'variable') {
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
            return $this->applyMarks($text, $node);
        }

        if (isset($node['type'])) {
            switch ($node['type']) {
                case 'paragraph':
                    $content = $this->convertChildren($node['children'] ?? []);
                    return "<p>{$content}</p>";

                case 'variable':
                    $variable = $node['variable'] ?? '';
                    return "{{ {$variable} }}";

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



////////////


{# templates/emails/custom_message.html.twig #}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .email-header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e9ecef;
        }
        .email-title {
            color: #2c3e50;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
        .email-content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 32px;
        }
        .email-content p {
            margin: 16px 0;
        }
        .email-content strong {
            font-weight: 700;
            color: #2c3e50;
        }
        .email-content em {
            font-style: italic;
            color: #6c757d;
        }
        .email-content u {
            text-decoration: underline;
            color: #495057;
        }
        .variable {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            display: inline-block;
            margin: 0 2px;
        }
        .email-footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .context-info {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 16px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        .context-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 8px;
        }
        .context-item {
            margin: 4px 0;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-container { padding: 20px; }
            .email-title { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="email-title">{{ title }}</h1>
        </div>
        
        <div class="email-content">
            {{ content|raw }}
        </div>

        {% if context %}
        <div class="context-info">
            <div class="context-title">📧 Message Context</div>
            
            {% if context.user is defined %}
            <div class="context-item">
                <strong>User:</strong> {{ context.user.firstName ?? 'N/A' }} {{ context.user.lastName ?? 'N/A' }}
                {% if context.user.email is defined %}({{ context.user.email }}){% endif %}
            </div>
            {% endif %}
            
            {% if context.company is defined %}
            <div class="context-item">
                <strong>Company:</strong> {{ context.company.name ?? 'N/A' }}
                {% if context.company.address is defined %}- {{ context.company.address }}{% endif %}
            </div>
            {% endif %}
            
            {% if context.order is defined %}
            <div class="context-item">
                <strong>Order:</strong> #{{ context.order.id ?? 'N/A' }}
                {% if context.order.total is defined %}- ${{ context.order.total|number_format(2) }}{% endif %}
            </div>
            {% endif %}
            
            {% if context.product is defined %}
            <div class="context-item">
                <strong>Product:</strong> {{ context.product.name ?? 'N/A' }}
            </div>
            {% endif %}
        </div>
        {% endif %}
        
        <div class="email-footer">
            <p>This is an automated message sent from our system.</p>
            <p>Sent on {{ "now"|date("F j, Y \\a\\t g:i A") }}</p>
        </div>
    </div>
</body>
</html>

{# templates/emails/custom_message.txt.twig - Plain text version #}
{{ title }}
{{ '='|repeat(title|length) }}

{{ content|striptags|raw }}

{% if context %}
---
MESSAGE CONTEXT:

{% if context.user is defined %}
User: {{ context.user.firstName ?? 'N/A' }} {{ context.user.lastName ?? 'N/A' }}{% if context.user.email is defined %} ({{ context.user.email }}){% endif %}

{% endif %}
{% if context.company is defined %}
Company: {{ context.company.name ?? 'N/A' }}{% if context.company.address is defined %} - {{ context.company.address }}{% endif %}

{% endif %}
{% if context.order is defined %}
Order: #{{ context.order.id ?? 'N/A' }}{% if context.order.total is defined %} - ${{ context.order.total|number_format(2) }}{% endif %}

{% endif %}
{% if context.product is defined %}
Product: {{ context.product.name ?? 'N/A' }}

{% endif %}
{% endif %}

---
This is an automated message sent from our system.
Sent on {{ "now"|date("F j, Y \\a\\t g:i A") }}

{# config/services.yaml additions #}
services:
    # ... existing services

    App\Service\SlateToHtmlConverter:
        tags: ['app.slate_converter']

    App\Service\EmailVariableResolver:
        tags: ['app.email_variable_resolver']

    App\Service\EmailService:
        arguments:
            $mailer: '@mailer'
            $twig: '@twig'
            $slateConverter: '@App\Service\SlateToHtmlConverter'
            $variableResolver: '@App\Service\EmailVariableResolver'

    App\Validator\ValidSlateContentValidator:
        tags:
            - { name: validator.constraint_validator }

{# config/packages/mailer.yaml #}
framework:
    mailer:
        dsn: '%env(MAILER_DSN)%'
        envelope:
            sender: 'noreply@yourapp.com'
        headers:
            From: 'Your App <noreply@yourapp.com>'
            'X-Mailer': 'Symfony Mailer'

{# config/packages/validator.yaml #}
framework:
    validation:
        email_validation_mode: html5
        enable_annotations: true

{# .env additions #}
# MAILER_DSN=smtp://localhost:1025
# MAILER_DSN=gmail+smtp://username:password@default
# MAILER_DSN=sendmail://default

{# JavaScript example for frontend integration #}
// frontend/emailForm.js
async function submitEmailForm(formData) {
    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.violations) {
                // Handle validation errors
                result.violations.forEach(violation => {
                    console.error(`${violation.property}: ${violation.message}`);
                });
            }
            throw new Error(result.error || 'Failed to send email');
        }

        console.log('Email sent successfully:', result);
        alert(`Email sent to ${result.recipients} recipient(s)`);
        
    } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email: ' + error.message);
    }
}

// Example usage:
const emailData = {
    title: "Welcome to Our Service",
    subject: "Welcome {{user.firstName}}!",
    emails: ["user@example.com", "admin@example.com"],
    content: [
        {
            type: "paragraph",
            children: [
                { text: "Hello " },
                { type: "variable", variable: "user.firstName", children: [{ text: "" }] },
                { text: ", welcome to our service!" }
            ]
        }
    ]
};

submitEmailForm(emailData);

{# Example Entity classes for context #}
<?php

// src/Entity/User.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 255)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 255)]
    private string $email;

    // Getters and setters...
    public function getFirstName(): string { return $this->firstName; }
    public function setFirstName(string $firstName): self { $this->firstName = $firstName; return $this; }
    public function getLastName(): string { return $this->lastName; }
    public function setLastName(string $lastName): self { $this->lastName = $lastName; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }
}

// src/Entity/Company.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Company
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $address = null;

    // Getters and setters...
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $address): self { $this->address = $address; return $this; }
}

// src/Entity/Order.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private float $total;

    // Getters and setters...
    public function getId(): ?int { return $this->id; }
    public function getTotal(): float { return $this->total; }
    public function setTotal(float $total): self { $this->total = $total; return $this; }
}

// src/Entity/Product.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    // Getters and setters...
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
}
