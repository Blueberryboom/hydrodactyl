<?php

namespace Pterodactyl\Http\Requests\Api\Application\DatabaseHosts;

use Pterodactyl\Services\Acl\Api\AdminAcl;

class DeleteDatabaseHostRequest extends GetDatabaseHostsRequest
{
    protected int $permission = AdminAcl::WRITE;
}
