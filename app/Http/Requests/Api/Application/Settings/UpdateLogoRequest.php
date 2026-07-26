<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Pterodactyl\Services\Acl\Api\AdminAcl;

class UpdateLogoRequest extends GetSettingsRequest
{
    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'logo_file' => 'nullable|file|mimes:png,jpg,jpeg,gif,webp,svg|max:2048',
            'logo_url' => 'nullable|url|max:2048',
            'remove' => 'nullable|boolean',
            'rewind' => 'nullable|integer|min:0',
        ];
    }
}
