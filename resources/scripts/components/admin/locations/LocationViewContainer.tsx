import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteAdminLocation, getAdminLocation, updateAdminLocation } from '@/api/admin/locations';
import type { LocationFormPayload } from '@/api/admin/types';
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
import LocationForm from '@/components/admin/locations/LocationForm';

const formatMegabytes = (value: number): string => `${value.toLocaleString()} MB`;

const formatPercent = (used: number, total: number): string => {
    if (total <= 0) {
        return '0%';
    }

    return `${((used / total) * 100).toFixed(1)}%`;
};

const LocationViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:location', id] : null, () => getAdminLocation(id ?? ''));

    const handleSubmit = async (payload: LocationFormPayload) => {
        if (!data) {
            return;
        }

        const location = await updateAdminLocation(data.id, payload);
        await mutate(
            {
                ...location,
                nodeCount: data.nodeCount,
                serverCount: data.serverCount,
                allocatedMemory: data.allocatedMemory,
                allocatedDisk: data.allocatedDisk,
                memoryCapacity: data.memoryCapacity,
                diskCapacity: data.diskCapacity,
                nodes: data.nodes,
                servers: data.servers,
            },
            false,
        );
    };

    return (
        <AdminPage
            title='Location Details'
            description='Edit this location identifier and description.'
            actions={
                data ? (
                    <AdminDeleteButton
                        label='Delete Location'
                        confirmation={`Delete location ${data.short}? This cannot be undone.`}
                        onDelete={async () => {
                            await deleteAdminLocation(data.id);
                            navigate('/admin/locations');
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
                    <LocationForm location={data} submitLabel='Save Location' onSubmit={handleSubmit} />

                    <AdminCard className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Nodes</p>
                            <p className='mt-1 font-medium'>{data.nodeCount}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Servers</p>
                            <p className='mt-1 font-medium'>{data.serverCount}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Memory Allocated</p>
                            <p className='mt-1 font-medium'>
                                {formatPercent(data.allocatedMemory, data.memoryCapacity)}
                            </p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Disk Allocated</p>
                            <p className='mt-1 font-medium'>{formatPercent(data.allocatedDisk, data.diskCapacity)}</p>
                        </div>
                    </AdminCard>

                    {data.nodes.length === 0 ? (
                        <AdminEmpty>No nodes are assigned to this location.</AdminEmpty>
                    ) : (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>FQDN</th>
                                    <th className='px-4 py-3'>Servers</th>
                                    <th className='px-4 py-3'>Memory</th>
                                    <th className='px-4 py-3'>Disk</th>
                                    <th className='px-4 py-3'>Status</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {data.nodes.map((node) => (
                                    <tr key={node.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{node.id}</td>
                                        <td className='px-4 py-3'>{node.name}</td>
                                        <td className='px-4 py-3 text-white/65'>{node.fqdn}</td>
                                        <td className='px-4 py-3'>
                                            {data.servers.filter((server) => server.nodeId === node.id).length}
                                        </td>
                                        <td className='px-4 py-3'>
                                            {formatMegabytes(node.allocatedMemory)} /{' '}
                                            {formatMegabytes(node.memoryCapacity)}
                                        </td>
                                        <td className='px-4 py-3'>
                                            {formatMegabytes(node.allocatedDisk)} / {formatMegabytes(node.diskCapacity)}
                                        </td>
                                        <td className='px-4 py-3'>{node.maintenanceMode ? 'Maintenance' : 'Active'}</td>
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

export default LocationViewContainer;
