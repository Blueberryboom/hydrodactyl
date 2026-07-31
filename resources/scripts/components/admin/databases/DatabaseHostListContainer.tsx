import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminDatabaseHosts } from '@/api/admin/databases';
import {
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminPagination,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import DatabaseHostCreateDialog from '@/components/admin/databases/DatabaseHostCreateDialog';
import { Button } from '@/components/ui/button';

const DatabaseHostListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [createOpen, setCreateOpen] = useState(false);
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:database-hosts', page], () => getAdminDatabaseHosts({ page }));

    return (
        <AdminPage
            title='Databases'
            description='Database hosts that servers can have databases created on.'
            actions={<Button onClick={() => setCreateOpen(true)}>Create New</Button>}
        >
            <DatabaseHostCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No database hosts found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => setSearchParams({ page: String(selectedPage) })}
                >
                    {(hosts) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>Host</th>
                                    <th className='px-4 py-3'>Port</th>
                                    <th className='px-4 py-3'>Username</th>
                                    <th className='px-4 py-3 text-center'>Databases</th>
                                    <th className='px-4 py-3 text-center'>Node</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {hosts.map((host) => (
                                    <tr key={host.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{host.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/databases/view/${host.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
                                                {host.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3 font-mono text-white/65'>{host.host}</td>
                                        <td className='px-4 py-3 font-mono text-white/65'>{host.port}</td>
                                        <td className='px-4 py-3'>{host.username}</td>
                                        <td className='px-4 py-3 text-center'>{host.databaseCount}</td>
                                        <td className='px-4 py-3 text-center'>
                                            {host.nodeId !== null ? (
                                                <Link
                                                    to={`/admin/nodes/view/${host.nodeId}`}
                                                    className='text-brand hover:text-brand/80'
                                                >
                                                    {host.nodeName ?? host.nodeId}
                                                </Link>
                                            ) : (
                                                <span className='text-white/45'>None</span>
                                            )}
                                        </td>
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

export default DatabaseHostListContainer;
