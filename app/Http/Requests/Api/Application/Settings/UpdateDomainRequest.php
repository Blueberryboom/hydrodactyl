<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Domain;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class UpdateDomainRequest extends GetSettingsRequest
{
    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        $domain = $this->route('domain');

        return [
            'name' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/',
                Rule::unique('domains', 'name')->ignore($domain instanceof Domain ? $domain->id : null),
            ],
            'dns_provider' => ['required', 'string', Rule::in(Providers::values())],
            'dns_config' => 'required|array',
            'dns_config.api_token' => 'required_if:dns_provider,cloudflare,hetzner,dnsimple|string|min:1',
            'dns_config.access_key_id' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.secret_access_key' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.region' => 'sometimes|string|min:1',
            'dns_config.hosted_zone_id' => 'sometimes|string|min:1',
            'dns_config.zone_id' => 'sometimes|string|min:1',
            'dns_config.api_key' => 'required_if:dns_provider,bunny|string|min:1',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge(['name' => strtolower(trim($this->input('name')))]);
        }

        foreach (['is_active', 'is_default'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN)]);
            }
        }
    }
}
