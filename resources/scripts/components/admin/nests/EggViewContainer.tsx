import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { deleteAdminEgg, getAdminEgg, updateAdminEgg } from '@/api/admin/eggs';
import type { EggFormPayload } from '@/api/admin/types';
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
import EggForm from '@/components/admin/nests/EggForm';

const EggViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const nestId = Number(searchParams.get('nest_id') ?? '0');
    const { data, error, mutate } = useSWR(nestId > 0 && id ? ['admin:egg', nestId, id] : null, () =>
        getAdminEgg(nestId, id ?? ''),
    );

    const handleSubmit = async (selectedNestId: number, payload: EggFormPayload) => {
        if (!data) {
            return;
        }

        const egg = await updateAdminEgg(selectedNestId, data.id, payload);
        await mutate(egg, false);
    };

    return (
        <AdminPage
            title='Egg Details'
            description='Review egg metadata, Docker images, and process configuration.'
            actions={
                data ? (
                    <AdminDeleteButton
                        label='Delete Egg'
                        confirmation={`Delete egg ${data.name}? This cannot be undone.`}
                        onDelete={async () => {
                            await deleteAdminEgg(data.nestId, data.id);
                            navigate(`/admin/nests/view/${data.nestId}`);
                        }}
                    />
                ) : undefined
            }
        >
            {nestId <= 0 ? <AdminEmpty>This egg link is missing a nest context.</AdminEmpty> : null}
            {error ? <AdminError error={error} /> : nestId > 0 && !data ? <AdminLoading /> : null}
            {data && (
                <div className='flex flex-col gap-4'>
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
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Nest</p>
                            <Link
                                to={`/admin/nests/view/${data.nestId}`}
                                className='mt-1 block text-brand hover:text-brand/80'
                            >
                                #{data.nestId}
                            </Link>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Force Outgoing IP</p>
                            <p className='mt-1 font-medium'>{data.forceOutgoingIp ? 'Enabled' : 'Disabled'}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Features</p>
                            <p className='mt-1 font-medium'>
                                {data.features.length ? data.features.join(', ') : 'None'}
                            </p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Config Extends</p>
                            <p className='mt-1 font-medium'>{data.configExtends ?? 'None'}</p>
                        </div>
                        <div>
                            <p className='text-xs uppercase tracking-[0.14em] text-white/40'>Script Extends</p>
                            <p className='mt-1 font-medium'>{data.scriptExtends ?? 'None'}</p>
                        </div>
                    </AdminCard>

                    {data.description && <AdminCard className='text-sm text-white/70'>{data.description}</AdminCard>}

                    <EggForm
                        egg={data}
                        nests={[{ id: data.nestId, name: `Nest #${data.nestId}` }]}
                        submitLabel='Save Egg'
                        onSubmit={handleSubmit}
                    />

                    <AdminTable>
                        <AdminTableHead>
                            <tr>
                                <th className='px-4 py-3'>Label</th>
                                <th className='px-4 py-3'>Image</th>
                            </tr>
                        </AdminTableHead>
                        <AdminTableBody>
                            {Object.entries(data.dockerImages).map(([label, image]) => (
                                <tr key={label}>
                                    <td className='px-4 py-3'>{label}</td>
                                    <td className='px-4 py-3 font-mono text-white/65'>{image}</td>
                                </tr>
                            ))}
                        </AdminTableBody>
                    </AdminTable>
                </div>
            )}
        </AdminPage>
    );
};

export default EggViewContainer;
