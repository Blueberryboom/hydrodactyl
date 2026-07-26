<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class GetSettingsRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SETTINGS;

    protected int $permission = AdminAcl::READ;
}
