<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\Location;
use Pterodactyl\Models\Node;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class LocationTransformer extends BaseTransformer
{
    private DaemonConfigurationRepository $daemonConfigurationRepository;

    /**
     * List of resources that can be included.
     */
    protected array $availableIncludes = ['nodes', 'servers'];

    /**
     * Perform dependency injection.
     */
    public function handle(DaemonConfigurationRepository $daemonConfigurationRepository): void
    {
        $this->daemonConfigurationRepository = $daemonConfigurationRepository;
    }

    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return Location::RESOURCE_NAME;
    }

    /**
     * Return a generic transformed location array.
     */
    public function transform(Location $location): array
    {
        $nodes = $location->nodes()->get([
            'id',
            'fqdn',
            'internal_fqdn',
            'scheme',
            'daemonListen',
            'daemon_token',
            'memory',
            'memory_overallocate',
            'disk',
            'disk_overallocate',
        ]);
        $servers = $location->servers()
            ->where('exclude_from_resource_calculation', false)
            ->get(['servers.id', 'servers.memory', 'servers.disk']);
        $memoryCapacity = $nodes->sum(fn ($node) => $node->memory_overallocate === -1
            ? $node->memory
            : $node->memory * (1 + ($node->memory_overallocate / 100)));
        $diskCapacity = $nodes->sum(fn ($node) => $node->disk_overallocate === -1
            ? $node->disk
            : $node->disk * (1 + ($node->disk_overallocate / 100)));

        return [
            'id' => $location->id,
            'short' => $location->short,
            'long' => $location->long,
            'nodes_count' => $nodes->count(),
            'nodes_online_count' => $nodes->filter(fn ($node) => $this->isNodeOnline($node))->count(),
            'servers_count' => $location->servers()->count(),
            'allocated_resources' => [
                'memory' => $servers->sum('memory'),
                'disk' => $servers->sum('disk'),
            ],
            'resource_capacity' => [
                'memory' => $memoryCapacity,
                'disk' => $diskCapacity,
            ],
            $location->getUpdatedAtColumn() => $this->formatTimestamp($location->updated_at),
            $location->getCreatedAtColumn() => $this->formatTimestamp($location->created_at),
        ];
    }

    private function isNodeOnline(Node $node): bool
    {
        try {
            $this->daemonConfigurationRepository->setNode($node)->getSystemInformation();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Return the nodes associated with this location.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeServers(Location $location): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_SERVERS)) {
            return $this->null();
        }

        $location->loadMissing('servers');

        return $this->collection($location->getRelation('servers'), $this->makeTransformer(ServerTransformer::class), 'server');
    }

    /**
     * Return the nodes associated with this location.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeNodes(Location $location): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_NODES)) {
            return $this->null();
        }

        $location->loadMissing('nodes');

        return $this->collection($location->getRelation('nodes'), $this->makeTransformer(NodeTransformer::class), 'node');
    }
}
