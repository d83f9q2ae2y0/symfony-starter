<?php

// src/Entity/EmailTemplate.php
namespace App\Entity;

use App\Repository\EmailTemplateRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: EmailTemplateRepository::class)]
class EmailTemplate
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $title = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    private ?string $content = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $description = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    #[ORM\PreUpdate]
    public function preUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}

// src/Repository/EmailTemplateRepository.php
namespace App\Repository;

use App\Entity\EmailTemplate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EmailTemplateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EmailTemplate::class);
    }

    public function save(EmailTemplate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(EmailTemplate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find templates by title search
     */
    public function findByTitleSearch(string $search): array
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.title LIKE :search')
            ->setParameter('search', '%' . $search . '%')
            ->orderBy('e.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find recent templates
     */
    public function findRecent(int $limit = 10): array
    {
        return $this->createQueryBuilder('e')
            ->orderBy('e.updatedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}

// src/Controller/EmailTemplateController.php
namespace App\Controller;

use App\Entity\EmailTemplate;
use App\Repository\EmailTemplateRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/email-templates')]
class EmailTemplateController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private EmailTemplateRepository $repository,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $search = $request->query->get('search');
        
        if ($search) {
            $templates = $this->repository->findByTitleSearch($search);
        } else {
            $templates = $this->repository->findBy([], ['updatedAt' => 'DESC']);
        }

        return $this->json($templates, Response::HTTP_OK, [], [
            'groups' => ['email_template:read']
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(EmailTemplate $template): JsonResponse
    {
        return $this->json($template, Response::HTTP_OK, [], [
            'groups' => ['email_template:read']
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $template = new EmailTemplate();
        $template->setTitle($data['title'] ?? '')
                ->setContent($data['content'] ?? '')
                ->setDescription($data['description'] ?? null);

        $errors = $this->validator->validate($template);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($template);
        $this->entityManager->flush();

        return $this->json($template, Response::HTTP_CREATED, [], [
            'groups' => ['email_template:read']
        ]);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(EmailTemplate $template, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $template->setTitle($data['title'] ?? $template->getTitle())
                ->setContent($data['content'] ?? $template->getContent())
                ->setDescription($data['description'] ?? $template->getDescription());

        $errors = $this->validator->validate($template);
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->flush();

        return $this->json($template, Response::HTTP_OK, [], [
            'groups' => ['email_template:read']
        ]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(EmailTemplate $template): JsonResponse
    {
        $this->entityManager->remove($template);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}

// src/Controller/EmailController.php
namespace App\Controller;

use App\Entity\EmailTemplate;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class EmailController extends AbstractController
{
    public function __construct(
        private MailerInterface $mailer
    ) {}

    #[Route('/send-email', methods: ['POST'])]
    public function sendEmail(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $to = $data['to'] ?? null;
        $subject = $data['subject'] ?? 'Email from Rich Text Editor';
        $htmlContent = $data['htmlContent'] ?? '';

        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Valid recipient email is required'], Response::HTTP_BAD_REQUEST);
        }

        if (empty($htmlContent)) {
            return $this->json(['error' => 'Email content is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $email = (new Email())
                ->from($this->getParameter('app.from_email'))
                ->to($to)
                ->subject($subject)
                ->html($htmlContent);

            $this->mailer->send($email);

            return $this->json(['message' => 'Email sent successfully']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to send email: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/send-template-email/{id}', methods: ['POST'])]
    public function sendTemplateEmail(EmailTemplate $template, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $to = $data['to'] ?? null;

        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Valid recipient email is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $email = (new Email())
                ->from($this->getParameter('app.from_email'))
                ->to($to)
                ->subject($template->getTitle())
                ->html($template->getContent());

            $this->mailer->send($email);

            return $this->json(['message' => 'Template email sent successfully']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to send email: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

// src/Service/EmailTemplateService.php
namespace App\Service;

use App\Entity\EmailTemplate;
use App\Repository\EmailTemplateRepository;
use Doctrine\ORM\EntityManagerInterface;

class EmailTemplateService
{
    public function __construct(
        private EmailTemplateRepository $repository,
        private EntityManagerInterface $entityManager
    ) {}

    public function createTemplate(string $title, string $content, ?string $description = null): EmailTemplate
    {
        $template = new EmailTemplate();
        $template->setTitle($title)
                ->setContent($content)
                ->setDescription($description);

        $this->entityManager->persist($template);
        $this->entityManager->flush();

        return $template;
    }

    public function updateTemplate(EmailTemplate $template, array $data): EmailTemplate
    {
        if (isset($data['title'])) {
            $template->setTitle($data['title']);
        }

        if (isset($data['content'])) {
            $template->setContent($data['content']);
        }

        if (isset($data['description'])) {
            $template->setDescription($data['description']);
        }

        $this->entityManager->flush();

        return $template;
    }

    public function deleteTemplate(EmailTemplate $template): void
    {
        $this->entityManager->remove($template);
        $this->entityManager->flush();
    }

    public function findTemplatesBySearch(string $search): array
    {
        return $this->repository->findByTitleSearch($search);
    }

    public function getRecentTemplates(int $limit = 10): array
    {
        return $this->repository->findRecent($limit);
    }

    /**
     * Process template content with variables
     */
    public function processTemplate(EmailTemplate $template, array $variables = []): string
    {
        $content = $template->getContent();

        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value, $content);
        }

        return $content;
    }
}

// Database migration (run: php bin/console make:migration)
// src/Migrations/VersionXXX.php would contain:
/*
CREATE TABLE email_template (
    id INT AUTO_INCREMENT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    PRIMARY KEY(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
*/
