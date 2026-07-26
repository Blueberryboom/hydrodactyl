<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Nests;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Eggs\EggCreationService;
use Pterodactyl\Services\Eggs\EggDeletionService;
use Pterodactyl\Services\Eggs\EggUpdateService;
use Pterodactyl\Transformers\Api\Application\EggTransformer;
use Pterodactyl\Services\Eggs\Sharing\EggImporterService;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggsRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\DeleteEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\StoreEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\ImportEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\ImportEggUrlRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class EggController extends ApplicationApiController
{
    /**
     * EggController constructor.
     */
    public function __construct(
        private EggCreationService $creationService,
        private EggDeletionService $deletionService,
        private EggUpdateService $updateService,
        private EggImporterService $importerService,
    ) {
        parent::__construct();
    }

    /**
     * List all eggs in a nest
     */
    public function index(GetEggsRequest $request, Nest $nest): array
    {
        return $this->fractal->collection($nest->eggs)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * View a single egg
     */
    public function view(GetEggRequest $request, Nest $nest, Egg $egg): array
    {
        abort_unless($egg->nest_id === $nest->id, 404);

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * Create a new egg in a nest.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Service\Egg\NoParentConfigurationFoundException
     */
    public function store(StoreEggRequest $request, Nest $nest): JsonResponse
    {
        $egg = $this->creationService->handle(array_merge($request->validated(), [
            'nest_id' => $nest->id,
        ]));

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->respond(201);
    }

    /**
     * Update an existing egg.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     * @throws \Pterodactyl\Exceptions\Service\Egg\NoParentConfigurationFoundException
     */
    public function update(StoreEggRequest $request, Nest $nest, Egg $egg): array
    {
        abort_unless($egg->nest_id === $nest->id, 404);

        $this->updateService->handle($egg, $request->validated());
        $egg->refresh();

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    /**
     * Delete an egg.
     *
     * @throws \Pterodactyl\Exceptions\Service\Egg\HasChildrenException
     * @throws \Pterodactyl\Exceptions\Service\HasActiveServersException
     */
    public function delete(DeleteEggRequest $request, Nest $nest, Egg $egg): JsonResponse
    {
        abort_unless($egg->nest_id === $nest->id, 404);

        $this->deletionService->handle($egg->id);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Import a new egg from an uploaded JSON file.
     *
     * @throws \Throwable
     */
    public function import(ImportEggRequest $request, Nest $nest): JsonResponse
    {
        $egg = $this->importerService->handle($request->file('import_file'), $nest->id);

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->respond(201);
    }

    /**
     * Import a new egg from a JSON URL.
     *
     * @throws \Throwable
     */
    public function importFromUrl(ImportEggUrlRequest $request, Nest $nest): JsonResponse
    {
        $parsedUrl = parse_url($request->input('import_file_url'));
        $allowedHosts = array_map(fn ($host) => trim($host), explode(',', env('ALLOWED_EGG_HOSTS', '')));

        if (!is_array($parsedUrl) || !isset($parsedUrl['host']) || !in_array($parsedUrl['host'], $allowedHosts)) {
            abort(422, 'The Egg import URL is not from an allowed host.');
        }

        if (!isset($parsedUrl['scheme']) || !in_array($parsedUrl['scheme'], ['http', 'https'])) {
            abort(422, 'The Egg import URL scheme is invalid.');
        }

        $response = @file_get_contents($request->input('import_file_url'));
        if ($response === false) {
            abort(422, 'Fetching the Egg from the URL failed.');
        }

        $egg = $this->importerService->handleFromString($response, $nest->id);

        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->respond(201);
    }
}
