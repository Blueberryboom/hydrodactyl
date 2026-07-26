import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminDomainPayload } from '@/api/admin/settings';
import { createAdminDomain, getAdminDomains } from '@/api/admin/settings';
import { AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import DomainForm from '@/components/admin/settings/DomainForm';
import SettingsNav from '@/components/admin/settings/SettingsNav';

const DomainCreateContainer = () => {
    const { data, error } = useSWR('admin:settings:domains:create', getAdminDomains);
    const navigate = useNavigate();

    const handleSubmit = async (payload: AdminDomainPayload) => {
        const domain = await createAdminDomain(payload);
        toast.success('Domain created.');
        navigate(`/admin/settings/domains/${domain.id}/edit`);
    };

    return (
        <AdminPage title='Create Domain' description='Add a new DNS domain provider configuration.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && <DomainForm providers={data.providers} onSubmit={handleSubmit} submitLabel='Create Domain' />}
        </AdminPage>
    );
};

export default DomainCreateContainer;
