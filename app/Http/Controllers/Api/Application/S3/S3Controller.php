<?php

namespace Pterodactyl\Http\Controllers\Api\Application\S3;

use Aws\S3\S3Client;
use Pterodactyl\Models\S3;
use Aws\Exception\AwsException;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\S3\S3UpdateService;
use Pterodactyl\Services\S3\S3CreationService;
use Pterodactyl\Services\S3\S3DeletionService;
use Pterodactyl\Transformers\Api\Application\S3Transformer;
use Pterodactyl\Http\Requests\Api\Application\S3\GetS3BucketsRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\DeleteS3BucketRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\StoreS3BucketRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\TestS3ConnectionRequest;
use Pterodactyl\Http\Requests\Api\Application\S3\UpdateS3BucketRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class S3Controller extends ApplicationApiController
{
    public function __construct(
        private S3CreationService $creationService,
        private S3DeletionService $deletionService,
        private S3UpdateService $updateService,
    ) {
        parent::__construct();
    }

    public function index(GetS3BucketsRequest $request): array
    {
        $buckets = QueryBuilder::for(S3::query()->withCount('servers'))
            ->allowedFilters(['name', 'endpoint', 'bucket_name', 'enabled'])
            ->allowedIncludes(['servers'])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($buckets)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function view(GetS3BucketsRequest $request, S3 $s3): array
    {
        $s3->loadCount('servers');

        return $this->fractal->item($s3)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function store(StoreS3BucketRequest $request): JsonResponse
    {
        $s3 = $this->creationService->handle($request->validated());

        return $this->fractal->item($s3)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->addMeta([
                'resource' => route('api.application.s3.view', [
                    's3' => $s3->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateS3BucketRequest $request, S3 $s3): array
    {
        $s3 = $this->updateService->handle($s3, $request->validated());
        $s3->loadCount('servers');

        return $this->fractal->item($s3)
            ->transformWith($this->getTransformer(S3Transformer::class))
            ->toArray();
    }

    public function delete(DeleteS3BucketRequest $request, S3 $s3): Response
    {
        if ($s3->servers()->exists()) {
            abort(400, 'Cannot delete: bucket is used by servers.');
        }

        $this->deletionService->handle($s3);

        return response('', 204);
    }

    public function testConnection(TestS3ConnectionRequest $request): JsonResponse
    {
        try {
            $config = [
                'version' => 'latest',
                'region' => trim((string) $request->input('region', '')) ?: 'us-east-1',
                'credentials' => [
                    'key' => $request->input('access_key'),
                    'secret' => $request->input('secret_key'),
                ],
                'use_path_style_endpoint' => (bool) $request->input('use_path_style_endpoint', false),
            ];

            if ($endpoint = $request->input('endpoint')) {
                $config['endpoint'] = $endpoint;
            }

            $client = new S3Client($config);
            $key = '_hydrodactyl_test_' . time();
            $message = "This is an upload test, If your reading this, it succeeded, happy Servering";
            $content = str_repeat($message . "\n", (int) (10 * 1024 * 1024 / (strlen($message) + 1)));

            $client->putObject([
                'Bucket' => $request->input('bucket_name'),
                'Key' => $key,
                'Body' => $content,
                'ContentType' => 'text/plain',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Connection successful! A 10MB test file was uploaded as "' . $key . '".',
            ]);
        } catch (AwsException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'S3 error: ' . ($exception->getAwsErrorMessage() ?: $exception->getMessage()),
            ], 400);
        } catch (\Exception $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $exception->getMessage(),
            ], 400);
        }
    }
}
