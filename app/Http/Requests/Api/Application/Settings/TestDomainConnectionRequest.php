<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class TestDomainConnectionRequest extends GetSettingsRequest
{
    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'dns_provider' => ['required', 'string', Rule::in(Providers::values())],
            'dns_config' => 'required|array',
            'dns_config.api_token' => 'required_if:dns_provider,cloudflare,hetzner,dnsimple|string|min:1',
            'dns_config.access_key_id' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.secret_access_key' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.region' => 'sometimes|string|min:1',
            'dns_config.hosted_zone_id' => 'sometimes|string|min:1',
            'dns_config.zone_id' => 'sometimes|string|min:1',
            'dns_config.api_key' => 'required_if:dns_provider,bunny|string|min:1',
        ];
    }
}
