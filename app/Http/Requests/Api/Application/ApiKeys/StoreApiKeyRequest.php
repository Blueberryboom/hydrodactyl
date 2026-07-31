<?php

namespace Pterodactyl\Http\Requests\Api\Application\ApiKeys;

use Pterodactyl\Models\ApiKey;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreApiKeyRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SETTINGS;

    protected int $permission = AdminAcl::WRITE;

    /**
     * @throws \ReflectionException
     */
    public function rules(): array
    {
        $modelRules = ApiKey::getRules();

        return collect(AdminAcl::getResourceList())->filter(function ($resource) use ($modelRules) {
            return array_key_exists(AdminAcl::COLUMN_IDENTIFIER . $resource, $modelRules);
        })->mapWithKeys(function ($resource) use ($modelRules) {
            return [AdminAcl::COLUMN_IDENTIFIER . $resource => $modelRules['r_' . $resource]];
        })->merge(['memo' => $modelRules['memo']])->toArray();
    }

    public function attributes(): array
    {
        return [
            'memo' => 'Description',
        ];
    }

    public function getKeyPermissions(): array
    {
        return collect($this->validated())->filter(function ($value, $key) {
            return substr($key, 0, strlen(AdminAcl::COLUMN_IDENTIFIER)) === AdminAcl::COLUMN_IDENTIFIER;
        })->toArray();
    }
}
