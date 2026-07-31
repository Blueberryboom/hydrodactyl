import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { createAdminApplicationApiKey, getAdminApiKeyPermissionOptions } from '@/api/admin/application-api';
import type { AdminApplicationApiKeyPayload } from '@/api/admin/types';
import ApplicationApiForm from '@/components/admin/applicationApi/ApplicationApiForm';
import { AdminError, AdminLoading, AdminPage } from '@/components/admin/common';

const ApplicationApiCreateContainer = () => {
    const navigate = useNavigate();
    const { data, error } = useSWR('admin:api-key-permissions', getAdminApiKeyPermissionOptions);

    const handleSubmit = async (payload: AdminApplicationApiKeyPayload) => {
        await createAdminApplicationApiKey(payload);
        navigate('/admin/api');
    };

    return (
        <AdminPage title='Application API' description='Create a new application API key.'>
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && <ApplicationApiForm permissionOptions={data} onSubmit={handleSubmit} />}
        </AdminPage>
    );
};

export default ApplicationApiCreateContainer;
