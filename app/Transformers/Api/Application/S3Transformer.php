<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\S3;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class S3Transformer extends BaseTransformer
{
    protected array $availableIncludes = ['servers'];

    public function getResourceName(): string
    {
        return S3::RESOURCE_NAME;
    }

    public function transform(S3 $s3): array
    {
        return [
            'id' => $s3->id,
            'name' => $s3->name,
            'description' => $s3->description,
            'access_key' => $s3->access_key,
            'secret_key' => $s3->secret_key,
            'endpoint' => $s3->endpoint,
            'region' => $s3->region ?: 'us-east-1',
            'bucket_name' => $s3->bucket_name,
            'use_path_style_endpoint' => $s3->use_path_style_endpoint,
            'enabled' => $s3->enabled,
            'servers_count' => $s3->servers_count ?? $s3->servers()->count(),
            $s3->getUpdatedAtColumn() => $this->formatTimestamp($s3->updated_at),
            $s3->getCreatedAtColumn() => $this->formatTimestamp($s3->created_at),
        ];
    }

    public function includeServers(S3 $s3): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_SERVERS)) {
            return $this->null();
        }

        $s3->loadMissing('servers');

        return $this->collection($s3->getRelation('servers'), $this->makeTransformer(ServerTransformer::class), 'server');
    }
}
