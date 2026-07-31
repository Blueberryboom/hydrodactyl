<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Models\Node;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\Item;
use League\Fractal\Resource\NullResource;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class DatabaseHostTransformer extends BaseTransformer
{
    protected array $availableIncludes = [
        'databases',
        'node_details',
    ];

    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return DatabaseHost::RESOURCE_NAME;
    }

    /**
     * Transform database host into a representation for the application API.
     */
    public function transform(DatabaseHost $model): array
    {
        return [
            'id' => $model->id,
            'name' => $model->name,
            'host' => $model->host,
            'port' => $model->port,
            'username' => $model->username,
            'node' => $model->node_id,
            'databases_count' => $model->databases_count,
            'created_at' => $model->created_at->toAtomString(),
            'updated_at' => $model->updated_at->toAtomString(),
        ];
    }

    /**
     * Return the node associated with this database host.
     */
    public function includeNodeDetails(DatabaseHost $model): Item|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_NODES)) {
            return $this->null();
        }

        $model->loadMissing('node');

        return $this->item(
            $model->getRelation('node'),
            function (Node $node) {
                return [
                    'id' => $node->id,
                    'uuid' => $node->uuid,
                    'name' => $node->name,
                    'fqdn' => $node->fqdn,
                    'scheme' => $node->scheme,
                ];
            },
            Node::RESOURCE_NAME,
        );
    }

    /**
     * Include the databases associated with this host.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeDatabases(DatabaseHost $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_SERVER_DATABASES)) {
            return $this->null();
        }

        $model->loadMissing('databases');

        return $this->collection($model->getRelation('databases'), $this->makeTransformer(ServerDatabaseTransformer::class), Database::RESOURCE_NAME);
    }
}
