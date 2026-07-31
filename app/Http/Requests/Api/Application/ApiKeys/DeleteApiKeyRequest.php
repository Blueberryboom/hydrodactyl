<?php

namespace Pterodactyl\Http\Requests\Api\Application\ApiKeys;

use Pterodactyl\Services\Acl\Api\AdminAcl as Acl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class DeleteApiKeyRequest extends ApplicationApiRequest
{
    protected ?string $resource = Acl::RESOURCE_SETTINGS;

    protected int $permission = Acl::WRITE;
}
