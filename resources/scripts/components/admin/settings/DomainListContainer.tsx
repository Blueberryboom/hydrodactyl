import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { deleteAdminDomain, getAdminDomains } from '@/api/admin/settings';
import {
    AdminCard,
    AdminDeleteButton,
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import SettingsNav from '@/components/admin/settings/SettingsNav';
import { Button } from '@/components/ui/button';

const DomainListContainer = () => {
    const { data, error, mutate } = useSWR('admin:settings:domains', getAdminDomains);
    const navigate = useNavigate();

    const handleDelete = async (id: number) => {
        await deleteAdminDomain(id);
        await mutate();
        toast.success('Domain deleted.');
    };

    return (
        <AdminPage
            title='Domains'
            description='Configure DNS domains for subdomain management.'
            actions={<Button onClick={() => navigate('/admin/settings/domains/create')}>Create Domain</Button>}
        >
            <SettingsNav />
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.domains.length === 0 && <AdminEmpty>No domains configured.</AdminEmpty>}
            {data && data.domains.length > 0 && (
                <AdminCard className='p-0'>
                    <AdminTable>
                        <AdminTableHead>
                            <tr>
                                <th className='px-4 py-3'>Domain</th>
                                <th className='px-4 py-3'>Provider</th>
                                <th className='px-4 py-3'>Status</th>
                                <th className='px-4 py-3'>Default</th>
                                <th className='px-4 py-3'>Subdomains</th>
                                <th className='px-4 py-3' />
                            </tr>
                        </AdminTableHead>
                        <AdminTableBody>
                            {data.domains.map((domain) => (
                                <tr key={domain.id}>
                                    <td className='px-4 py-3 font-mono text-white'>{domain.name}</td>
                                    <td className='px-4 py-3'>
                                        {data.providers[domain.dnsProvider]?.name ?? domain.dnsProvider}
                                    </td>
                                    <td className='px-4 py-3'>{domain.isActive ? 'Active' : 'Inactive'}</td>
                                    <td className='px-4 py-3'>{domain.isDefault ? 'Default' : '-'}</td>
                                    <td className='px-4 py-3'>{domain.serverSubdomainsCount}</td>
                                    <td className='px-4 py-3'>
                                        <div className='flex justify-end gap-2'>
                                            <Button asChild variant='secondary' size='sm'>
                                                <Link to={`/admin/settings/domains/${domain.id}/edit`}>Edit</Link>
                                            </Button>
                                            {domain.serverSubdomainsCount === 0 && (
                                                <AdminDeleteButton
                                                    label='Delete'
                                                    confirmation='Delete this domain? This action cannot be undone.'
                                                    onDelete={() => handleDelete(domain.id)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </AdminTableBody>
                    </AdminTable>
                </AdminCard>
            )}
        </AdminPage>
    );
};

export default DomainListContainer;
