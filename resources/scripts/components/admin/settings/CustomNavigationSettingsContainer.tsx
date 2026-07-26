import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminCustomNavigationItem } from '@/api/admin/settings';
import { getAdminCustomNavigationSettings, updateAdminCustomNavigationSettings } from '@/api/admin/settings';
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

const itemAt = (items: AdminCustomNavigationItem[], index: number): AdminCustomNavigationItem =>
    items[index] ?? { label: '', url: '', icon: 'link' };

const CustomNavigationSettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:custom-navigation', getAdminCustomNavigationSettings);
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(undefined);

        const formData = new FormData(event.currentTarget);
        const items = [0, 1, 2].map((index) => ({
            label: String(formData.get(`items.${index}.label`) ?? ''),
            url: String(formData.get(`items.${index}.url`) ?? ''),
            icon: String(formData.get(`items.${index}.icon`) ?? 'link'),
        }));

        try {
            const settings = await updateAdminCustomNavigationSettings(items);
            await mutate(settings, false);
            toast.success('Custom navigation saved.');
        } catch (error) {
            setSubmitError(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminPage title='Custom Navigation' description='Add up to three custom sidebar links.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data && (
                <form className='flex max-w-5xl flex-col gap-4' onSubmit={handleSubmit}>
                    <AdminCard className='flex flex-col gap-4'>
                        {[0, 1, 2].map((index) => {
                            const item = itemAt(data.items, index);

                            return (
                                <div key={index} className='grid gap-4 md:grid-cols-[1fr_1.5fr_0.8fr]'>
                                    <AdminField id={`items.${index}.label`} label={`Item ${index + 1} Label`}>
                                        <input
                                            name={`items.${index}.label`}
                                            maxLength={32}
                                            defaultValue={item.label}
                                            placeholder='Documentation'
                                            className={adminInputClass}
                                        />
                                    </AdminField>
                                    <AdminField id={`items.${index}.url`} label={`Item ${index + 1} Link`}>
                                        <input
                                            name={`items.${index}.url`}
                                            maxLength={2048}
                                            defaultValue={item.url}
                                            placeholder='https://example.com or /account'
                                            className={adminInputClass}
                                        />
                                    </AdminField>
                                    <AdminField id={`items.${index}.icon`} label={`Item ${index + 1} Icon`}>
                                        <select
                                            name={`items.${index}.icon`}
                                            defaultValue={item.icon}
                                            className={adminInputClass}
                                        >
                                            {Object.entries(data.icons).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </AdminField>
                                </div>
                            );
                        })}
                    </AdminCard>
                    <AdminSubmitRow
                        isSubmitting={isSubmitting}
                        submitLabel='Save Navigation'
                        cancelTo='/admin/settings'
                    />
                </form>
            )}
        </AdminPage>
    );
};

export default CustomNavigationSettingsContainer;
