<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class TestS3ConnectionRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SETTINGS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'access_key' => 'required|string',
            'secret_key' => 'required|string',
            'bucket_name' => 'required|string',
            'endpoint' => 'nullable|string',
            'region' => 'nullable|string|max:64',
            'use_path_style_endpoint' => 'nullable|boolean',
        ];
    }
}
