import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminSettingsPayload } from '@/api/admin/settings';
import { getAdminSettings, updateAdminSettings } from '@/api/admin/settings';
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

const SettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings', getAdminSettings);
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(undefined);

        const formData = new FormData(event.currentTarget);
        const payload: AdminSettingsPayload = {
            'app:name': String(formData.get('app:name') ?? ''),
            'app:locale': String(formData.get('app:locale') ?? ''),
            'pterodactyl:auth:2fa_required': Number(formData.get('pterodactyl:auth:2fa_required') ?? 0),
        };

        try {
            const settings = await updateAdminSettings(payload);
            await mutate(settings, false);
            toast.success('Settings saved.');
            setSubmitting(false);
        } catch (error) {
            setSubmitError(error);
            setSubmitting(false);
        }
    };

    return (
        <AdminPage title='Settings' description='Configure general panel behavior and defaults.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data && (
                <form className='flex max-w-4xl flex-col gap-4' onSubmit={handleSubmit}>
                    <AdminCard className='grid gap-4 xl:grid-cols-2'>
                        <AdminField
                            id='app:name'
                            label='Company Name'
                            description='Displayed throughout the panel and in outgoing emails.'
                        >
                            <input
                                id='app:name'
                                name='app:name'
                                required
                                defaultValue={data.settings.name}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField
                            id='app:locale'
                            label='Default Language'
                            description='Default language for panel UI components.'
                        >
                            <select
                                id='app:locale'
                                name='app:locale'
                                required
                                defaultValue={data.settings.locale}
                                className={adminInputClass}
                            >
                                {Object.entries(data.languages).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </AdminField>
                    </AdminCard>

                    <AdminCard className='flex flex-col gap-4'>
                        <div>
                            <h2 className='text-lg font-semibold'>Security</h2>
                            <p className='mt-1 text-sm text-white/55'>
                                Accounts in the selected group must have 2FA enabled to use the panel.
                            </p>
                        </div>
                        <div className='grid gap-3 md:grid-cols-3'>
                            {[
                                ['0', 'Not Required'],
                                ['1', 'Admin Only'],
                                ['2', 'All Users'],
                            ].map(([value, label]) => (
                                <label
                                    key={value}
                                    className='flex items-center gap-2 rounded-xl border border-mocha-400 bg-white/[0.04] p-3 text-sm text-white/75'
                                >
                                    <input
                                        type='radio'
                                        name='pterodactyl:auth:2fa_required'
                                        value={value}
                                        defaultChecked={String(data.settings.twoFactorRequired) === value}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </AdminCard>

                    <AdminSubmitRow isSubmitting={isSubmitting} submitLabel='Save Settings' cancelTo='/admin' />
                </form>
            )}
        </AdminPage>
    );
};

export default SettingsContainer;
