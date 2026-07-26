import { useNavigate } from 'react-router-dom';
import { createAdminNest } from '@/api/admin/nests';
import type { NestFormPayload } from '@/api/admin/types';
import { AdminPage } from '@/components/admin/common';
import NestForm from '@/components/admin/nests/NestForm';

const NestCreateContainer = () => {
    const navigate = useNavigate();

    const handleSubmit = async (payload: NestFormPayload) => {
        const nest = await createAdminNest(payload);
        navigate(`/admin/nests/view/${nest.id}`);
    };

    return (
        <AdminPage title='Create Nest' description='Create a new nest to categorize related eggs.'>
            <NestForm submitLabel='Create Nest' onSubmit={handleSubmit} />
        </AdminPage>
    );
};

export default NestCreateContainer;
