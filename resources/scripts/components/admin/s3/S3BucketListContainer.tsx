import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminS3Buckets } from '@/api/admin/s3';
import {
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminPagination,
    AdminSearchForm,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';

const S3BucketListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [name, setName] = useState(searchParams.get('name') ?? '');
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:s3-buckets', page, name], () => getAdminS3Buckets({ page, name }));

    return (
        <AdminPage
            title='S3 Buckets'
            description='All configured S3 backup buckets on the system.'
            actions={
                <AdminSearchForm
                    value={name}
                    placeholder='Search by name'
                    createTo='/admin/buckets/new'
                    createLabel='Create New'
                    onSubmit={(value) => {
                        setName(value);
                        setSearchParams(value ? { name: value } : {});
                    }}
                />
            }
        >
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No S3 buckets found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => {
                        setSearchParams({ ...(name ? { name } : {}), page: String(selectedPage) });
                    }}
                >
                    {(buckets) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>Bucket Name</th>
                                    <th className='px-4 py-3'>Endpoint</th>
                                    <th className='px-4 py-3'>Status</th>
                                    <th className='px-4 py-3'>Servers</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {buckets.map((bucket) => (
                                    <tr key={bucket.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{bucket.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link to={`/admin/buckets/view/${bucket.id}`} className='text-brand hover:text-brand/80'>
                                                {bucket.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3 font-mono text-white/65'>{bucket.bucketName}</td>
                                        <td className='px-4 py-3 text-white/65'>{bucket.endpoint ?? 'Default AWS endpoint'}</td>
                                        <td className='px-4 py-3'>{bucket.enabled ? 'Enabled' : 'Disabled'}</td>
                                        <td className='px-4 py-3'>{bucket.serverCount}</td>
                                    </tr>
                                ))}
                            </AdminTableBody>
                        </AdminTable>
                    )}
                </AdminPagination>
            )}
        </AdminPage>
    );
};

export default S3BucketListContainer;
