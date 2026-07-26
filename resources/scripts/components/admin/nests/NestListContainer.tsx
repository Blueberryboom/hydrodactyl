import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminNests } from '@/api/admin/nests';
import {
    AdminCard,
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
import { Button } from '@/components/ui/button';

const NestListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [name, setName] = useState(searchParams.get('name') ?? '');
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:nests', page, name], () => getAdminNests({ page, name }));

    return (
        <AdminPage
            title='Nests'
            description='All configured server software nests and their eggs.'
            actions={
                <>
                    <AdminSearchForm
                        value={name}
                        placeholder='Search by name'
                        createTo='/admin/nests/new'
                        createLabel='Create New'
                        onSubmit={(value) => {
                            setName(value);
                            setSearchParams(value ? { name: value } : {});
                        }}
                    />
                    <Button asChild variant='secondary'>
                        <Link to='/admin/nests/egg/new'>Add Egg</Link>
                    </Button>
                </>
            }
        >
            <AdminCard className='border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-100'>
                Eggs are powerful. Modifying them incorrectly can break your servers; avoid editing default eggs unless
                you know what you are doing.
            </AdminCard>
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No nests found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => {
                        setSearchParams({ ...(name ? { name } : {}), page: String(selectedPage) });
                    }}
                >
                    {(nests) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>Description</th>
                                    <th className='px-4 py-3'>Author</th>
                                    <th className='px-4 py-3'>Eggs</th>
                                    <th className='px-4 py-3'>Created</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {nests.map((nest) => (
                                    <tr key={nest.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{nest.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/nests/view/${nest.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
                                                {nest.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3 text-white/65'>
                                            {nest.description ?? 'No description'}
                                        </td>
                                        <td className='px-4 py-3 text-white/65'>{nest.author}</td>
                                        <td className='px-4 py-3'>{nest.eggCount}</td>
                                        <td className='px-4 py-3 text-white/55'>{nest.createdAt}</td>
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

export default NestListContainer;
