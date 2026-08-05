import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import {
    createAdminNodeAllocations,
    deleteAdminNodeAllocation,
    getAdminNodeAllocations,
    updateAdminNodeAllocation,
} from '@/api/admin/nodes';
import type { AdminAllocation, AllocationFormPayload } from '@/api/admin/types';
import { httpErrorToHuman } from '@/api/http';
import {
    AdminCard,
    AdminEmpty,
    AdminError,
    AdminField,
    AdminLoading,
    AdminPagination,
    adminInputClass,
} from '@/components/admin/common';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const parsePorts = (value: string): string[] =>
    value
        .split(/[, ]+/)
        .map((port) => port.trim())
        .filter(Boolean);

const AllocationAliasInput = ({ nodeId, allocation }: { nodeId: number; allocation: AdminAllocation }) => {
    const [value, setValue] = useState(allocation.alias ?? '');
    const [saving, setSaving] = useState(false);

    const handleCommit = async () => {
        if (value === (allocation.alias ?? '')) {
            return;
        }

        setSaving(true);

        try {
            await updateAdminNodeAllocation(nodeId, allocation.id, value.trim() === '' ? null : value.trim());
        } catch (error) {
            setValue(allocation.alias ?? '');
            toast.error(httpErrorToHuman(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='flex items-center gap-2'>
            <input
                className={cn(adminInputClass, 'w-full py-1')}
                value={value}
                placeholder='none'
                onChange={(event) => setValue(event.currentTarget.value)}
                onBlur={handleCommit}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.currentTarget.blur();
                    }
                }}
            />
            {saving && <span className='text-xs text-white/40'>Saving...</span>}
        </div>
    );
};

const DeleteAllocationButton = ({
    nodeId,
    allocation,
    onDeleted,
}: {
    nodeId: number;
    allocation: AdminAllocation;
    onDeleted: (id: number) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);

        try {
            await deleteAdminNodeAllocation(nodeId, allocation.id);
            onDeleted(allocation.id);
            setOpen(false);
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button type='button' variant='destructive' size='sm' onClick={() => setOpen(true)}>
                Delete
            </Button>
            <Dialog.Confirm
                open={open}
                onClose={() => setOpen(false)}
                title='Delete Allocation'
                confirm='Delete'
                loading={loading}
                onConfirmed={handleDelete}
            >
                Are you sure you want to delete the allocation {allocation.ip}:{allocation.port}?
            </Dialog.Confirm>
        </>
    );
};

const AllocationCreateForm = ({ nodeId, onCreated }: { nodeId: number; onCreated: () => void }) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const ip = String(formData.get('ip') ?? '');
        const alias = String(formData.get('alias') ?? '');
        const payload: AllocationFormPayload = {
            ip,
            alias: alias.trim() === '' ? null : alias.trim(),
            ports: parsePorts(String(formData.get('ports') ?? '')),
        };

        try {
            await createAdminNodeAllocations(nodeId, payload);
            event.currentTarget.reset();
            toast.success('Allocations created.');
            onCreated();
        } catch (error) {
            setError(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminCard className='flex flex-col gap-4'>
            <h2 className='text-lg font-semibold'>Assign New Allocations</h2>
            {error && <AdminError error={error} />}
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <AdminField id='ip' label='IP Address' description='Enter an IP address to assign ports to here.'>
                    <input id='ip' name='ip' required className={adminInputClass} />
                </AdminField>
                <AdminField
                    id='alias'
                    label='IP Alias'
                    description='If you would like to assign a default alias to these allocations enter it here.'
                >
                    <input id='alias' name='alias' placeholder='alias' className={adminInputClass} />
                </AdminField>
                <AdminField
                    id='ports'
                    label='Ports'
                    description='Enter individual ports or port ranges here separated by commas or spaces.'
                >
                    <input id='ports' name='ports' required placeholder='25565, 25566' className={adminInputClass} />
                </AdminField>
                <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Allocations'}
                </Button>
            </form>
        </AdminCard>
    );
};

