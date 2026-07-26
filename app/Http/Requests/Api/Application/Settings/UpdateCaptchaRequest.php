<?php

namespace Pterodactyl\Http\Requests\Api\Application\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class UpdateCaptchaRequest extends GetSettingsRequest
{
    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        return [
            'pterodactyl:captcha:provider' => ['required', 'string', Rule::in(['none', 'turnstile', 'hcaptcha', 'recaptcha'])],
            'pterodactyl:captcha:turnstile:site_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,turnstile'],
            'pterodactyl:captcha:turnstile:secret_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,turnstile'],
            'pterodactyl:captcha:hcaptcha:site_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,hcaptcha'],
            'pterodactyl:captcha:hcaptcha:secret_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,hcaptcha'],
            'pterodactyl:captcha:recaptcha:site_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,recaptcha'],
            'pterodactyl:captcha:recaptcha:secret_key' => ['nullable', 'string', 'max:255', 'required_if:pterodactyl:captcha:provider,recaptcha'],
        ];
    }

    public function normalize(?array $only = null): array
    {
        $data = $this->validated();
        $providers = ['turnstile', 'hcaptcha', 'recaptcha'];

        foreach ($providers as $provider) {
            if ($data['pterodactyl:captcha:provider'] !== $provider) {
                $data["pterodactyl:captcha:{$provider}:site_key"] = '';
                $data["pterodactyl:captcha:{$provider}:secret_key"] = '';
            }
        }

        return $data;
    }
}
