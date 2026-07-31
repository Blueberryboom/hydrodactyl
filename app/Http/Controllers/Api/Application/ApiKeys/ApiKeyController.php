<?php

namespace Pterodactyl\Http\Controllers\Api\Application\ApiKeys;

use Pterodactyl\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Services\Api\KeyCreationService;
use Pterodactyl\Transformers\Api\Application\ApiKeyTransformer;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\DeleteApiKeyRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\GetApiKeysRequest;
use Pterodactyl\Http\Requests\Api\Application\ApiKeys\StoreApiKeyRequest;
use Pterodactyl\Contracts\Repository\ApiKeyRepositoryInterface;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class ApiKeyController extends ApplicationApiController
{
    /**
     * ApiKeyController constructor.
     */
    public function __construct(
        private ApiKeyRepositoryInterface $repository,
        private KeyCreationService $keyCreationService,
    ) {
        parent::__construct();
    }

    /**
     * List all application API keys belonging to the current user.
     */
    public function index(GetApiKeysRequest $request): array
    {
        $keys = $this->repository->getApplicationKeys($request->user());

        return $this->fractal->collection($keys)
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->toArray();
    }

    /**
     * Return the resources and permission levels available when creating a key.
     */
    public function permissions(GetApiKeysRequest $request): array
    {
        $resources = AdminAcl::getResourceList();
        sort($resources);

        return [
            'data' => [
                'resources' => $resources,
                'permissions' => [
                    'read' => AdminAcl::READ,
                    'read_write' => AdminAcl::READ | AdminAcl::WRITE,
                    'none' => AdminAcl::NONE,
                ],
            ],
        ];
    }

    /**
     * Create a new application API key for the current user.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function store(StoreApiKeyRequest $request): JsonResponse
    {
        $key = $this->keyCreationService->setKeyType(ApiKey::TYPE_APPLICATION)->handle([
            'memo' => $request->input('memo'),
            'user_id' => $request->user()->id,
        ], $request->getKeyPermissions());

        return $this->fractal->item($key)
            ->transformWith($this->getTransformer(ApiKeyTransformer::class))
            ->respond(201);
    }

    /**
     * Delete an application API key from the database.
     */
    public function delete(DeleteApiKeyRequest $request, string $identifier): JsonResponse
    {
        $this->repository->deleteApplicationKey($request->user(), $identifier);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
