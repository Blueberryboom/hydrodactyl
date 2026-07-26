<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Traits\Helpers\AvailableLanguages;

class UpdateSettingsRequest extends GetSettingsRequest
{
    use AvailableLanguages;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'app:name' => 'required|string|max:191',
            'pterodactyl:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
        ];
    }

    public function normalize(?array $only = null): array
    {
        return $this->only([
            'app:name',
            'pterodactyl:auth:2fa_required',
            'app:locale',
        ]);
    }
}
