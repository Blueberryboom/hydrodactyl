<?php

namespace Pterodactyl\Http\Requests\Api\Application\S3;

class UpdateS3BucketRequest extends StoreS3BucketRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:s3,name,' . $this->route('s3')->id,
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
}
