<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

use Pterodactyl\Services\Acl\Api\AdminAcl;

class DeleteS3BucketRequest extends GetS3BucketsRequest
{
    protected int $permission = AdminAcl::WRITE;
}
