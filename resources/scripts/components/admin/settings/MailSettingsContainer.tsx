import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminMailSettingsPayload } from '@/api/admin/settings';
import { getAdminMailSettings, testAdminMailSettings, updateAdminMailSettings } from '@/api/admin/settings';
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
import { Button } from '@/components/ui/button';

const MailSettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:mail', getAdminMailSettings);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isTesting, setTesting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const payloadFromForm = (form: HTMLFormElement): AdminMailSettingsPayload => {
        const formData = new FormData(form);

        return {
            'mail:mailers:smtp:host': String(formData.get('mail:mailers:smtp:host') ?? ''),
            'mail:mailers:smtp:port': Number(formData.get('mail:mailers:smtp:port') ?? 587),
            'mail:mailers:smtp:encryption': String(formData.get('mail:mailers:smtp:encryption') ?? ''),
            'mail:mailers:smtp:username': String(formData.get('mail:mailers:smtp:username') ?? ''),
            'mail:mailers:smtp:password': String(formData.get('mail:mailers:smtp:password') ?? ''),
            'mail:from:address': String(formData.get('mail:from:address') ?? ''),
            'mail:from:name': String(formData.get('mail:from:name') ?? ''),
        };
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(undefined);

        try {
            const settings = await updateAdminMailSettings(payloadFromForm(event.currentTarget));
            await mutate(settings, false);
            toast.success('Mail settings saved.');
        } catch (error) {
            setSubmitError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTest = async (form: HTMLFormElement) => {
        setTesting(true);
        setSubmitError(undefined);

        try {
            const settings = await updateAdminMailSettings(payloadFromForm(form));
            await mutate(settings, false);
            await testAdminMailSettings();
            toast.success('Test email sent.');
        } catch (error) {
            setSubmitError(error);
        } finally {
            setTesting(false);
        }
    };

    return (
        <AdminPage title='Mail Settings' description='Configure SMTP delivery and send a test email.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data?.disabled && (
                <AdminCard className='text-sm text-white/70'>
                    This interface requires the <code>smtp</code> mail driver. Set <code>MAIL_DRIVER=smtp</code> before
                    updating these settings.
                </AdminCard>
            )}
            {data && !data.disabled && (
                <form className='flex max-w-5xl flex-col gap-4' onSubmit={handleSubmit}>
                    <AdminCard className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        <AdminField id='mail:mailers:smtp:host' label='SMTP Host'>
                            <input
                                name='mail:mailers:smtp:host'
                                defaultValue={data.host}
                                required
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='mail:mailers:smtp:port' label='Port'>
                            <input
                                name='mail:mailers:smtp:port'
                                type='number'
                                defaultValue={data.port}
                                required
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='mail:mailers:smtp:encryption' label='Encryption'>
                            <select
                                name='mail:mailers:smtp:encryption'
                                defaultValue={data.encryption}
                                className={adminInputClass}
                            >
                                <option value=''>None</option>
                                <option value='tls'>TLS</option>
                                <option value='ssl'>SSL</option>
                            </select>
                        </AdminField>
                        <AdminField id='mail:mailers:smtp:username' label='Username'>
                            <input
                                name='mail:mailers:smtp:username'
                                defaultValue={data.username}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField
                            id='mail:mailers:smtp:password'
                            label='Password'
                            description='Leave blank to keep the existing password. Enter !e to set an empty password.'
                        >
                            <input name='mail:mailers:smtp:password' type='password' className={adminInputClass} />
                        </AdminField>
                        <AdminField id='mail:from:address' label='Mail From Address'>
                            <input
                                name='mail:from:address'
                                type='email'
                                defaultValue={data.fromAddress}
                                required
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='mail:from:name' label='Mail From Name'>
                            <input name='mail:from:name' defaultValue={data.fromName} className={adminInputClass} />
                        </AdminField>
                    </AdminCard>
                    <div className='flex flex-wrap gap-2'>
                        <AdminSubmitRow
                            isSubmitting={isSubmitting}
                            submitLabel='Save Mail Settings'
                            cancelTo='/admin/settings'
                        />
                        <Button
                            type='button'
                            variant='secondary'
                            disabled={isTesting}
                            onClick={(event) => {
                                if (event.currentTarget.form) {
                                    void handleTest(event.currentTarget.form);
                                }
                            }}
                        >
                            {isTesting ? 'Testing...' : 'Save and Test'}
                        </Button>
                    </div>
                </form>
            )}
        </AdminPage>
    );
};

export default MailSettingsContainer;
