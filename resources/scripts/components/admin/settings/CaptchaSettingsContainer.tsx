import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminCaptchaPayload, AdminCaptchaProvider, AdminCaptchaSettings } from '@/api/admin/settings';
import { getAdminCaptchaSettings, updateAdminCaptchaSettings } from '@/api/admin/settings';
import {
    AdminCard,
    AdminError,
    AdminField,
    AdminLoading,
    AdminPage,
    AdminSubmitRow,
    adminInputClass,
} from '@/components/admin/common';
import SettingsNav from '@/components/admin/settings/SettingsNav';

const providerFields: Record<Exclude<AdminCaptchaProvider, 'none'>, [string, string, string, string]> = {
    turnstile: [
        'Turnstile',
        'pterodactyl:captcha:turnstile:site_key',
        'pterodactyl:captcha:turnstile:secret_key',
        'Cloudflare Turnstile',
    ],
    hcaptcha: [
        'hCaptcha',
        'pterodactyl:captcha:hcaptcha:site_key',
        'pterodactyl:captcha:hcaptcha:secret_key',
        'hCaptcha',
    ],
    recaptcha: [
        'reCAPTCHA',
        'pterodactyl:captcha:recaptcha:site_key',
        'pterodactyl:captcha:recaptcha:secret_key',
        'Google reCAPTCHA v3',
    ],
};

const getProviderKeys = (settings: AdminCaptchaSettings, provider: Exclude<AdminCaptchaProvider, 'none'>) => {
    switch (provider) {
        case 'turnstile':
            return [settings.turnstileSiteKey, settings.turnstileSecretKey];
        case 'hcaptcha':
            return [settings.hcaptchaSiteKey, settings.hcaptchaSecretKey];
        case 'recaptcha':
            return [settings.recaptchaSiteKey, settings.recaptchaSecretKey];
    }

    return ['', ''];
};

const CaptchaSettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:captcha', getAdminCaptchaSettings);
    const [provider, setProvider] = useState<AdminCaptchaProvider>('none');
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const enabledProvider = provider === 'none' ? null : provider;
    const currentProvider = enabledProvider ? providerFields[enabledProvider] : null;

    useEffect(() => {
        if (data) {
            setProvider(data.settings.provider);
        }
    }, [data]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(undefined);

        const formData = new FormData(event.currentTarget);
        const payload = {
            'pterodactyl:captcha:provider': String(
                formData.get('pterodactyl:captcha:provider') ?? 'none',
            ) as AdminCaptchaProvider,
            'pterodactyl:captcha:turnstile:site_key': String(
                formData.get('pterodactyl:captcha:turnstile:site_key') ?? '',
            ),
            'pterodactyl:captcha:turnstile:secret_key': String(
                formData.get('pterodactyl:captcha:turnstile:secret_key') ?? '',
            ),
            'pterodactyl:captcha:hcaptcha:site_key': String(
                formData.get('pterodactyl:captcha:hcaptcha:site_key') ?? '',
            ),
            'pterodactyl:captcha:hcaptcha:secret_key': String(
                formData.get('pterodactyl:captcha:hcaptcha:secret_key') ?? '',
            ),
            'pterodactyl:captcha:recaptcha:site_key': String(
                formData.get('pterodactyl:captcha:recaptcha:site_key') ?? '',
            ),
            'pterodactyl:captcha:recaptcha:secret_key': String(
                formData.get('pterodactyl:captcha:recaptcha:secret_key') ?? '',
            ),
        } satisfies AdminCaptchaPayload;

        try {
            const settings = await updateAdminCaptchaSettings(payload);
            await mutate(settings, false);
            toast.success('Captcha settings saved.');
        } catch (error) {
            setSubmitError(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminPage title='Captcha Settings' description='Configure captcha protection for authentication forms.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data && (
                <form className='flex max-w-5xl flex-col gap-4' onSubmit={handleSubmit}>
                    <AdminCard className='grid gap-4 md:grid-cols-2'>
                        <AdminField id='pterodactyl:captcha:provider' label='Provider'>
                            <select
                                name='pterodactyl:captcha:provider'
                                defaultValue={data.settings.provider}
                                className={adminInputClass}
                                onChange={(event) => setProvider(event.currentTarget.value as AdminCaptchaProvider)}
                            >
                                {Object.entries(data.providers).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </AdminField>
                    </AdminCard>
                    {enabledProvider && currentProvider && (
                        <AdminCard className='grid gap-4 md:grid-cols-2'>
                            <div className='md:col-span-2'>
                                <h2 className='text-lg font-semibold'>{currentProvider[3]} Configuration</h2>
                                <p className='mt-1 text-sm text-white/55'>
                                    Copy the site key and secret key from your provider dashboard.
                                </p>
                            </div>
                            <AdminField id={currentProvider[1]} label='Site Key'>
                                <input
                                    name={currentProvider[1]}
                                    defaultValue={getProviderKeys(data.settings, enabledProvider)[0]}
                                    className={adminInputClass}
                                />
                            </AdminField>
                            <AdminField id={currentProvider[2]} label='Secret Key'>
                                <input
                                    name={currentProvider[2]}
                                    type='password'
                                    defaultValue={getProviderKeys(data.settings, enabledProvider)[1]}
                                    className={adminInputClass}
                                />
                            </AdminField>
                        </AdminCard>
                    )}
                    <AdminSubmitRow
                        isSubmitting={isSubmitting}
                        submitLabel='Save Captcha Settings'
                        cancelTo='/admin/settings'
                    />
                </form>
            )}
        </AdminPage>
    );
};

export default CaptchaSettingsContainer;
