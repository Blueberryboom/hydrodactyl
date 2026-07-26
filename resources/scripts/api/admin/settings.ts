import http from '@/api/http';

export interface AdminSettings {
    name: string;
    locale: string;
    twoFactorRequired: number;
}

export interface AdminSettingsResponse {
    settings: AdminSettings;
    languages: Record<string, string>;
}

export interface AdminSettingsPayload {
    'app:name': string;
    'app:locale': string;
    'pterodactyl:auth:2fa_required': number;
}

export interface AdminMailSettings {
    disabled: boolean;
    host: string;
    port: number;
    encryption: string;
    username: string;
    fromAddress: string;
    fromName: string;
}

export interface AdminMailSettingsPayload {
    'mail:mailers:smtp:host': string;
    'mail:mailers:smtp:port': number;
    'mail:mailers:smtp:encryption': string;
    'mail:mailers:smtp:username': string;
    'mail:mailers:smtp:password': string;
    'mail:from:address': string;
    'mail:from:name': string;
}

export type AdminCaptchaProvider = 'none' | 'turnstile' | 'hcaptcha' | 'recaptcha';

export interface AdminCaptchaSettings {
    provider: AdminCaptchaProvider;
    turnstileSiteKey: string;
    turnstileSecretKey: string;
    hcaptchaSiteKey: string;
    hcaptchaSecretKey: string;
    recaptchaSiteKey: string;
    recaptchaSecretKey: string;
}

export interface AdminCaptchaResponse {
    settings: AdminCaptchaSettings;
    providers: Record<string, string>;
}

export interface AdminCaptchaPayload {
    'pterodactyl:captcha:provider': AdminCaptchaProvider;
    'pterodactyl:captcha:turnstile:site_key': string;
    'pterodactyl:captcha:turnstile:secret_key': string;
    'pterodactyl:captcha:hcaptcha:site_key': string;
    'pterodactyl:captcha:hcaptcha:secret_key': string;
    'pterodactyl:captcha:recaptcha:site_key': string;
    'pterodactyl:captcha:recaptcha:secret_key': string;
}

export interface AdminAdvancedSettings {
    timeout: number;
    connectTimeout: number;
    allocationsEnabled: string;
    allocationRangeStart: number | null;
    allocationRangeEnd: number | null;
    eggChangeEnabled: string;
}

export interface AdminAdvancedPayload {
    'pterodactyl:guzzle:timeout': number;
    'pterodactyl:guzzle:connect_timeout': number;
    'pterodactyl:client_features:allocations:enabled': string;
    'pterodactyl:client_features:allocations:range_start': number | null;
    'pterodactyl:client_features:allocations:range_end': number | null;
    'pterodactyl:client_features:egg_changes:enabled': string;
}

export interface AdminCustomNavigationItem {
    label: string;
    url: string;
    icon: string;
}

export interface AdminCustomNavigationResponse {
    items: AdminCustomNavigationItem[];
    icons: Record<string, string>;
}

export interface AdminLogoHistoryItem {
    type: string;
    value: string;
    url: string;
}

export interface AdminLogoSettings {
    type: string | null;
    value: string | null;
    url: string | null;
    history: AdminLogoHistoryItem[];
}

export interface AdminDomainProvider {
    name: string;
    description: string;
}

