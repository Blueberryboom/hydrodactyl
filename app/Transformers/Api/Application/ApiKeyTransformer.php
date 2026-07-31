<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\ApiKey;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class ApiKeyTransformer extends BaseTransformer
{
    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return ApiKey::RESOURCE_NAME;
    }

    /**
     * Return a transformed ApiKey model that can be consumed by external services.
     */
    public function transform(ApiKey $key): array
    {
        $permissions = collect(AdminAcl::getResourceList())->mapWithKeys(function (string $resource) use ($key) {
            return [$resource => (int) data_get($key, AdminAcl::COLUMN_IDENTIFIER . $resource, AdminAcl::NONE)];
        })->toArray();

        return [
            'id' => $key->id,
            'identifier' => $key->identifier,
            'token' => decrypt($key->token),
            'memo' => $key->memo,
            'last_used_at' => $key->last_used_at ? $this->formatTimestamp($key->last_used_at) : null,
            'created_at' => $this->formatTimestamp($key->created_at),
            'updated_at' => $this->formatTimestamp($key->updated_at),
            'permissions' => $permissions,
        ];
    }
}
