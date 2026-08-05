import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteAdminNode, getAdminNode, getAdminNodeSystemInformation } from '@/api/admin/nodes';
import type { AdminNode } from '@/api/admin/types';
import AdminTabs, { type AdminTabDefinition } from '@/components/admin/AdminTabs';
import { AdminCard, AdminDeleteButton, AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import NodeAllocations from '@/components/admin/nodes/NodeAllocations';
import NodeConfiguration from '@/components/admin/nodes/NodeConfiguration';
import NodeServers from '@/components/admin/nodes/NodeServers';
import NodeSettings from '@/components/admin/nodes/NodeSettings';
import { cn } from '@/lib/utils';

type NodeViewMode = 'overview' | 'settings' | 'configuration' | 'allocation' | 'servers';

interface NodeViewContainerProps {
    mode: NodeViewMode;
}

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

const resourcePercent = (used: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.min((used / total) * 100, 100);
};

const resourceBarColor = (percent: number): string => {
    if (percent < 50) {
        return 'bg-green-400';
    }

    return percent < 70 ? 'bg-yellow-400' : 'bg-red-500';
};

const ResourceBar = ({ label, used, total }: { label: string; used: number; total: number }) => {
    const percent = resourcePercent(used, total);

    return (
        <AdminCard>
            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>{label}</p>
            <p className='mt-1 text-lg font-semibold'>
                {humanizeSize(used * 1024 * 1024)} / {humanizeSize(total * 1024 * 1024)}
            </p>
            <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10'>
                <div
                    className={cn('h-full rounded-full transition-all', resourceBarColor(percent))}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </AdminCard>
    );
};

const NodeSystemInformation = ({ nodeId }: { nodeId: number }) => {
    const [version, setVersion] = useState<string | null>(null);
    const [system, setSystem] = useState<{ type: string; arch: string; release: string } | null>(null);
    const [cpus, setCpus] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchInformation = async () => {
            try {
                const info = await getAdminNodeSystemInformation(nodeId);
                if (mounted) {
                    setVersion(info.version);
                    setSystem(info.system);
                    setCpus(info.system.cpus);
                }
            } catch {
                // The daemon may be offline; keep whatever information we already have.
            }
        };

        void fetchInformation();
        const interval = window.setInterval(fetchInformation, 10000);

        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [nodeId]);

    return (
        <AdminCard>
            <h2 className='mb-4 text-lg font-semibold'>Information</h2>
            <dl className='flex flex-col gap-3 text-sm'>
                <div className='flex items-center justify-between gap-4'>
                    <dt className='text-white/55'>Daemon Version</dt>
                    <dd className='font-mono text-white/80'>{version ?? '--'}</dd>
                </div>
                <div className='flex items-center justify-between gap-4'>
                    <dt className='text-white/55'>System Information</dt>
                    <dd className='text-right text-white/80'>
                        {system ? (
                            <>
                                {system.type} ({system.arch}) <code className='text-white/50'>{system.release}</code>
                            </>
                        ) : (
                            '--'
                        )}
                    </dd>
                </div>
                <div className='flex items-center justify-between gap-4'>
                    <dt className='text-white/55'>Total CPU Threads</dt>
                    <dd className='font-mono text-white/80'>{cpus ?? '--'}</dd>
                </div>
            </dl>
        </AdminCard>
    );
};

const NodeOverview = ({ node }: { node: AdminNode }) => (
    <div className='grid gap-4 xl:grid-cols-[1fr_320px]'>
        <div className='flex flex-col gap-4'>
            <NodeSystemInformation nodeId={node.id} />
            {node.description && (
                <AdminCard className='text-sm text-white/70'>
                    <pre className='whitespace-pre-wrap font-sans'>{node.description}</pre>
                </AdminCard>
            )}
            <AdminCard className='border-red-500/40 bg-red-500/10 text-sm text-red-100'>
                <div className='flex flex-col gap-4'>
                    <div>
                        <h2 className='text-lg font-semibold text-white'>Delete Node</h2>
                        <p className='mt-2 text-red-100/80'>
                            Deleting a node is an irreversible action and will immediately remove this node from the
                            panel. There must be no servers associated with this node in order to continue.
                        </p>
                    </div>
                    {node.servers.length > 0 ? (
                        <p className='font-medium text-red-100/80'>
                            This node still has {node.servers.length} server(s) assigned. Reassign or delete those
                            servers before deleting the node.
                        </p>
                    ) : (
                        <NodeDeleteButton node={node} />
                    )}
                </div>
            </AdminCard>
        </div>
        <div className='flex flex-col gap-4'>
            {node.maintenanceMode && (
                <AdminCard className='border-yellow-500/40 bg-yellow-500/10 text-sm text-yellow-100'>
                    <p className='text-xs uppercase tracking-[0.14em] text-yellow-300/70'>This node is under</p>
                    <p className='mt-1 text-2xl font-semibold'>Maintenance</p>
                </AdminCard>
            )}
            <ResourceBar label='Disk Space Allocated' used={node.allocatedDisk} total={node.diskCapacity} />
            <ResourceBar label='Memory Allocated' used={node.allocatedMemory} total={node.memoryCapacity} />
            <AdminCard>
                <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Total Servers</p>
                <p className='mt-1 text-2xl font-semibold'>{node.servers.length}</p>
            </AdminCard>
        </div>
    </div>
);

const NodeDeleteButton = ({ node }: { node: AdminNode }) => {
    const navigate = useNavigate();

    return (
        <AdminDeleteButton
            label='Delete Node'
            confirmation={`Delete node ${node.name}? This cannot be undone.`}
            onDelete={async () => {
                await deleteAdminNode(node.id);
                navigate('/admin/nodes');
            }}
        />
    );
};

const NodeNav = ({ id }: { id: number }) => {
    const tabs: AdminTabDefinition[] = [
        { label: 'About', to: `/admin/nodes/view/${id}`, end: true },
        { label: 'Settings', to: `/admin/nodes/view/${id}/settings` },
        { label: 'Configuration', to: `/admin/nodes/view/${id}/configuration` },
        { label: 'Allocation', to: `/admin/nodes/view/${id}/allocation` },
        { label: 'Servers', to: `/admin/nodes/view/${id}/servers` },
    ];

    return <AdminTabs tabs={tabs} />;
};

const NodeViewContainer = ({ mode }: NodeViewContainerProps) => {
    const { id } = useParams<'id'>();
    const { data, error, mutate } = useSWR(id ? ['admin:node', id] : null, () => getAdminNode(id ?? ''));

    return (
        <AdminPage title='Node Details' description='Review node health and allocated resources.'>
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && (
                <div className='flex flex-col gap-4'>
                    <NodeNav id={data.id} />
                    {mode === 'overview' && <NodeOverview node={data} />}
                    {mode === 'settings' && <NodeSettings node={data} onUpdated={mutate} />}
                    {mode === 'configuration' && <NodeConfiguration node={data} />}
                    {mode === 'allocation' && <NodeAllocations nodeId={data.id} />}
                    {mode === 'servers' && <NodeServers node={data} />}
                </div>
            )}
        </AdminPage>
    );
};

export default NodeViewContainer;
