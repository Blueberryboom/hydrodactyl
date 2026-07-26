<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Settings;

use Pterodactyl\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Enums\Captcha\Captchas;
use Pterodactyl\Enums\Subdomain\Providers;
use Pterodactyl\Services\Admin\LogoService;
use Illuminate\Support\Facades\Notification;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Providers\SettingsServiceProvider;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Api\Application\Settings\GetSettingsRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateLogoRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateMailRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\WriteSettingsRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateDomainRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateCaptchaRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateSettingsRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateAdvancedRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\TestDomainConnectionRequest;
use Pterodactyl\Http\Requests\Api\Application\Settings\UpdateCustomNavigationRequest;

class SettingsController extends ApplicationApiController
{
    use AvailableLanguages;

    public function __construct(
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private LogoService $logoService,
        private SettingsRepositoryInterface $settings,
    ) {
        parent::__construct();
    }

    public function index(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'app:name' => $this->settings->get('settings::app:name', config('app.name')),
                'app:locale' => $this->settings->get('settings::app:locale', config('app.locale')),
                'pterodactyl:auth:2fa_required' => (int) $this->settings->get(
                    'settings::pterodactyl:auth:2fa_required',
                    config('pterodactyl.auth.2fa_required')
                ),
            ],
            'meta' => [
                'languages' => $this->getAvailableLanguages(true),
            ],
        ]);
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');

        return $this->index($request);
    }

    public function mail(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'disabled' => $this->config->get('mail.default') !== 'smtp',
                'mail:mailers:smtp:host' => $this->config->get('mail.mailers.smtp.host'),
                'mail:mailers:smtp:port' => $this->config->get('mail.mailers.smtp.port'),
                'mail:mailers:smtp:encryption' => $this->config->get('mail.mailers.smtp.encryption'),
                'mail:mailers:smtp:username' => $this->config->get('mail.mailers.smtp.username'),
                'mail:from:address' => $this->config->get('mail.from.address'),
                'mail:from:name' => $this->config->get('mail.from.name'),
            ],
        ]);
    }

    public function updateMail(UpdateMailRequest $request): JsonResponse
    {
        $values = $request->normalize();
        if (array_get($values, 'mail:mailers:smtp:password') === '!e') {
            $values['mail:mailers:smtp:password'] = '';
        }

        $this->setSettings($values);
        $this->kernel->call('queue:restart');

        return $this->mail($request);
    }

    public function testMail(WriteSettingsRequest $request): JsonResponse
    {
        Notification::route('mail', $request->user()->email)
            ->notify(new MailTested($request->user()));

        return new JsonResponse(['success' => true]);
    }

    public function captcha(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'pterodactyl:captcha:provider' => $this->config->get('pterodactyl.captcha.provider', 'none'),
                'pterodactyl:captcha:turnstile:site_key' => $this->config->get('pterodactyl.captcha.turnstile.site_key', ''),
                'pterodactyl:captcha:turnstile:secret_key' => $this->config->get('pterodactyl.captcha.turnstile.secret_key', ''),
                'pterodactyl:captcha:hcaptcha:site_key' => $this->config->get('pterodactyl.captcha.hcaptcha.site_key', ''),
                'pterodactyl:captcha:hcaptcha:secret_key' => $this->config->get('pterodactyl.captcha.hcaptcha.secret_key', ''),
                'pterodactyl:captcha:recaptcha:site_key' => $this->config->get('pterodactyl.captcha.recaptcha.site_key', ''),
                'pterodactyl:captcha:recaptcha:secret_key' => $this->config->get('pterodactyl.captcha.recaptcha.secret_key', ''),
            ],
            'meta' => [
                'providers' => Captchas::all(),
            ],
        ]);
    }

    public function updateCaptcha(UpdateCaptchaRequest $request): JsonResponse
    {
        $this->setSettings($request->normalize());
        $this->kernel->call('queue:restart');

        return $this->captcha($request);
    }

    public function advanced(GetSettingsRequest $request): JsonResponse
    {
        $eggChanges = $this->config->get('pterodactyl.client_features.egg_changes.enabled', 'true');

        return new JsonResponse([
            'data' => [
                'pterodactyl:guzzle:timeout' => $this->config->get('pterodactyl.guzzle.timeout'),
                'pterodactyl:guzzle:connect_timeout' => $this->config->get('pterodactyl.guzzle.connect_timeout'),
                'pterodactyl:client_features:allocations:enabled' => $this->config->get('pterodactyl.client_features.allocations.enabled') ? 'true' : 'false',
                'pterodactyl:client_features:allocations:range_start' => $this->config->get('pterodactyl.client_features.allocations.range_start'),
                'pterodactyl:client_features:allocations:range_end' => $this->config->get('pterodactyl.client_features.allocations.range_end'),
                'pterodactyl:client_features:egg_changes:enabled' => is_bool($eggChanges) ? ($eggChanges ? 'true' : 'false') : $eggChanges,
            ],
        ]);
    }

    public function updateAdvanced(UpdateAdvancedRequest $request): JsonResponse
    {
        $this->setSettings($request->normalize());
        $this->kernel->call('queue:restart');

        return $this->advanced($request);
    }

    public function customNavigation(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'app:custom_nav_items' => $this->customNavigationItems(),
            ],
            'meta' => [
                'icons' => $this->customNavigationIcons(),
            ],
        ]);
    }

    public function updateCustomNavigation(UpdateCustomNavigationRequest $request): JsonResponse
    {
        $this->setSettings($request->normalize());
        $this->kernel->call('queue:restart');

        return $this->customNavigation($request);
    }

    public function logo(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'type' => $this->logoService->getCurrentType(),
                'url' => $this->logoService->getCurrentUrl(),
                'value' => $this->logoService->getCurrentValue(),
                'history' => array_map(fn (array $entry) => [
                    'type' => $entry['type'],
                    'value' => $entry['value'],
                    'url' => $entry['type'] === 'upload' ? url('storage/' . $entry['value']) : $entry['value'],
                ], $this->logoService->getHistory()),
            ],
        ]);
    }

    public function updateLogo(UpdateLogoRequest $request): JsonResponse
    {
        $this->logoService->handle($request->validated());
        $this->kernel->call('queue:restart');

        return $this->logo($request);
    }

    public function domains(GetSettingsRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => Domain::withCount('serverSubdomains')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn (Domain $domain) => $this->serializeDomain($domain))
                ->values(),
            'meta' => [
                'providers' => Providers::allWithDescriptions(),
            ],
        ]);
    }

    public function domain(GetSettingsRequest $request, Domain $domain): JsonResponse
    {
        $domain->loadCount('serverSubdomains')->load('serverSubdomains');

        return new JsonResponse([
            'data' => $this->serializeDomain($domain, true),
            'meta' => [
                'providers' => Providers::allWithDescriptions(),
            ],
        ]);
    }

    public function storeDomain(UpdateDomainRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->testProviderConnection($data['dns_provider'], $data['dns_config']);

        $domain = DB::transaction(function () use ($data) {
            if (!empty($data['is_default'])) {
                Domain::where('is_default', true)->update(['is_default' => false]);
            }

            return Domain::create([
                'name' => $data['name'],
                'dns_provider' => $data['dns_provider'],
                'dns_config' => $data['dns_config'],
                'is_active' => $data['is_active'] ?? true,
                'is_default' => $data['is_default'] ?? false,
            ]);
        });

        $domain->loadCount('serverSubdomains');

        return new JsonResponse(['data' => $this->serializeDomain($domain)], 201);
    }

    public function updateDomain(UpdateDomainRequest $request, Domain $domain): JsonResponse
    {
        $data = $request->validated();
        if ($data['dns_config'] !== $domain->dns_config || $data['dns_provider'] !== $domain->dns_provider) {
            $this->testProviderConnection($data['dns_provider'], $data['dns_config']);
        }

        DB::transaction(function () use ($data, $domain) {
            $newIsDefault = $data['is_default'] ?? false;
            if ($newIsDefault && !$domain->is_default) {
                Domain::where('is_default', true)->update(['is_default' => false]);
            } elseif (!$newIsDefault && $domain->is_default && Domain::where('is_default', true)->count() <= 1) {
                throw new \Exception('Cannot remove default status: At least one domain must be set as default.');
            }

            $domain->update([
                'name' => $data['name'],
                'dns_provider' => $data['dns_provider'],
                'dns_config' => $data['dns_config'],
                'is_active' => $data['is_active'] ?? $domain->is_active,
                'is_default' => $newIsDefault,
            ]);
        });

        $domain->refresh()->loadCount('serverSubdomains')->load('serverSubdomains');

        return new JsonResponse(['data' => $this->serializeDomain($domain, true)]);
    }

    public function deleteDomain(WriteSettingsRequest $request, Domain $domain): JsonResponse
    {
        $activeSubdomains = $domain->activeSubdomains()->count();
        if ($activeSubdomains > 0) {
            throw new \Exception("Cannot delete domain with {$activeSubdomains} active subdomains.");
        }

        if ($domain->is_default && Domain::where('is_default', true)->count() <= 1) {
            throw new \Exception('Cannot delete the only default domain. Please set another domain as default first.');
        }

        $domain->delete();

        return new JsonResponse([], 204);
    }

    public function domainProviderSchema(GetSettingsRequest $request, string $provider): JsonResponse
    {
        $providerClass = $this->getProviderClass($provider);
        $providerInstance = new $providerClass([]);

        return new JsonResponse(['data' => $providerInstance->getConfigurationSchema()]);
    }

    public function testDomainConnection(TestDomainConnectionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->testProviderConnection($data['dns_provider'], $data['dns_config']);

        return new JsonResponse(['success' => true, 'message' => 'Connection successful.']);
    }

    private function setSettings(array $values): void
    {
        foreach ($values as $key => $value) {
            if (in_array($key, SettingsServiceProvider::getEncryptedKeys(), true) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }
    }

    private function customNavigationItems(): array
    {
        $decoded = json_decode((string) $this->config->get('app.custom_nav_items', '[]'), true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    private function customNavigationIcons(): array
    {
        return [
            'link' => 'Link',
            'book' => 'Book',
            'globe' => 'Globe',
            'help' => 'Help',
            'home' => 'Home',
            'store' => 'Store',
            'discord' => 'Discord',
            'document' => 'Document',
            'terminal' => 'Terminal',
            'rocket' => 'Rocket',
        ];
    }

    private function serializeDomain(Domain $domain, bool $includeConfig = false): array
    {
        return [
            'id' => $domain->id,
            'name' => $domain->name,
            'dns_provider' => $domain->dns_provider,
            'dns_config' => $includeConfig ? $domain->dns_config : [],
            'is_active' => $domain->is_active,
            'is_default' => $domain->is_default,
            'server_subdomains_count' => $domain->server_subdomains_count ?? $domain->serverSubdomains()->count(),
            'active_subdomains_count' => $domain->relationLoaded('serverSubdomains') ? $domain->serverSubdomains->where('is_active', true)->count() : $domain->activeSubdomains()->count(),
            'created_at' => $domain->created_at?->toIso8601String(),
            'updated_at' => $domain->updated_at?->toIso8601String(),
        ];
    }

    private function testProviderConnection(string $provider, array $config): void
    {
        $providerClass = $this->getProviderClass($provider);
        (new $providerClass($config))->testConnection();
    }

    private function getProviderClass(string $provider): string
    {
        return Providers::getClass($provider);
    }
}
