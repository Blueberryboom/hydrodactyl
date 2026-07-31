<?php

namespace Pterodactyl\Http\Requests\Api\Application\DatabaseHosts;

use Pterodactyl\Models\DatabaseHost;

class UpdateDatabaseHostRequest extends StoreDatabaseHostRequest
{
    public function rules(): array
    {
        return DatabaseHost::getRulesForUpdate($this->route()->parameter('databaseHost'));
    }
}
