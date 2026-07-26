import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminUsers } from '@/api/admin/users';
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

const UserListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') ?? '');
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:users', page, email], () => getAdminUsers({ page, email }));

    return (
        <AdminPage
            title='Users'
            description='All registered users on the system.'
            actions={
                <AdminSearchForm
                    value={email}
                    placeholder='Search by email'
                    createTo='/admin/users/new'
                    createLabel='Create New'
                    onSubmit={(value) => {
                        setEmail(value);
                        setSearchParams(value ? { email: value } : {});
                    }}
                />
            }
        >
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No users found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => {
                        setSearchParams({ ...(email ? { email } : {}), page: String(selectedPage) });
                    }}
                >
                    {(users) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Email</th>
                                    <th className='px-4 py-3'>Username</th>
                                    <th className='px-4 py-3'>2FA</th>
                                    <th className='px-4 py-3'>Role</th>
                                    <th className='px-4 py-3'>Created</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{user.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/users/view/${user.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
                                                {user.email}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3'>{user.username}</td>
                                        <td className='px-4 py-3'>{user.useTotp ? 'Enabled' : 'Disabled'}</td>
                                        <td className='px-4 py-3'>{user.rootAdmin ? 'Administrator' : 'User'}</td>
                                        <td className='px-4 py-3 text-white/55'>{user.createdAt}</td>
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

export default UserListContainer;
