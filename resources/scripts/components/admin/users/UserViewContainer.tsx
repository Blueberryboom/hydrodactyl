import { Link, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import type { UserFormPayload } from '@/api/admin/types';
import { deleteAdminUser, getAdminUser, updateAdminUser } from '@/api/admin/users';
import {
    AdminDeleteButton,
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import UserForm from '@/components/admin/users/UserForm';

const UserViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:user', id] : null, () => getAdminUser(id ?? ''));

    const handleSubmit = async (payload: UserFormPayload) => {
        if (!data) {
            return;
        }

        const user = await updateAdminUser(data.id, payload);
        await mutate({ ...user, servers: data.servers }, false);
    };

    return (
        <AdminPage
            title='User Details'
            description='Edit identity, permissions, and password settings.'
            actions={
                data ? (
                    <AdminDeleteButton
                        label='Delete User'
                        confirmation={`Delete user ${data.email}? This cannot be undone.`}
                        onDelete={async () => {
                            await deleteAdminUser(data.id);
                            navigate('/admin/users');
                        }}
                    />
                ) : undefined
            }
        >
            {error ? (
                <AdminError error={error} />
            ) : !data ? (
                <AdminLoading />
            ) : (
                <div className='flex flex-col gap-4'>
                    <UserForm user={data} submitLabel='Save User' onSubmit={handleSubmit} />
                    {data.servers.length === 0 ? (
                        <AdminEmpty>This user does not own any servers.</AdminEmpty>
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
                                {data.servers.map((server) => (
                                    <tr key={server.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{server.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/servers/view/${server.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
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
                    )}
                </div>
            )}
        </AdminPage>
    );
};

export default UserViewContainer;
