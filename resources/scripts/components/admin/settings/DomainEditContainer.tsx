import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { AdminDomainPayload } from '@/api/admin/settings';
import { getAdminDomain, updateAdminDomain } from '@/api/admin/settings';
import { AdminCard, AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import DomainForm from '@/components/admin/settings/DomainForm';
import SettingsNav from '@/components/admin/settings/SettingsNav';

const DomainEditContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:settings:domain', id] : null, () => getAdminDomain(id ?? ''));

    const handleSubmit = async (payload: AdminDomainPayload) => {
        if (!data) return;

        const domain = await updateAdminDomain(data.domain.id, payload);
        await mutate({ ...data, domain }, false);
        toast.success('Domain updated.');
        navigate('/admin/settings/domains');
    };

    return (
        <AdminPage title='Edit Domain' description='Update DNS domain configuration.'>
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && (
                <>
                    <AdminCard className='grid gap-3 text-sm text-white/65 md:grid-cols-3'>
                        <div>
                            <span className='text-white/40'>Total Subdomains:</span> {data.domain.serverSubdomainsCount}
                        </div>
                        <div>
                            <span className='text-white/40'>Active Subdomains:</span>{' '}
                            {data.domain.activeSubdomainsCount}
                        </div>
                        <div>
                            <span className='text-white/40'>Provider:</span>{' '}
                            {data.providers[data.domain.dnsProvider]?.name ?? data.domain.dnsProvider}
                        </div>
                    </AdminCard>
                    <DomainForm
                        domain={data.domain}
                        providers={data.providers}
                        onSubmit={handleSubmit}
                        submitLabel='Update Domain'
                    />
                </>
            )}
        </AdminPage>
    );
};

export default DomainEditContainer;
