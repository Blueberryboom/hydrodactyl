import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminNodeSystemInformation, getAdminNodes } from '@/api/admin/nodes';
import type { AdminNode } from '@/api/admin/types';
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
import { cn } from '@/lib/utils';

const humanizeSize = (bytes: number): string => {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    let value = bytes;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    return `${value.toFixed(2)} ${units[index]}`;
};

const humanizeMegabytes = (value: number): string => humanizeSize(value * 1024 * 1024);

const resourceColor = (percent: number): string => {
    if (percent < 50) {
        return 'text-green-400';
    }

    return percent < 70 ? 'text-yellow-400' : 'text-red-400';
};

const resourcePercent = (used: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.min((used / total) * 100, 100);
};

const NodeStatus = ({ nodeId }: { nodeId: number }) => {
    const [online, setOnline] = useState<boolean | null>(null);
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const ping = async () => {
            try {
                const info = await getAdminNodeSystemInformation(nodeId);
                if (mounted) {
                    setVersion(info.version);
                    setOnline(true);
                }
            } catch {
                if (mounted) {
                    setOnline(false);
                }
            }
        };

        void ping();
        const interval = window.setInterval(ping, 10000);

        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [nodeId]);

    const title =
        online === true ? `Daemon v${version ?? 'unknown'}` : online === false ? 'Error connecting to node!' : '';

    return (
        <td className='px-4 py-3 text-center' title={title} aria-label={title || 'Checking node status'}>
            <span
                className={cn(
                    'inline-block h-2.5 w-2.5 rounded-full',
                    online === null && 'animate-pulse bg-white/30',
                    online === true && 'bg-green-400',
                    online === false && 'bg-red-500',
                )}
            />
        </td>
    );
};

const NodeListContainer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [name, setName] = useState(searchParams.get('name') ?? '');
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error } = useSWR(['admin:nodes', page, name], () => getAdminNodes({ page, name }));

    return (
        <AdminPage
            title='Nodes'
            description='All nodes available on the system.'
            actions={
                <AdminSearchForm
                    value={name}
                    placeholder='Search Nodes'
                    createTo='/admin/nodes/new'
                    createLabel='Create New'
                    onSubmit={(value) => {
                        setName(value);
                        setSearchParams(value ? { name: value } : {});
                    }}
                />
            }
        >
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.items.length === 0 && <AdminEmpty>No nodes found.</AdminEmpty>}
            {data && data.items.length > 0 && (
                <AdminPagination
                    data={data}
                    onPageSelect={(selectedPage) => {
                        setSearchParams({ ...(name ? { name } : {}), page: String(selectedPage) });
                    }}
                >
                    {(nodes) => (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='w-10' />
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>Location</th>
                                    <th className='px-4 py-3'>Memory%</th>
                                    <th className='px-4 py-3'>Allocated Memory</th>
                                    <th className='px-4 py-3'>Total Memory</th>
                                    <th className='px-4 py-3'>Disk%</th>
                                    <th className='px-4 py-3'>Allocated Disk</th>
                                    <th className='px-4 py-3'>Total Disk</th>
                                    <th className='px-4 py-3 text-center'>Servers</th>
                                    <th className='px-4 py-3 text-center'>Daemon Type</th>
                                    <th className='px-4 py-3 text-center'>Public</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {nodes.map((node) => (
                                    <NodeRow key={node.id} node={node} />
                                ))}
                            </AdminTableBody>
                        </AdminTable>
                    )}
                </AdminPagination>
            )}
        </AdminPage>
    );
};

const NodeRow = ({ node }: { node: AdminNode }) => {
    const memoryPercent = resourcePercent(node.allocatedMemory, node.memory);
    const diskPercent = resourcePercent(node.allocatedDisk, node.disk);

    return (
        <tr>
            <NodeStatus nodeId={node.id} />
            <td className='px-4 py-3'>
                <span className='flex items-center gap-2'>
                    {node.maintenanceMode && (
                        <span className='rounded-md bg-yellow-500/20 px-1.5 py-0.5 text-xs font-medium text-yellow-300'>
                            Maintenance
                        </span>
                    )}
                    <Link to={`/admin/nodes/view/${node.id}`} className='text-brand hover:text-brand/80'>
                        {node.name}
                    </Link>
                </span>
            </td>
            <td className='px-4 py-3 text-white/65'>{node.location?.short ?? node.locationId}</td>
            <td className={cn('px-4 py-3 font-medium', resourceColor(memoryPercent))}>{memoryPercent.toFixed(0)}%</td>
            <td className='px-4 py-3'>{humanizeMegabytes(node.allocatedMemory)}</td>
            <td className='px-4 py-3 text-white/65'>{humanizeMegabytes(node.memoryCapacity)}</td>
            <td className={cn('px-4 py-3 font-medium', resourceColor(diskPercent))}>{diskPercent.toFixed(0)}%</td>
            <td className='px-4 py-3'>{humanizeMegabytes(node.allocatedDisk)}</td>
            <td className='px-4 py-3 text-white/65'>{humanizeMegabytes(node.diskCapacity)}</td>
            <td className='px-4 py-3 text-center'>{node.servers.length}</td>
            <td className='px-4 py-3 text-center text-white/65'>{node.daemonType}</td>
            <td className='px-4 py-3 text-center'>{node.public ? 'Public' : 'Private'}</td>
        </tr>
    );
};

export default NodeListContainer;
