import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { getAdminLogoSettings, updateAdminLogoSettings } from '@/api/admin/settings';
import { AdminCard, AdminError, AdminField, AdminLoading, AdminPage, adminInputClass } from '@/components/admin/common';
import SettingsNav from '@/components/admin/settings/SettingsNav';
import { Button } from '@/components/ui/button';

const LogoSettingsContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:logo', getAdminLogoSettings);
    const [preview, setPreview] = useState<string>();
    const [isSubmitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<unknown>();

    const submitForm = async (formData: FormData, message: string) => {
        setSubmitting(true);
        setSubmitError(undefined);

        try {
            const settings = await updateAdminLogoSettings(formData);
            await mutate(settings, false);
            setPreview(undefined);
            toast.success(message);
        } catch (error) {
            setSubmitError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submitForm(new FormData(event.currentTarget), 'Logo settings saved.');
    };

    const handleRemove = () => {
        const formData = new FormData();
        formData.set('remove', '1');
        void submitForm(formData, 'Custom logo removed.');
    };

    const handleRewind = (index: number) => {
        const formData = new FormData();
        formData.set('rewind', String(index));
        void submitForm(formData, 'Logo restored from history.');
    };

    return (
        <AdminPage title='Branding' description='Customize the panel logo.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {submitError && <AdminError error={submitError} />}
            {data && (
                <div className='flex max-w-5xl flex-col gap-4'>
                    <AdminCard className='flex flex-col items-center gap-3 text-center'>
                        <h2 className='text-lg font-semibold'>Current Logo</h2>
                        {data.url ? (
                            <img
                                src={data.url}
                                alt='Current logo'
                                className='max-h-40 max-w-full rounded-xl border border-mocha-400 p-3'
                            />
                        ) : (
                            <div className='rounded-xl border border-mocha-400 p-8 text-sm text-white/50'>
                                Default panel logo
                            </div>
                        )}
                    </AdminCard>
                    <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                        <AdminCard className='grid gap-4 md:grid-cols-2'>
                            <AdminField
                                id='logo_file'
                                label='Upload Logo'
                                description='PNG, JPG, GIF, WEBP, or SVG up to 2MB.'
                            >
                                <input
                                    id='logo_file'
                                    name='logo_file'
                                    type='file'
                                    accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
                                    className={adminInputClass}
                                    onChange={(event) => {
                                        const file = event.currentTarget.files?.[0];
                                        setPreview(file ? URL.createObjectURL(file) : undefined);
                                    }}
                                />
                            </AdminField>
                            <AdminField
                                id='logo_url'
                                label='Or Use a URL'
                                description='Enter a direct link to an image hosted elsewhere.'
                            >
                                <input
                                    id='logo_url'
                                    name='logo_url'
                                    type='url'
                                    placeholder='https://example.com/logo.png'
                                    className={adminInputClass}
                                />
                            </AdminField>
                            {preview && (
                                <div className='md:col-span-2'>
                                    <img
                                        src={preview}
                                        alt='Upload preview'
                                        className='max-h-40 max-w-full rounded-xl border border-mocha-400 p-3'
                                    />
                                </div>
                            )}
                        </AdminCard>
                        <div className='flex flex-wrap gap-2'>
                            <Button type='submit' disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Logo'}
                            </Button>
                            {data.url && (
                                <Button
                                    type='button'
                                    variant='destructive'
                                    disabled={isSubmitting}
                                    onClick={handleRemove}
                                >
                                    Remove Logo
                                </Button>
                            )}
                        </div>
                    </form>
                    {data.history.length > 0 && (
                        <AdminCard className='flex flex-col gap-4'>
                            <div>
                                <h2 className='text-lg font-semibold'>Logo History</h2>
                                <p className='mt-1 text-sm text-white/55'>Last 10 uploaded or linked logos.</p>
                            </div>
                            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
                                {data.history.map((entry, index) => (
                                    <button
                                        key={`${entry.type}:${entry.value}`}
                                        type='button'
                                        className='rounded-xl border border-mocha-400 p-3 transition hover:border-brand/70 disabled:opacity-60'
                                        disabled={isSubmitting}
                                        onClick={() => handleRewind(index)}
                                    >
                                        <img
                                            src={entry.url}
                                            alt={`Logo ${index + 1}`}
                                            className='mx-auto max-h-20 max-w-full rounded-lg'
                                        />
                                        <span className='mt-2 block text-xs text-white/55'>
                                            {entry.value === data.value ? 'Current' : `#${index + 1}`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </AdminCard>
                    )}
                </div>
            )}
        </AdminPage>
    );
};

export default LogoSettingsContainer;
