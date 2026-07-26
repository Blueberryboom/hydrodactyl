import { useNavigate } from 'react-router-dom';
import type { UserFormPayload } from '@/api/admin/types';
import { createAdminUser } from '@/api/admin/users';
import { AdminPage } from '@/components/admin/common';
import UserForm from '@/components/admin/users/UserForm';

const UserCreateContainer = () => {
    const navigate = useNavigate();

    const handleSubmit = async (payload: UserFormPayload) => {
        const user = await createAdminUser(payload);
        navigate(`/admin/users/view/${user.id}`);
    };

    return (
        <AdminPage title='Create User' description='Add a new user to the system.'>
            <UserForm submitLabel='Create User' onSubmit={handleSubmit} />
        </AdminPage>
    );
};

export default UserCreateContainer;