const NodeAllocations = ({ nodeId }: { nodeId: number }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page') ?? '1');
    const { data, error, mutate } = useSWR(['admin:node-allocations', nodeId, page], () =>
        getAdminNodeAllocations(nodeId, { page }),
    );

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [selectedOpen, setSelectedOpen] = useState(false);
    const [blockIp, setBlockIp] = useState<string | null>(null);
    const [deletingBlock, setDeletingBlock] = useState(false);
    const [deletingSelected, setDeletingSelected] = useState(false);

    const refresh = () => {
        void mutate();
    };

    const unassigned = (data?.items ?? []).filter((allocation) => !allocation.assigned);
    const ips = [...new Set((data?.items ?? []).map((allocation) => allocation.ip))].sort();

    const toggleAll = () => {
        setSelected((current) => {
            const next = new Set(current);
            const allSelected = unassigned.length > 0 && unassigned.every((allocation) => next.has(allocation.id));

            unassigned.forEach((allocation) => {
                if (allSelected) {
                    next.delete(allocation.id);
                } else {
                    next.add(allocation.id);
                }
            });

            return next;
        });
    };

    const handleDeleteSelected = async () => {
        setDeletingSelected(true);

        try {
            await Promise.all([...selected].map((id) => deleteAdminNodeAllocation(nodeId, id)));
            setSelected(new Set());
            setSelectedOpen(false);
            toast.success('Selected allocations deleted.');
            refresh();
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setDeletingSelected(false);
        }
    };

    const handleDeleteBlock = async () => {
        if (!blockIp) {
            return;
        }

        setDeletingBlock(true);

        try {
            const matching = (data?.items ?? []).filter(
                (allocation) => allocation.ip === blockIp && !allocation.assigned,
            );
            await Promise.all(matching.map((allocation) => deleteAdminNodeAllocation(nodeId, allocation.id)));
            setBlockIp(null);
            toast.success(`Deleted ${matching.length} allocation(s) for ${blockIp}.`);
            refresh();
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setDeletingBlock(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid gap-4 xl:grid-cols-[1fr_320px]'>
                <AdminCard className='flex flex-col gap-4'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                        <h2 className='text-lg font-semibold'>Existing Allocations</h2>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Button
                                type='button'
                                variant='secondary'
                                size='sm'
                                onClick={() => setBlockIp(ips[0] ?? null)}
                                disabled={ips.length === 0}
                            >
                                Delete IP Block
                            </Button>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                disabled={selected.size === 0}
                                onClick={() => setSelectedOpen(true)}
                            >
                                {deletingSelected ? 'Deleting...' : `Delete Selected (${selected.size})`}
                            </Button>
                        </div>
                    </div>
                    {error ? (
                        <AdminError error={error} />
                    ) : !data ? (
                        <AdminLoading />
                    ) : data.items.length === 0 ? (
                        <AdminEmpty>No allocations have been assigned to this node.</AdminEmpty>
                    ) : (
                        <AdminPagination
                            data={data}
                            onPageSelect={(selectedPage) => {
                                setSearchParams({ page: String(selectedPage) });
                            }}
                        >
                            {(allocations) => (
                                <div className='overflow-x-auto rounded-2xl border border-mocha-400'>
                                    <table className='w-full min-w-[760px] text-left text-sm'>
                                        <thead className='border-b border-mocha-400 bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-white/45'>
                                            <tr>
                                                <th className='px-4 py-3'>
                                                    <input
                                                        type='checkbox'
                                                        checked={
                                                            unassigned.length > 0 &&
                                                            unassigned.every((allocation) =>
                                                                selected.has(allocation.id),
                                                            )
                                                        }
                                                        onChange={toggleAll}
                                                    />
                                                </th>
                                                <th className='px-4 py-3'>IP Address</th>
                                                <th className='px-4 py-3'>IP Alias</th>
                                                <th className='px-4 py-3'>Port</th>
                                                <th className='px-4 py-3'>Assigned To</th>
                                                <th className='px-4 py-3' />
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-mocha-400 text-white/75'>
                                            {allocations.map((allocation) => (
                                                <tr key={allocation.id}>
                                                    <td className='px-4 py-3'>
                                                        <input
                                                            type='checkbox'
                                                            disabled={allocation.assigned}
                                                            checked={selected.has(allocation.id)}
                                                            onChange={(event) => {
                                                                setSelected((current) => {
                                                                    const next = new Set(current);
                                                                    if (event.currentTarget.checked) {
                                                                        next.add(allocation.id);
                                                                    } else {
                                                                        next.delete(allocation.id);
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className='px-4 py-3 font-mono text-white/70'>
                                                        {allocation.ip}
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        <AllocationAliasInput nodeId={nodeId} allocation={allocation} />
                                                    </td>
                                                    <td className='px-4 py-3 font-mono text-white/70'>
                                                        {allocation.port}
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        {allocation.server ? (
                                                            <Link
                                                                to={`/admin/servers/view/${allocation.server.id}`}
                                                                className='text-brand hover:text-brand/80'
                                                            >
                                                                {allocation.server.name}
                                                            </Link>
                                                        ) : (
                                                            <span className='text-white/40'>Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className='px-4 py-3'>
                                                        {!allocation.assigned && (
                                                            <DeleteAllocationButton
                                                                nodeId={nodeId}
                                                                allocation={allocation}
                                                                onDeleted={() => {
                                                                    setSelected((current) => {
                                                                        const next = new Set(current);
                                                                        next.delete(allocation.id);
                                                                        return next;
                                                                    });
                                                                    refresh();
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </AdminPagination>
                    )}
                </AdminCard>
                <AllocationCreateForm nodeId={nodeId} onCreated={refresh} />
            </div>

            <Dialog open={selectedOpen} onClose={() => setSelectedOpen(false)} title='Delete Selected Allocations'>
                <p className='text-sm text-white/60'>
                    Are you sure you want to delete {selected.size} selected allocation(s)? This cannot be undone.
                </p>
                <Dialog.Footer>
                    <Button variant='secondary' onClick={() => setSelectedOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant='destructive' disabled={deletingSelected} onClick={handleDeleteSelected}>
                        {deletingSelected ? 'Deleting...' : 'Delete'}
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <Dialog open={blockIp !== null} onClose={() => setBlockIp(null)} title='Delete Allocations for IP Block'>
                <div className='flex flex-col gap-4'>
                    <AdminField id='block_ip' label='IP Address'>
                        <select
                            id='block_ip'
                            className={adminInputClass}
                            value={blockIp ?? ''}
                            onChange={(event) => setBlockIp(event.currentTarget.value)}
                        >
                            {ips.map((ip) => (
                                <option key={ip} value={ip}>
                                    {ip}
                                </option>
                            ))}
                        </select>
                    </AdminField>
                    <p className='text-xs text-white/45'>
                        Only unassigned allocations will be removed. Allocations currently in use by a server are
                        skipped.
                    </p>
                </div>
                <Dialog.Footer>
                    <Button variant='secondary' onClick={() => setBlockIp(null)}>
                        Close
                    </Button>
                    <Button variant='destructive' disabled={deletingBlock} onClick={handleDeleteBlock}>
                        {deletingBlock ? 'Deleting...' : 'Delete Allocations'}
                    </Button>
                </Dialog.Footer>
            </Dialog>
        </div>
    );
};

export default NodeAllocations;
