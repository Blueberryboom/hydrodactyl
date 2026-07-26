import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminAdvancedPayload } from '@/api/admin/settings';
import { getAdminAdvancedSettings, updateAdminAdvancedSettings } from '@/api/admin/settings';
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

const nullableNumber = (value: FormDataEntryValue | null): number | null => {
    const stringValue = String(value ?? '');

    return stringValue === '' ? null : Number(stringValue);
};

const AdvancedSettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:advanced', getAdminAdvancedSettings);
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(undefined);

        const formData = new FormData(event.currentTarget);
        const payload: AdminAdvancedPayload = {
            'pterodactyl:guzzle:timeout': Number(formData.get('pterodactyl:guzzle:timeout') ?? 30),
            'pterodactyl:guzzle:connect_timeout': Number(formData.get('pterodactyl:guzzle:connect_timeout') ?? 10),
            'pterodactyl:client_features:allocations:enabled': String(
                formData.get('pterodactyl:client_features:allocations:enabled') ?? 'false',
            ),
            'pterodactyl:client_features:allocations:range_start': nullableNumber(
                formData.get('pterodactyl:client_features:allocations:range_start'),
            ),
            'pterodactyl:client_features:allocations:range_end': nullableNumber(
                formData.get('pterodactyl:client_features:allocations:range_end'),
            ),
            'pterodactyl:client_features:egg_changes:enabled': String(
                formData.get('pterodactyl:client_features:egg_changes:enabled') ?? 'true',
            ),
        };

        try {
            const settings = await updateAdminAdvancedSettings(payload);
            await mutate(settings, false);
            toast.success('Advanced settings saved.');
        } catch (error) {
            setSubmitError(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminPage title='Advanced Settings' description='Configure advanced panel and daemon behavior.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data && (
                <form className='flex max-w-5xl flex-col gap-4' onSubmit={handleSubmit}>
                    <AdminCard className='grid gap-4 md:grid-cols-2'>
                        <AdminField
                            id='pterodactyl:guzzle:connect_timeout'
                            label='Connection Timeout'
                            description='Seconds to wait before timing out a connection attempt.'
                        >
                            <input
                                name='pterodactyl:guzzle:connect_timeout'
                                type='number'
                                min={1}
                                max={60}
                                defaultValue={data.connectTimeout}
                                required
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField
                            id='pterodactyl:guzzle:timeout'
                            label='Request Timeout'
                            description='Seconds to wait before timing out an active request.'
                        >
                            <input
                                name='pterodactyl:guzzle:timeout'
                                type='number'
                                min={1}
                                max={60}
                                defaultValue={data.timeout}
                                required
                                className={adminInputClass}
                            />
                        </AdminField>
                    </AdminCard>
                    <AdminCard className='grid gap-4 md:grid-cols-3'>
                        <AdminField id='pterodactyl:client_features:allocations:enabled' label='Automatic Allocations'>
                            <select
                                name='pterodactyl:client_features:allocations:enabled'
                                defaultValue={data.allocationsEnabled}
                                className={adminInputClass}
                            >
                                <option value='false'>Disabled</option>
                                <option value='true'>Enabled</option>
                            </select>
                        </AdminField>
                        <AdminField id='pterodactyl:client_features:allocations:range_start' label='Starting Port'>
                            <input
                                name='pterodactyl:client_features:allocations:range_start'
                                type='number'
                                min={1024}
                                max={65535}
                                defaultValue={data.allocationRangeStart ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='pterodactyl:client_features:allocations:range_end' label='Ending Port'>
                            <input
                                name='pterodactyl:client_features:allocations:range_end'
                                type='number'
                                min={1024}
                                max={65535}
                                defaultValue={data.allocationRangeEnd ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                    </AdminCard>
                    <AdminCard className='grid gap-4'>
                        <AdminField
                            id='pterodactyl:client_features:egg_changes:enabled'
                            label='Allow Server Software Changes'
                            description='Controls whether users are allowed to change their server software (egg).'
                        >
                            <select
                                name='pterodactyl:client_features:egg_changes:enabled'
                                defaultValue={data.eggChangeEnabled}
                                className={adminInputClass}
                            >
                                <option value='true'>Yes</option>
                                <option value='only_same_nest'>Only same nest</option>
                                <option value='false'>No</option>
                            </select>
                        </AdminField>
                    </AdminCard>
                    <AdminSubmitRow
                        isSubmitting={isSubmitting}
                        submitLabel='Save Advanced Settings'
                        cancelTo='/admin/settings'
                    />
                </form>
            )}
        </AdminPage>
    );
};

export default AdvancedSettingsContainer;
