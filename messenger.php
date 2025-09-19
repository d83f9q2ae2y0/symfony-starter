<?php

namespace App\Message;

class VersatileMessage
{
    private string $method;
    private array $data;
    private ?string $context;

    public function __construct(string $method, array $data = [], ?string $context = null)
    {
        $this->method = $method;
        $this->data = $data;
        $this->context = $context;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getData(): array
    {
        return $this->data;
    }

    public function getContext(): ?string
    {
        return $this->context;
    }

    public function setData(array $data): self
    {
        $this->data = $data;
        return $this;
    }

    public function addData(string $key, $value): self
    {
        $this->data[$key] = $value;
        return $this;
    }
}

<?php

namespace App\MessageHandler;

use App\Message\VersatileMessage;
use App\Service\AaaService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\Exception\UnrecoverableMessageHandlingException;

#[AsMessageHandler]
class VersatileMessageHandler
{
    private AaaService $aaaService;
    private LoggerInterface $logger;
    
    // Define allowed methods for security
    private array $allowedMethods = [
        'processData',
        'validateInput',
        'transformData',
        'calculateResults',
        'generateReport',
        // Add your aaaService methods here
    ];

    public function __construct(AaaService $aaaService, LoggerInterface $logger)
    {
        $this->aaaService = $aaaService;
        $this->logger = $logger;
    }

    public function __invoke(VersatileMessage $message): mixed
    {
        $method = $message->getMethod();
        $data = $message->getData();
        $context = $message->getContext();

        // Log the message processing
        $this->logger->info('Processing versatile message', [
            'method' => $method,
            'context' => $context,
            'data_keys' => array_keys($data)
        ]);

        try {
            // Validate method exists and is allowed
            $this->validateMethod($method);

            // Call the method on aaaService
            $result = $this->callServiceMethod($method, $data);

            $this->logger->info('Message processed successfully', [
                'method' => $method,
                'context' => $context
            ]);

            return $result;

        } catch (\Exception $e) {
            $this->logger->error('Error processing versatile message', [
                'method' => $method,
                'context' => $context,
                'error' => $e->getMessage()
            ]);

            // Determine if this is recoverable or not
            if ($e instanceof \InvalidArgumentException || $e instanceof \BadMethodCallException) {
                throw new UnrecoverableMessageHandlingException($e->getMessage(), $e->getCode(), $e);
            }

            throw $e;
        }
    }

    private function validateMethod(string $method): void
    {
        if (!in_array($method, $this->allowedMethods, true)) {
            throw new \InvalidArgumentException("Method '{$method}' is not allowed");
        }

        if (!method_exists($this->aaaService, $method)) {
            throw new \BadMethodCallException("Method '{$method}' does not exist on AaaService");
        }
    }

    private function callServiceMethod(string $method, array $data): mixed
    {
        // Use reflection to call the method with proper error handling
        try {
            $reflection = new \ReflectionMethod($this->aaaService, $method);
            
            // Check if method accepts the data parameter
            $parameters = $reflection->getParameters();
            if (empty($parameters)) {
                return $this->aaaService->$method();
            }

            // Call with data array as first parameter
            return $this->aaaService->$method($data);

        } catch (\ReflectionException $e) {
            throw new \BadMethodCallException("Cannot call method '{$method}': " . $e->getMessage());
        }
    }

    /**
     * Add a method to the allowed methods list (useful for dynamic configuration)
     */
    public function addAllowedMethod(string $method): self
    {
        if (!in_array($method, $this->allowedMethods, true)) {
            $this->allowedMethods[] = $method;
        }
        return $this;
    }

    /**
     * Get list of allowed methods
     */
    public function getAllowedMethods(): array
    {
        return $this->allowedMethods;
    }
}

<?php

namespace App\Controller;

use App\Message\VersatileMessage;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;

class ExampleController extends AbstractController
{
    #[Route('/example/async', name: 'example_async', methods: ['POST'])]
    public function dispatchAsync(Request $request, MessageBusInterface $bus): JsonResponse
    {
        $requestData = json_decode($request->getContent(), true);

        // Example 1: Process some data asynchronously
        $message1 = new VersatileMessage(
            method: 'processData',
            data: [
                'user_id' => $requestData['user_id'] ?? null,
                'items' => $requestData['items'] ?? [],
                'timestamp' => time()
            ],
            context: 'user_data_processing'
        );

        $bus->dispatch($message1);

        // Example 2: Generate a report
        $message2 = new VersatileMessage(
            method: 'generateReport',
            data: [
                'report_type' => 'monthly',
                'date_range' => ['start' => '2024-01-01', 'end' => '2024-01-31'],
                'format' => 'pdf'
            ],
            context: 'monthly_reports'
        );

        $bus->dispatch($message2);

        return new JsonResponse(['status' => 'Messages dispatched successfully']);
    }

    #[Route('/example/sync', name: 'example_sync', methods: ['POST'])]
    public function dispatchSync(Request $request, MessageBusInterface $bus): JsonResponse
    {
        $requestData = json_decode($request->getContent(), true);

        // Example 3: Synchronous processing (if configured with sync transport)
        $message = new VersatileMessage(
            method: 'validateInput',
            data: [
                'email' => $requestData['email'] ?? '',
                'phone' => $requestData['phone'] ?? '',
                'validation_rules' => ['email_required', 'phone_optional']
            ],
            context: 'form_validation'
        );

        try {
            $result = $bus->dispatch($message);
            return new JsonResponse(['status' => 'success', 'result' => $result]);
        } catch (\Exception $e) {
            return new JsonResponse(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }

    #[Route('/example/chained', name: 'example_chained', methods: ['POST'])]
    public function dispatchChained(Request $request, MessageBusInterface $bus): JsonResponse
    {
        $requestData = json_decode($request->getContent(), true);

        // Example 4: Chain multiple operations
        $baseData = [
            'source' => $requestData['source'] ?? 'api',
            'user_id' => $requestData['user_id'] ?? null,
            'raw_data' => $requestData['data'] ?? []
        ];

        // Step 1: Transform data
        $transformMessage = new VersatileMessage(
            method: 'transformData',
            data: array_merge($baseData, ['operation' => 'normalize']),
            context: 'data_pipeline_step_1'
        );

        // Step 2: Calculate results (you might want to chain this after step 1 completes)
        $calculateMessage = new VersatileMessage(
            method: 'calculateResults',
            data: array_merge($baseData, ['calculation_type' => 'aggregation']),
            context: 'data_pipeline_step_2'
        );

        $bus->dispatch($transformMessage);
        $bus->dispatch($calculateMessage);

        return new JsonResponse(['status' => 'Pipeline started successfully']);
    }
}

// Example AaaService methods that would work with this system
/*
namespace App\Service;

class AaaService 
{
    public function processData(array $data): array
    {
        // Your processing logic here
        return ['processed' => true, 'data' => $data];
    }

    public function validateInput(array $data): array
    {
        // Your validation logic here
        return ['valid' => true, 'errors' => []];
    }

    public function transformData(array $data): array
    {
        // Your transformation logic here
        return ['transformed' => $data];
    }

    public function calculateResults(array $data): array
    {
        // Your calculation logic here
        return ['results' => ['sum' => 100, 'average' => 25]];
    }

    public function generateReport(array $data): array
    {
        // Your report generation logic here
        return ['report_id' => uniqid(), 'status' => 'generated'];
    }
}
*/
