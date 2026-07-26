<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Pterodactyl\Services\Acl\Api\AdminAcl;

class WriteSettingsRequest extends GetSettingsRequest
{
    protected int $permission = AdminAcl::WRITE;
}
