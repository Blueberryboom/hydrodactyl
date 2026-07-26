<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Pterodactyl\Models\Nest;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Nests\NestUpdateService;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Services\Nests\NestDeletionService;
use Pterodactyl\Transformers\Api\Application\NestTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\GetNestsRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\StoreNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\DeleteNestRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\UpdateNestRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class NestController extends ApplicationApiController
{
    /**
     * NestController constructor.
     */
    public function __construct(
        private NestCreationService $creationService,
        private NestDeletionService $deletionService,
        private NestUpdateService $updateService,
    ) {
        parent::__construct();
    }

    /**
     * List all nests
     */
    public function index(GetNestsRequest $request): array
    {
        $nests = QueryBuilder::for(Nest::query()->withCount('eggs'))
            ->allowedFilters(['name', 'author'])
            ->allowedIncludes(['eggs'])
            ->allowedSorts(['id', 'name'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($nests)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    /**
     * View a single nest
     */
    public function view(GetNestsRequest $request, Nest $nest): array
    {
        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    /**
     * Create a new nest.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function store(StoreNestRequest $request): JsonResponse
    {
        $nest = $this->creationService->handle($request->validated());

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->addMeta([
                'resource' => route('api.application.nests.view', [
                    'nest' => $nest->id,
                ]),
            ])
            ->respond(201);
    }

    /**
     * Update a nest.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateNestRequest $request, Nest $nest): array
    {
        $this->updateService->handle($nest->id, $request->validated());
        $nest->refresh();

        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }

    /**
     * Delete a nest.
     *
     * @throws \Pterodactyl\Exceptions\Service\HasActiveServersException
     */
    public function delete(DeleteNestRequest $request, Nest $nest): Response
    {
        $this->deletionService->handle($nest->id);

        return response('', 204);
    }
}
