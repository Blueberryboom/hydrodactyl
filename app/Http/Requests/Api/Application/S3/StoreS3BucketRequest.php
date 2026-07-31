<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreS3BucketRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SETTINGS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:s3,name',
            'description' => 'nullable|string|max:1000',
            'access_key' => 'required|string|max:255',
            'secret_key' => 'required|string|max:255',
            'endpoint' => 'nullable|url|max:255',
            'region' => 'nullable|string|max:64',
            'bucket_name' => 'required|string|max:255',
            'use_path_style_endpoint' => 'boolean',
            'enabled' => 'boolean',
        ];
    }

    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        $validated['region'] = trim((string) ($validated['region'] ?? '')) ?: 'us-east-1';
        $validated['use_path_style_endpoint'] = (bool) ($validated['use_path_style_endpoint'] ?? false);
        $validated['enabled'] = (bool) ($validated['enabled'] ?? true);

        return $validated;
    }
}
