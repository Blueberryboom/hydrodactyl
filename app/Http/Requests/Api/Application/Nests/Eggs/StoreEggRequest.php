<?php

namespace Pterodactyl\Http\Requests\Api\Application\Nests\Eggs;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreEggRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_EGGS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:191',
            'description' => 'nullable|string',
            'docker_images' => 'required|array|min:1',
            'docker_images.*' => [
                'required',
                'string',
                'max:191',
                'regex:/^[\w#\.\/\- ]*\|?~?[\w\.\/\-:@ ]*$/',
            ],
            'force_outgoing_ip' => 'sometimes|boolean',
            'file_denylist' => 'sometimes|array',
            'file_denylist.*' => 'string',
            'features' => 'sometimes|array',
            'features.*' => 'string',
            'startup' => 'required|string',
            'config_from' => 'sometimes|bail|nullable|numeric',
            'config_stop' => 'required_without:config_from|nullable|string|max:191',
            'config_startup' => 'required_without:config_from|nullable|json',
            'config_logs' => 'required_without:config_from|nullable|json',
            'config_files' => 'required_without:config_from|nullable|json',
            'copy_script_from' => 'sometimes|bail|nullable|numeric',
            'script_is_privileged' => 'sometimes|boolean',
            'script_install' => 'nullable|string',
            'script_entry' => 'required|string',
            'script_container' => 'required|string|max:191',
        ];
    }
}
