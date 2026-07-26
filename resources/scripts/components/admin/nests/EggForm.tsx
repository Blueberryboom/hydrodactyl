import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminEgg, EggFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';

interface EggFormProps {
    nests: Array<{ id: number; name: string }>;
    egg?: AdminEgg;
    nestId?: number;
    submitLabel: string;
    onSubmit: (nestId: number, payload: EggFormPayload) => Promise<void>;
}

const stringifyJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 4);

const stringifyDockerImages = (images?: Record<string, string>): string =>
    Object.entries(images ?? {})
        .map(([label, image]) => (label === image ? image : `${label}|${image}`))
        .join('\n');

const parseDockerImages = (value: string): Record<string, string> =>
    value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((images, line) => {
            const [label, image] = line.split('|', 2);
            images[label] = image?.trim() || label;

            return images;
        }, {});

const parseFeatures = (value: string): string[] =>
    value
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean);

const parseNullableNumber = (value: FormDataEntryValue | null): number | null => {
    const parsed = Number(value ?? 0);

    return parsed > 0 ? parsed : null;
};

const EggForm = ({ nests, egg, nestId, submitLabel, onSubmit }: EggFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const selectedNestId = Number(formData.get('nest_id') ?? egg?.nestId ?? nestId ?? 0);
        const description = String(formData.get('description') ?? '');

        const payload: EggFormPayload = {
            name: String(formData.get('name') ?? ''),
            description: description.trim() === '' ? null : description,
            docker_images: parseDockerImages(String(formData.get('docker_images') ?? '')),
            startup: String(formData.get('startup') ?? ''),
            force_outgoing_ip: formData.get('force_outgoing_ip') === '1',
            file_denylist: parseFeatures(String(formData.get('file_denylist') ?? '')),
            config_stop: String(formData.get('config_stop') ?? ''),
            config_startup: String(formData.get('config_startup') ?? '{}'),
            config_logs: String(formData.get('config_logs') ?? '{}'),
            config_files: String(formData.get('config_files') ?? '{}'),
            config_from: parseNullableNumber(formData.get('config_from')),
            copy_script_from: parseNullableNumber(formData.get('copy_script_from')),
            script_is_privileged: formData.get('script_is_privileged') === '1',
            script_install: String(formData.get('script_install') ?? ''),
            script_entry: String(formData.get('script_entry') ?? ''),
            script_container: String(formData.get('script_container') ?? ''),
            features: parseFeatures(String(formData.get('features') ?? '')),
        };

        try {
            await onSubmit(selectedNestId, payload);
            toast.success('Changes saved.');
            setSubmitting(false);
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    return (
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <div className='grid gap-4 xl:grid-cols-2'>
                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Details</h2>
                    <AdminField id='nest_id' label='Associated Nest'>
                        <select
                            id='nest_id'
                            name='nest_id'
                            required
                            disabled={egg !== undefined || nestId !== undefined}
                            defaultValue={egg?.nestId ?? nestId ?? nests[0]?.id ?? ''}
                            className={adminInputClass}
                        >
                            {nests.map((nest) => (
                                <option key={nest.id} value={nest.id}>
                                    {nest.name}
                                </option>
                            ))}
                        </select>
                    </AdminField>
                    <AdminField id='name' label='Name'>
                        <input
                            id='name'
                            name='name'
                            required
                            defaultValue={egg?.name ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='description' label='Description'>
                        <textarea
                            id='description'
                            name='description'
                            rows={5}
                            defaultValue={egg?.description ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='docker_images'
                        label='Docker Images'
                        description='One image per line. Use label|image to set a display label.'
                    >
                        <textarea
                            id='docker_images'
                            name='docker_images'
                            rows={5}
                            required
                            defaultValue={stringifyDockerImages(egg?.dockerImages)}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='features' label='Features' description='Optional comma-separated feature flags.'>
                        <input
                            id='features'
                            name='features'
                            defaultValue={egg?.features.join(', ') ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='file_denylist'
                        label='File Denylist'
                        description='Optional comma-separated paths denied by the daemon.'
                    >
                        <input
                            id='file_denylist'
                            name='file_denylist'
                            defaultValue={egg?.fileDenylist.join(', ') ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                </AdminCard>

                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Process</h2>
                    <AdminField id='startup' label='Startup Command'>
                        <textarea
                            id='startup'
                            name='startup'
                            rows={5}
                            required
                            defaultValue={egg?.startup ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='config_stop' label='Stop Command'>
                        <input
                            id='config_stop'
                            name='config_stop'
                            required
                            defaultValue={egg?.configStop ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='config_from'
                        label='Copy Config From'
                        description='Optional parent egg ID for process configuration.'
                    >
                        <input
                            id='config_from'
                            name='config_from'
                            type='number'
                            min={1}
                            defaultValue={egg?.configExtends ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='config_startup' label='Start Configuration'>
                        <textarea
                            id='config_startup'
                            name='config_startup'
                            rows={4}
                            required
                            defaultValue={stringifyJson(egg?.configStartup)}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='config_logs' label='Log Configuration'>
                        <textarea
                            id='config_logs'
                            name='config_logs'
                            rows={4}
                            required
                            defaultValue={stringifyJson(egg?.configLogs)}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='config_files' label='Configuration Files'>
                        <textarea
                            id='config_files'
                            name='config_files'
                            rows={4}
                            required
                            defaultValue={stringifyJson(egg?.configFiles)}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='force_outgoing_ip'>
                        <input
                            id='force_outgoing_ip'
                            name='force_outgoing_ip'
                            type='checkbox'
                            value='1'
                            defaultChecked={egg?.forceOutgoingIp ?? false}
                        />
                        Force outgoing IP
                    </label>
                </AdminCard>

                <AdminCard className='flex flex-col gap-4 xl:col-span-2'>
                    <h2 className='text-lg font-semibold'>Install Script</h2>
                    <div className='grid gap-4 xl:grid-cols-2'>
                        <AdminField
                            id='copy_script_from'
                            label='Copy Script From'
                            description='Optional parent egg ID for install script.'
                        >
                            <input
                                id='copy_script_from'
                                name='copy_script_from'
                                type='number'
                                min={1}
                                defaultValue={egg?.scriptExtends ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='script_container' label='Script Container'>
                            <input
                                id='script_container'
                                name='script_container'
                                required
                                defaultValue={egg?.scriptContainer ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='script_entry' label='Script Entry'>
                            <input
                                id='script_entry'
                                name='script_entry'
                                required
                                defaultValue={egg?.scriptEntry ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='script_is_privileged'>
                            <input
                                id='script_is_privileged'
                                name='script_is_privileged'
                                type='checkbox'
                                value='1'
                                defaultChecked={egg?.scriptPrivileged ?? false}
                            />
                            Run install script as privileged
                        </label>
                    </div>
                    <AdminField id='script_install' label='Install Script'>
                        <textarea
                            id='script_install'
                            name='script_install'
                            rows={8}
                            defaultValue={egg?.scriptInstall ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                </AdminCard>
            </div>
            <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo='/admin/nests' />
        </form>
    );
};

export default EggForm;
