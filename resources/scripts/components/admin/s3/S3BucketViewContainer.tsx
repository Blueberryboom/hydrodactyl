import { Link, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteAdminS3Bucket, getAdminS3Bucket, updateAdminS3Bucket } from '@/api/admin/s3';
import type { AdminS3Bucket, S3BucketFormPayload } from '@/api/admin/types';
import AdminTabs, { type AdminTabDefinition } from '@/components/admin/AdminTabs';
import {
    AdminCard,
    AdminDeleteButton,
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import S3BucketForm from '@/components/admin/s3/S3BucketForm';
import { Button } from '@/components/ui/button';

type S3BucketViewMode = 'overview' | 'details' | 'servers' | 'delete';

interface S3BucketViewContainerProps {
    mode: S3BucketViewMode;
}

const S3BucketNav = ({ id }: { id: number }) => {
    const tabs: AdminTabDefinition[] = [
        { label: 'Overview', to: `/admin/buckets/view/${id}`, end: true },
        { label: 'Details', to: `/admin/buckets/view/${id}/details` },
        { label: 'Servers', to: `/admin/buckets/view/${id}/servers` },
        { label: 'Delete', to: `/admin/buckets/view/${id}/delete` },
    ];

    return <AdminTabs tabs={tabs} />;
};

const S3BucketOverview = ({ bucket }: { bucket: AdminS3Bucket }) => (
    <div className='grid gap-4 xl:grid-cols-[1fr_320px]'>
        <AdminCard className='grid gap-4 md:grid-cols-2'>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>ID</p>
                <p className='mt-1 font-mono text-sm text-white/65'>{bucket.id}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Name</p>
                <p className='mt-1 font-medium'>{bucket.name}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Bucket Name</p>
                <p className='mt-1 font-mono text-sm text-white/65'>{bucket.bucketName}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Endpoint</p>
                <p className='mt-1 text-white/70'>{bucket.endpoint ?? 'Default AWS endpoint'}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Region</p>
                <p className='mt-1 font-mono text-sm text-white/65'>{bucket.region}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Path Style Endpoints</p>
                <p className='mt-1'>{bucket.usePathStyleEndpoint ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Created</p>
                <p className='mt-1 text-white/65'>{bucket.createdAt}</p>
            </div>
            <div>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Updated</p>
                <p className='mt-1 text-white/65'>{bucket.updatedAt}</p>
            </div>
        </AdminCard>
        <div className='flex flex-col gap-4'>
            <AdminCard>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Status</p>
                <p className='mt-2 text-2xl font-semibold'>{bucket.enabled ? 'Enabled' : 'Disabled'}</p>
            </AdminCard>
            <AdminCard>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Attached Servers</p>
                <p className='mt-2 text-2xl font-semibold'>{bucket.serverCount}</p>
                <Link to={`/admin/buckets/view/${bucket.id}/servers`} className='mt-3 inline-block text-sm text-brand hover:text-brand/80'>
                    View servers
                </Link>
            </AdminCard>
        </div>
        {bucket.description && <AdminCard className='xl:col-span-2 text-sm text-white/70'>{bucket.description}</AdminCard>}
    </div>
);

const S3BucketServers = ({ bucket }: { bucket: AdminS3Bucket }) =>
    bucket.servers.length === 0 ? (
        <AdminEmpty>No servers are using this S3 bucket.</AdminEmpty>
    ) : (
        <AdminTable>
            <AdminTableHead>
                <tr>
                    <th className='px-4 py-3'>ID</th>
                    <th className='px-4 py-3'>Name</th>
                    <th className='px-4 py-3'>Identifier</th>
                    <th className='px-4 py-3'>Node</th>
                    <th className='px-4 py-3'>Memory</th>
                    <th className='px-4 py-3'>Disk</th>
                </tr>
            </AdminTableHead>
            <AdminTableBody>
                {bucket.servers.map((server) => (
                    <tr key={server.id}>
                        <td className='px-4 py-3 font-mono text-white/55'>{server.id}</td>
                        <td className='px-4 py-3'>
                            <Link to={`/admin/servers/view/${server.id}`} className='text-brand hover:text-brand/80'>
                                {server.name}
                            </Link>
                        </td>
                        <td className='px-4 py-3 font-mono text-white/55'>{server.identifier}</td>
                        <td className='px-4 py-3'>{server.nodeId}</td>
                        <td className='px-4 py-3'>{server.memory.toLocaleString()} MB</td>
                        <td className='px-4 py-3'>{server.disk.toLocaleString()} MB</td>
                    </tr>
                ))}
            </AdminTableBody>
        </AdminTable>
    );

const S3BucketViewContainer = ({ mode }: S3BucketViewContainerProps) => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:s3-bucket', id] : null, () => getAdminS3Bucket(id ?? ''));

    const handleSubmit = async (payload: S3BucketFormPayload) => {
        if (!data) {
            return;
        }

        const bucket = await updateAdminS3Bucket(data.id, payload);
        await mutate({ ...bucket, servers: data.servers }, false);
    };

    return (
        <AdminPage title='S3 Bucket Details' description='Review and manage this S3 backup bucket configuration.'>
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && (
                <div className='flex flex-col gap-4'>
                    <S3BucketNav id={data.id} />
                    {mode === 'overview' && <S3BucketOverview bucket={data} />}
                    {mode === 'details' && <S3BucketForm bucket={data} submitLabel='Save Bucket' onSubmit={handleSubmit} />}
                    {mode === 'servers' && <S3BucketServers bucket={data} />}
                    {mode === 'delete' && (
                        <AdminCard className='max-w-2xl border-red-500/40 bg-red-500/10 text-sm text-red-100'>
                            <div className='flex flex-col gap-4'>
                                <div>
                                    <h2 className='text-lg font-semibold text-white'>Delete S3 Bucket</h2>
                                    <p className='mt-2 text-red-100/80'>
                                        Deleting this configuration is irreversible. Backups stored in this bucket may no longer be accessible from the panel.
                                    </p>
                                    {data.serverCount > 0 && (
                                        <p className='mt-3 font-medium'>
                                            This bucket is attached to {data.serverCount} server(s). Reassign those servers before deleting it.
                                        </p>
                                    )}
                                </div>
                                {data.serverCount > 0 ? (
                                    <Button type='button' variant='destructive' disabled>
                                        Delete Bucket
                                    </Button>
                                ) : (
                                    <AdminDeleteButton
                                        label='Delete Bucket'
                                        confirmation={`Delete S3 bucket ${data.name}? This cannot be undone.`}
                                        onDelete={async () => {
                                            await deleteAdminS3Bucket(data.id);
                                            navigate('/admin/buckets');
                                        }}
                                    />
                                )}
                            </div>
                        </AdminCard>
                    )}
                </div>
            )}
        </AdminPage>
    );
};

export default S3BucketViewContainer;
