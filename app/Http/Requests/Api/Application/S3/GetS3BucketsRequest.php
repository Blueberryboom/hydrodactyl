<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class GetS3BucketsRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SETTINGS;

    protected int $permission = AdminAcl::READ;
}
