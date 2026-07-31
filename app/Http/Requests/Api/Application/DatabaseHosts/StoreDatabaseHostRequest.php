<?php

namespace Pterodactyl\Http\Requests\Api\Application\DatabaseHosts;

use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreDatabaseHostRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_DATABASE_HOSTS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return DatabaseHost::getRules();
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        $data['node_id'] = array_get($data, 'node_id') ?: null;

        return $data;
    }
}
