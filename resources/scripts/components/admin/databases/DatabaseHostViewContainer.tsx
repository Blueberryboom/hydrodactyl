import { Link, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import {
    deleteAdminDatabaseHost,
    getAdminDatabaseHost,
    getAdminDatabaseHostLocations,
    updateAdminDatabaseHost,
} from '@/api/admin/databases';
import type { DatabaseHostFormPayload } from '@/api/admin/types';
import {
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import DatabaseHostForm from '@/components/admin/databases/DatabaseHostForm';
import { Button } from '@/components/ui/button';

const DatabaseHostViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:database-host', id] : null, () =>
        getAdminDatabaseHost(id ?? ''),
    );
    const { data: locations, error: locationsError } = useSWR(
        'admin:database-host-locations',
        getAdminDatabaseHostLocations,
    );

    const handleSubmit = async (payload: DatabaseHostFormPayload) => {
        if (!data) {
            return;
        }

        const host = await updateAdminDatabaseHost(data.id, payload);
        await mutate({ ...data, ...host, databases: data.databases }, false);
    };

    const handleDelete = async () => {
        if (!data) {
            return;
        }

        await deleteAdminDatabaseHost(data.id);
        navigate('/admin/databases');
    };

    return (
        <AdminPage title='Database Host Details' description='Review and manage this database host and its databases.'>
            {error || locationsError ? (
                <AdminError error={error ?? locationsError} />
            ) : !data || !locations ? (
                <AdminLoading />
            ) : null}
            {data && locations && (
                <div className='flex flex-col gap-4'>
                    <DatabaseHostForm
                        host={data}
                        locations={locations}
                        onSubmit={handleSubmit}
                        onDelete={handleDelete}
                    />
                    <div className='flex flex-col gap-4'>
                        <h2 className='text-lg font-semibold'>Databases</h2>
                        {data.databases.length === 0 ? (
                            <AdminEmpty>No databases are assigned to this host.</AdminEmpty>
                        ) : (
                            <AdminTable>
                                <AdminTableHead>
                                    <tr>
                                        <th className='px-4 py-3'>Server</th>
                                        <th className='px-4 py-3'>Database Name</th>
                                        <th className='px-4 py-3'>Username</th>
                                        <th className='px-4 py-3'>Connections From</th>
                                        <th className='px-4 py-3'>Max Connections</th>
                                        <th className='px-4 py-3 text-center'></th>
                                    </tr>
                                </AdminTableHead>
                                <AdminTableBody>
                                    {data.databases.map((database) => (
                                        <tr key={database.id}>
                                            <td className='px-4 py-3'>
                                                <Link
                                                    to={`/admin/servers/view/${database.serverId}`}
                                                    className='text-brand hover:text-brand/80'
                                                >
                                                    {database.serverName ?? `Server #${database.serverId}`}
                                                </Link>
                                            </td>
                                            <td className='px-4 py-3 font-mono text-white/65'>{database.database}</td>
                                            <td className='px-4 py-3 font-mono text-white/65'>{database.username}</td>
                                            <td className='px-4 py-3 font-mono text-white/65'>{database.remote}</td>
                                            <td className='px-4 py-3'>{database.maxConnections ?? 'Unlimited'}</td>
                                            <td className='px-4 py-3 text-center'>
                                                <Button asChild variant='secondary' size='sm'>
                                                    <Link to={`/admin/servers/view/${database.serverId}/database`}>
                                                        Manage
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </AdminTableBody>
                            </AdminTable>
                        )}
                    </div>
                </div>
            )}
        </AdminPage>
    );
};

export default DatabaseHostViewContainer;