export interface AdminDomain {
    id: number;
    name: string;
    dnsProvider: string;
    dnsConfig: Record<string, string>;
    isActive: boolean;
    isDefault: boolean;
    serverSubdomainsCount: number;
    activeSubdomainsCount: number;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface AdminDomainResponse {
    domain: AdminDomain;
    providers: Record<string, AdminDomainProvider>;
}

export interface AdminDomainsResponse {
    domains: AdminDomain[];
    providers: Record<string, AdminDomainProvider>;
}

export interface AdminDomainPayload {
    name: string;
    dns_provider: string;
    dns_config: Record<string, string>;
    is_active: boolean;
    is_default: boolean;
}

export interface AdminDomainSchemaField {
    type?: string;
    description?: string;
    required?: boolean;
    sensitive?: boolean;
}

interface RawSettingsResponse {
    data: {
        'app:name': string;
        'app:locale': string;
        'pterodactyl:auth:2fa_required': number;
    };
    meta: {
        languages: Record<string, string>;
    };
}

interface RawMailResponse {
    data: {
        disabled: boolean;
        'mail:mailers:smtp:host': string;
        'mail:mailers:smtp:port': number;
        'mail:mailers:smtp:encryption': string | null;
        'mail:mailers:smtp:username': string | null;
        'mail:from:address': string;
        'mail:from:name': string | null;
    };
}

interface RawCaptchaResponse {
    data: {
        'pterodactyl:captcha:provider': AdminCaptchaProvider;
        'pterodactyl:captcha:turnstile:site_key': string;
        'pterodactyl:captcha:turnstile:secret_key': string;
        'pterodactyl:captcha:hcaptcha:site_key': string;
        'pterodactyl:captcha:hcaptcha:secret_key': string;
        'pterodactyl:captcha:recaptcha:site_key': string;
        'pterodactyl:captcha:recaptcha:secret_key': string;
    };
    meta: {
        providers: Record<string, string>;
    };
}

interface RawAdvancedResponse {
    data: {
        'pterodactyl:guzzle:timeout': number;
        'pterodactyl:guzzle:connect_timeout': number;
        'pterodactyl:client_features:allocations:enabled': string;
        'pterodactyl:client_features:allocations:range_start': number | null;
        'pterodactyl:client_features:allocations:range_end': number | null;
        'pterodactyl:client_features:egg_changes:enabled': string;
    };
}

interface RawCustomNavigationResponse {
    data: {
        'app:custom_nav_items': AdminCustomNavigationItem[];
    };
    meta: {
        icons: Record<string, string>;
    };
}

interface RawLogoResponse {
    data: AdminLogoSettings;
}

interface RawDomain {
    id: number;
    name: string;
    dns_provider: string;
    dns_config: Record<string, string>;
    is_active: boolean;
    is_default: boolean;
    server_subdomains_count: number;
    active_subdomains_count: number;
    created_at: string | null;
    updated_at: string | null;
}

interface RawDomainsResponse {
    data: RawDomain[];
    meta: {
        providers: Record<string, AdminDomainProvider>;
    };
}

interface RawDomainResponse {
    data: RawDomain;
    meta: {
        providers: Record<string, AdminDomainProvider>;
    };
}

const rawDataToSettings = (data: RawSettingsResponse): AdminSettingsResponse => ({
    settings: {
        name: data.data['app:name'],
        locale: data.data['app:locale'],
        twoFactorRequired: Number(data.data['pterodactyl:auth:2fa_required']),
    },
    languages: data.meta.languages,
});

const rawDataToMailSettings = (data: RawMailResponse): AdminMailSettings => ({
    disabled: data.data.disabled,
    host: data.data['mail:mailers:smtp:host'],
    port: Number(data.data['mail:mailers:smtp:port']),
    encryption: data.data['mail:mailers:smtp:encryption'] ?? '',
    username: data.data['mail:mailers:smtp:username'] ?? '',
    fromAddress: data.data['mail:from:address'],
    fromName: data.data['mail:from:name'] ?? '',
});

const rawDataToCaptchaSettings = (data: RawCaptchaResponse): AdminCaptchaResponse => ({
    settings: {
        provider: data.data['pterodactyl:captcha:provider'],
        turnstileSiteKey: data.data['pterodactyl:captcha:turnstile:site_key'],
        turnstileSecretKey: data.data['pterodactyl:captcha:turnstile:secret_key'],
        hcaptchaSiteKey: data.data['pterodactyl:captcha:hcaptcha:site_key'],
        hcaptchaSecretKey: data.data['pterodactyl:captcha:hcaptcha:secret_key'],
        recaptchaSiteKey: data.data['pterodactyl:captcha:recaptcha:site_key'],
        recaptchaSecretKey: data.data['pterodactyl:captcha:recaptcha:secret_key'],
    },
    providers: data.meta.providers,
});

const rawDataToAdvancedSettings = (data: RawAdvancedResponse): AdminAdvancedSettings => ({
    timeout: Number(data.data['pterodactyl:guzzle:timeout']),
    connectTimeout: Number(data.data['pterodactyl:guzzle:connect_timeout']),
    allocationsEnabled: data.data['pterodactyl:client_features:allocations:enabled'],
    allocationRangeStart: data.data['pterodactyl:client_features:allocations:range_start'],
    allocationRangeEnd: data.data['pterodactyl:client_features:allocations:range_end'],
    eggChangeEnabled: data.data['pterodactyl:client_features:egg_changes:enabled'],
});

const rawDataToCustomNavigation = (data: RawCustomNavigationResponse): AdminCustomNavigationResponse => ({
    items: data.data['app:custom_nav_items'],
    icons: data.meta.icons,
});

const rawDataToDomain = (data: RawDomain): AdminDomain => ({
    id: data.id,
    name: data.name,
    dnsProvider: data.dns_provider,
    dnsConfig: data.dns_config,
    isActive: data.is_active,
    isDefault: data.is_default,
    serverSubdomainsCount: data.server_subdomains_count,
    activeSubdomainsCount: data.active_subdomains_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
});

export const getAdminSettings = async (): Promise<AdminSettingsResponse> => {
    const { data } = await http.get<RawSettingsResponse>('/api/application/settings');

    return rawDataToSettings(data);
};

export const updateAdminSettings = async (payload: AdminSettingsPayload): Promise<AdminSettingsResponse> => {
    const { data } = await http.patch<RawSettingsResponse>('/api/application/settings', payload);

    return rawDataToSettings(data);
};

export const getAdminMailSettings = async (): Promise<AdminMailSettings> => {
    const { data } = await http.get<RawMailResponse>('/api/application/settings/mail');

    return rawDataToMailSettings(data);
};

export const updateAdminMailSettings = async (payload: AdminMailSettingsPayload): Promise<AdminMailSettings> => {
    const { data } = await http.patch<RawMailResponse>('/api/application/settings/mail', payload);

    return rawDataToMailSettings(data);
};

export const testAdminMailSettings = async (): Promise<void> => {
    await http.post('/api/application/settings/mail/test');
};

export const getAdminCaptchaSettings = async (): Promise<AdminCaptchaResponse> => {
    const { data } = await http.get<RawCaptchaResponse>('/api/application/settings/captcha');

    return rawDataToCaptchaSettings(data);
};

export const updateAdminCaptchaSettings = async (payload: AdminCaptchaPayload): Promise<AdminCaptchaResponse> => {
    const { data } = await http.patch<RawCaptchaResponse>('/api/application/settings/captcha', payload);

    return rawDataToCaptchaSettings(data);
};

export const getAdminAdvancedSettings = async (): Promise<AdminAdvancedSettings> => {
    const { data } = await http.get<RawAdvancedResponse>('/api/application/settings/advanced');

    return rawDataToAdvancedSettings(data);
};

export const updateAdminAdvancedSettings = async (payload: AdminAdvancedPayload): Promise<AdminAdvancedSettings> => {
    const { data } = await http.patch<RawAdvancedResponse>('/api/application/settings/advanced', payload);

    return rawDataToAdvancedSettings(data);
};

export const getAdminCustomNavigationSettings = async (): Promise<AdminCustomNavigationResponse> => {
    const { data } = await http.get<RawCustomNavigationResponse>('/api/application/settings/custom-navigation');

    return rawDataToCustomNavigation(data);
};

export const updateAdminCustomNavigationSettings = async (
    items: AdminCustomNavigationItem[],
): Promise<AdminCustomNavigationResponse> => {
    const { data } = await http.patch<RawCustomNavigationResponse>('/api/application/settings/custom-navigation', {
        'app:custom_nav_items': items,
    });

    return rawDataToCustomNavigation(data);
};

export const getAdminLogoSettings = async (): Promise<AdminLogoSettings> => {
    const { data } = await http.get<RawLogoResponse>('/api/application/settings/logo');

    return data.data;
};

export const updateAdminLogoSettings = async (formData: FormData): Promise<AdminLogoSettings> => {
    formData.set('_method', 'PATCH');

    const { data } = await http.post<RawLogoResponse>('/api/application/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.data;
};

export const getAdminDomains = async (): Promise<AdminDomainsResponse> => {
    const { data } = await http.get<RawDomainsResponse>('/api/application/settings/domains');

    return {
        domains: data.data.map(rawDataToDomain),
        providers: data.meta.providers,
    };
};

export const getAdminDomain = async (id: string): Promise<AdminDomainResponse> => {
    const { data } = await http.get<RawDomainResponse>(`/api/application/settings/domains/${id}`);

    return {
        domain: rawDataToDomain(data.data),
        providers: data.meta.providers,
    };
};

export const createAdminDomain = async (payload: AdminDomainPayload): Promise<AdminDomain> => {
    const { data } = await http.post<{ data: RawDomain }>('/api/application/settings/domains', payload);

    return rawDataToDomain(data.data);
};

export const updateAdminDomain = async (id: number, payload: AdminDomainPayload): Promise<AdminDomain> => {
    const { data } = await http.patch<{ data: RawDomain }>(`/api/application/settings/domains/${id}`, payload);

    return rawDataToDomain(data.data);
};

export const deleteAdminDomain = async (id: number): Promise<void> => {
    await http.delete(`/api/application/settings/domains/${id}`);
};

export const getAdminDomainProviderSchema = async (
    provider: string,
): Promise<Record<string, AdminDomainSchemaField>> => {
    const { data } = await http.get<{ data: Record<string, AdminDomainSchemaField> }>(
        `/api/application/settings/domains/schema/${provider}`,
    );

    return data.data;
};

export const testAdminDomainConnection = async (payload: AdminDomainPayload): Promise<string> => {
    const { data } = await http.post<{ message: string }>('/api/application/settings/domains/test', payload);

    return data.message;
};
