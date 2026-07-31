<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Databases;

use PDO;
use PDOException;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\DatabaseHost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Databases\Hosts\HostUpdateService;
use Pterodactyl\Services\Databases\Hosts\HostCreationService;
use Pterodactyl\Services\Databases\Hosts\HostDeletionService;
use Pterodactyl\Transformers\Api\Application\DatabaseHostTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\GetDatabaseHostsRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\DeleteDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\StoreDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\UpdateDatabaseHostRequest;
use Pterodactyl\Http\Requests\Api\Application\DatabaseHosts\TestDatabaseHostConnectionRequest;

class DatabaseHostsController extends ApplicationApiController
{
    /**
     * DatabaseHostsController constructor.
     */
    public function __construct(
        private HostCreationService $creationService,
        private HostDeletionService $deletionService,
        private HostUpdateService $updateService,
    ) {
        parent::__construct();
    }

    /**
     * List all database hosts.
     */
    public function index(GetDatabaseHostsRequest $request): array
    {
        $hosts = QueryBuilder::for(DatabaseHost::query()->withCount('databases')->with('node'))
            ->allowedFilters(['name', 'host', 'username'])
            ->allowedSorts(['id', 'name', 'host', 'port', 'username', 'created_at'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($hosts)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    /**
     * Return a single database host.
     */
    public function view(GetDatabaseHostsRequest $request, DatabaseHost $databaseHost): array
    {
        $databaseHost->loadCount('databases');
        $databaseHost->load('databases.server');

        return $this->fractal->item($databaseHost)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    /**
     * Return all locations with their nodes, used when picking a linked node.
     */
    public function locations(GetDatabaseHostsRequest $request): JsonResponse
    {
        $locations = Location::query()
            ->with('nodes:id,location_id,name')
            ->orderBy('short')
            ->get()
            ->map(fn (Location $location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
                'nodes' => $location->nodes
                    ->map(fn (Node $node) => ['id' => $node->id, 'name' => $node->name])
                    ->values(),
            ])
            ->values();

        return response()->json(['data' => $locations]);
    }

    /**
     * Create a new database host.
     *
     * @throws \Throwable
     */
    public function store(StoreDatabaseHostRequest $request): JsonResponse
    {
        try {
            $host = $this->creationService->handle($request->validated());
        } catch (\Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                abort(422, sprintf('There was an error while trying to connect to the host or while executing a query: "%s"', $exception->getMessage()));
            }

            throw $exception;
        }

        return $this->fractal->item($host)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->addMeta([
                'resource' => route('api.application.databases.view', [
                    'databaseHost' => $host->id,
                ]),
            ])
            ->respond(201);
    }

    /**
     * Update a database host.
     *
     * @throws \Throwable
     */
    public function update(UpdateDatabaseHostRequest $request, DatabaseHost $databaseHost): array
    {
        try {
            $host = $this->updateService->handle($databaseHost->id, $request->validated());
        } catch (\Exception $exception) {
            if ($exception instanceof PDOException || $exception->getPrevious() instanceof PDOException) {
                abort(422, sprintf('There was an error while trying to connect to the host or while executing a query: "%s"', $exception->getMessage()));
            }

            throw $exception;
        }

        $host->loadCount('databases');

        return $this->fractal->item($host)
            ->transformWith($this->getTransformer(DatabaseHostTransformer::class))
            ->toArray();
    }

    /**
     * Delete a database host.
     *
     * @throws \Pterodactyl\Exceptions\Service\HasActiveServersException
     */
    public function delete(DeleteDatabaseHostRequest $request, DatabaseHost $databaseHost): Response
    {
        $this->deletionService->handle($databaseHost->id);

        return response('', 204);
    }

    /**
     * Test database connection credentials.
     */
    public function testConnection(TestDatabaseHostConnectionRequest $request): JsonResponse
    {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8', $request->input('host'), $request->input('port'));

            $pdo = new PDO($dsn, $request->input('username'), $request->input('password'), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);

            $version = $pdo->query('SELECT VERSION() as version')->fetchColumn();

            $grants = $pdo->query('SHOW GRANTS FOR CURRENT_USER()')->fetchAll(PDO::FETCH_COLUMN);

            $hasGrantOption = false;
            foreach ($grants as $grant) {
                if (stripos((string) $grant, 'GRANT OPTION') !== false) {
                    $hasGrantOption = true;
                    break;
                }
            }

            $message = sprintf('Successfully connected to MySQL server (Version: %s).', $version);
            if (!$hasGrantOption) {
                $message .= ' Warning: The user appears to lack GRANT OPTION permission which is required for creating databases and users.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'version' => $version,
                'has_grant_option' => $hasGrantOption,
            ]);
        } catch (PDOException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $exception->getMessage(),
            ], 422);
        } catch (\Exception $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $exception->getMessage(),
            ], 422);
        }
    }
}
