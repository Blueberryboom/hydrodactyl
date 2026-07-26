import { Link, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteAdminNest, getAdminNest, updateAdminNest } from '@/api/admin/nests';
import type { NestFormPayload } from '@/api/admin/types';
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
import NestForm from '@/components/admin/nests/NestForm';
import { Button } from '@/components/ui/button';

const NestViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data, error, mutate } = useSWR(id ? ['admin:nest', id] : null, () => getAdminNest(id ?? ''));

    const handleSubmit = async (payload: NestFormPayload) => {
        if (!data) {
            return;
        }

        const nest = await updateAdminNest(data.id, payload);
        await mutate({ ...nest, eggCount: data.eggCount, eggs: data.eggs }, false);
    };

    return (
        <AdminPage
            title='Nest Details'
            description='Edit nest metadata and review its eggs.'
            actions={
                data ? (
                    <>
                        <Button asChild>
                            <Link to={`/admin/nests/egg/new?nest_id=${data.id}`}>Add Egg</Link>
                        </Button>
                        <AdminDeleteButton
                            label='Delete Nest'
                            confirmation={`Delete nest ${data.name}? This cannot be undone.`}
                            onDelete={async () => {
                                await deleteAdminNest(data.id);
                                navigate('/admin/nests');
                            }}
                        />
                    </>
                ) : undefined
            }
        >
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && (
                <div className='flex flex-col gap-4'>
                    <NestForm nest={data} submitLabel='Save Nest' onSubmit={handleSubmit} />

                    <AdminCard className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Name</p>
                            <p className='mt-1 font-medium'>{data.name}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Author</p>
                            <p className='mt-1 font-medium'>{data.author}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>UUID</p>
                            <p className='mt-1 font-mono text-sm text-white/65'>{data.uuid}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Eggs</p>
                            <p className='mt-1 font-medium'>{data.eggCount}</p>
                        </div>
                    </AdminCard>

                    {data.description && <AdminCard className='text-sm text-white/70'>{data.description}</AdminCard>}

                    {data.eggs.length === 0 ? (
                        <AdminEmpty>No eggs are assigned to this nest.</AdminEmpty>
                    ) : (
                        <AdminTable>
                            <AdminTableHead>
                                <tr>
                                    <th className='px-4 py-3'>ID</th>
                                    <th className='px-4 py-3'>Name</th>
                                    <th className='px-4 py-3'>UUID</th>
                                    <th className='px-4 py-3'>Description</th>
                                </tr>
                            </AdminTableHead>
                            <AdminTableBody>
                                {data.eggs.map((egg) => (
                                    <tr key={egg.id}>
                                        <td className='px-4 py-3 font-mono text-white/55'>{egg.id}</td>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/admin/nests/egg/${egg.id}?nest_id=${data.id}`}
                                                className='text-brand hover:text-brand/80'
                                            >
                                                {egg.name}
                                            </Link>
                                        </td>
                                        <td className='px-4 py-3 font-mono text-white/55'>{egg.uuid}</td>
                                        <td className='px-4 py-3 text-white/65'>
                                            {egg.description ?? 'No description'}
                                        </td>
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

export default NestViewContainer;
