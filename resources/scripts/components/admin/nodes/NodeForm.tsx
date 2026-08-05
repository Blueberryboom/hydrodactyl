import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminNode, AdminNodeLocationRef, AdminS3Bucket, NodeFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';

export const DAEMON_TYPES = ['wings', 'elytra'] as const;

export const BACKUP_DISKS: Record<string, string[]> = {
    elytra: ['elytra', 'rustic_local', 'rustic_s3'],
    wings: ['wings', 's3'],
};

const S3_ADAPTERS = ['s3', 'rustic_s3'];

const DEFAULT_DAEMON_BASE = '/var/lib/elytra/volumes';

interface NodeFormProps {
    node?: AdminNode;
    locations: AdminNodeLocationRef[];
    s3Buckets: AdminS3Bucket[];
    submitLabel: string;
    cancelTo: string;
    onSubmit: (payload: NodeFormPayload, resetSecret: boolean) => Promise<void>;
}

const isS3Adapter = (disk: string): boolean => S3_ADAPTERS.includes(disk);

const NodeForm = ({ node, locations, s3Buckets, submitLabel, cancelTo, onSubmit }: NodeFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();
    const [daemonType, setDaemonType] = useState(node?.daemonType ?? 'wings');
    const [backupDisk, setBackupDisk] = useState(() => {
        const daemon = node?.daemonType ?? 'wings';
        const disks = BACKUP_DISKS[daemon] ?? [];

        return node?.backupDisk && disks.includes(node.backupDisk) ? node.backupDisk : (disks[0] ?? 'wings');
    });
    const editing = node !== undefined;

    const handleDaemonChange = (value: string) => {
        setDaemonType(value);
        setBackupDisk((current) => {
            const disks = BACKUP_DISKS[value] ?? [];

            return disks.includes(current) ? current : (disks[0] ?? current);
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const description = String(formData.get('description') ?? '');
        const internalFqdn = String(formData.get('internal_fqdn') ?? '');
        const rawBucket = String(formData.get('bucket') ?? '');

        const payload: NodeFormPayload = {
            public: formData.get('public') === '1',
            name: String(formData.get('name') ?? ''),
            description: description.trim() === '' ? null : description,
            location_id: Number(formData.get('location_id')),
            fqdn: String(formData.get('fqdn') ?? ''),
            internal_fqdn: internalFqdn.trim() === '' ? null : internalFqdn,
            scheme: String(formData.get('scheme') ?? 'https'),
            behind_proxy: formData.get('behind_proxy') === '1',
            maintenance_mode: formData.get('maintenance_mode') === '1',
            trust_alias: formData.get('trust_alias') === '1',
            memory: Number(formData.get('memory') ?? 0),
            memory_overallocate: Number(formData.get('memory_overallocate') ?? 0),
            disk: Number(formData.get('disk') ?? 0),
            disk_overallocate: Number(formData.get('disk_overallocate') ?? 0),
            upload_size: Number(formData.get('upload_size') ?? 100),
            daemon_listen: Number(formData.get('daemon_listen') ?? 8080),
            daemon_sftp: Number(formData.get('daemon_sftp') ?? 2022),
            daemon_base: String(formData.get('daemon_base') ?? node?.daemonBase ?? DEFAULT_DAEMON_BASE),
            daemon_type: daemonType,
            backup_disk: backupDisk,
            bucket: rawBucket === '' ? null : Number(rawBucket),
        };

        try {
            await onSubmit(payload, formData.get('reset_secret') === '1');
            toast.success('Changes saved.');
            setSubmitting(false);
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    const backupDisks = BACKUP_DISKS[daemonType] ?? [];

    return (
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <div className='grid gap-4 xl:grid-cols-2'>
                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Basic Details</h2>
                    <AdminField
                        id='name'
                        label='Name'
                        description='Character limits: a-zA-Z0-9_.- and [Space] (min 1, max 100 characters).'
                    >
                        <input
                            id='name'
                            name='name'
                            required
                            defaultValue={node?.name ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='description' label='Description'>
                        <textarea
                            id='description'
                            name='description'
                            rows={4}
                            defaultValue={node?.description ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='location_id' label='Location'>
                        <select
                            id='location_id'
                            name='location_id'
                            required
                            defaultValue={node?.locationId ?? ''}
                            className={adminInputClass}
                        >
                            <option value='' disabled>
                                Select a location
                            </option>
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.long ? `${location.long} (${location.short})` : location.short}
                                </option>
                            ))}
                        </select>
                    </AdminField>
                    <AdminField id='daemon_type' label='Daemon'>
                        <select
                            id='daemon_type'
                            name='daemon_type'
                            value={daemonType}
                            onChange={(event) => handleDaemonChange(event.currentTarget.value)}
                            className={adminInputClass}
                        >
                            {DAEMON_TYPES.map((daemon) => (
                                <option key={daemon} value={daemon}>
                                    {daemon}
                                </option>
                            ))}
                        </select>
                    </AdminField>
                    <AdminField id='backup_disk' label='Backup Disk'>
                        <select
                            id='backup_disk'
                            name='backup_disk'
                            value={backupDisk}
                            onChange={(event) => setBackupDisk(event.currentTarget.value)}
                            className={adminInputClass}
                        >
                            {backupDisks.map((disk) => (
                                <option key={disk} value={disk}>
                                    {disk}
                                </option>
                            ))}
                        </select>
                    </AdminField>
                    {isS3Adapter(backupDisk) && (
                        <AdminField
                            id='bucket'
                            label='S3 Bucket'
                            description='Required when using an S3-based backup disk. Select which S3 configuration this node should use for backups.'
                        >
                            <select
                                id='bucket'
                                name='bucket'
                                defaultValue={node?.bucket ?? ''}
                                className={adminInputClass}
                            >
                                <option value=''>-- None --</option>
                                {s3Buckets.map((bucket) => (
                                    <option key={bucket.id} value={bucket.id}>
                                        {bucket.name} ({bucket.bucketName})
                                    </option>
                                ))}
                            </select>
                        </AdminField>
                    )}
                </AdminCard>

                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Connection Details</h2>
                    <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='public'>
                        <input
                            id='public'
                            name='public'
                            type='checkbox'
                            value='1'
                            defaultChecked={node?.public ?? true}
                        />
                        Allow Automatic Allocation
                    </label>
                    {editing && (
                        <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='trust_alias'>
                            <input
                                id='trust_alias'
                                name='trust_alias'
                                type='checkbox'
                                value='1'
                                defaultChecked={node?.trustAlias ?? false}
                            />
                            Domain by Allocation Alias
                        </label>
                    )}
                    <AdminField
                        id='fqdn'
                        label='Public Fully Qualified Domain Name'
                        description='Domain name that browsers will use to connect to your daemon. An IP address may be used only if you are not using SSL for this node.'
                    >
                        <input
                            id='fqdn'
                            name='fqdn'
                            required
                            defaultValue={node?.fqdn ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='internal_fqdn'
                        label='Internal FQDN (Optional)'
                        description='Leave blank to use the Public FQDN for panel-to-node communication. If specified, this internal domain name will be used instead.'
                    >
                        <input
                            id='internal_fqdn'
                            name='internal_fqdn'
                            defaultValue={node?.internalFqdn ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='scheme' label='Communicate Over SSL'>
                        <select
                            id='scheme'
                            name='scheme'
                            defaultValue={node?.scheme ?? 'https'}
                            className={adminInputClass}
                        >
                            <option value='https'>Use SSL Connection</option>
                            <option value='http'>Use HTTP Connection</option>
                        </select>
                    </AdminField>
                    <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='behind_proxy'>
                        <input
                            id='behind_proxy'
                            name='behind_proxy'
                            type='checkbox'
                            value='1'
                            defaultChecked={node?.behindProxy ?? false}
                        />
                        Behind Proxy
                    </label>
                    {editing && (
                        <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='maintenance_mode'>
                            <input
                                id='maintenance_mode'
                                name='maintenance_mode'
                                type='checkbox'
                                value='1'
                                defaultChecked={node?.maintenanceMode ?? false}
                            />
                            Maintenance Mode
                        </label>
                    )}
                </AdminCard>

                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Allocation Limits</h2>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <AdminField id='memory' label='Total Memory (MiB)'>
                            <input
                                id='memory'
                                name='memory'
                                type='number'
                                required
                                min={1}
                                defaultValue={node?.memory ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='memory_overallocate' label='Memory Over-Allocation (%)'>
                            <input
                                id='memory_overallocate'
                                name='memory_overallocate'
                                type='number'
                                required
                                min={-1}
                                defaultValue={node?.memoryOverallocate ?? 0}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='disk' label='Total Disk Space (MiB)'>
                            <input
                                id='disk'
                                name='disk'
                                type='number'
                                required
                                min={1}
                                defaultValue={node?.disk ?? ''}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='disk_overallocate' label='Disk Over-Allocation (%)'>
                            <input
                                id='disk_overallocate'
                                name='disk_overallocate'
                                type='number'
                                required
                                min={-1}
                                defaultValue={node?.diskOverallocate ?? 0}
                                className={adminInputClass}
                            />
                        </AdminField>
                    </div>
                </AdminCard>

                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>General Configuration</h2>
                    {editing && (
                        <AdminField
                            id='upload_size'
                            label='Maximum Web Upload Filesize (MiB)'
                            description='Enter the maximum size of files that can be uploaded through the web-based file manager (1-1024).'
                        >
                            <input
                                id='upload_size'
                                name='upload_size'
                                type='number'
                                min={1}
                                max={1024}
                                defaultValue={node?.uploadSize ?? 100}
                                className={adminInputClass}
                            />
                        </AdminField>
                    )}
                    <div className='grid gap-4 md:grid-cols-2'>
                        <AdminField id='daemon_listen' label='Daemon Port'>
                            <input
                                id='daemon_listen'
                                name='daemon_listen'
                                type='number'
                                required
                                min={1}
                                max={65535}
                                defaultValue={node?.daemonListen ?? 8080}
                                className={adminInputClass}
                            />
                        </AdminField>
                        <AdminField id='daemon_sftp' label='Daemon SFTP Port'>
                            <input
                                id='daemon_sftp'
                                name='daemon_sftp'
                                type='number'
                                required
                                min={1}
                                max={65535}
                                defaultValue={node?.daemonSftp ?? 2022}
                                className={adminInputClass}
                            />
                        </AdminField>
                    </div>
                    {!editing && (
                        <AdminField
                            id='daemon_base'
                            label='Daemon Server File Directory'
                            description='Enter the directory where server files should be stored.'
                        >
                            <input
                                id='daemon_base'
                                name='daemon_base'
                                required
                                defaultValue={DEFAULT_DAEMON_BASE}
                                className={adminInputClass}
                            />
                        </AdminField>
                    )}
                </AdminCard>
            </div>

            {editing && (
                <AdminCard className='flex flex-col gap-2'>
                    <label className='flex items-center gap-2 text-sm text-white/70' htmlFor='reset_secret'>
                        <input id='reset_secret' name='reset_secret' type='checkbox' value='1' />
                        Reset Daemon Master Key
                    </label>
                    <p className='text-xs text-white/45'>
                        Resetting the daemon master key will void any request coming from the old key. This key is used
                        for all sensitive operations on the daemon including server creation and deletion.
                    </p>
                </AdminCard>
            )}

            <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo={cancelTo} />
        </form>
    );
};

export default NodeForm;
