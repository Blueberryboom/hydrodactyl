import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { createAdminEgg, importAdminEgg, importAdminEggFromUrl } from '@/api/admin/eggs';
import { getAdminNests } from '@/api/admin/nests';
import type { EggFormPayload } from '@/api/admin/types';
import { AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import EggForm from '@/components/admin/nests/EggForm';
import EggImportForm from '@/components/admin/nests/EggImportForm';

const EggCreateContainer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const nestId = Number(searchParams.get('nest_id') ?? '0') || undefined;
    const { data, error } = useSWR(['admin:nests', 'egg-create'], () => getAdminNests());

    const handleSubmit = async (selectedNestId: number, payload: EggFormPayload) => {
        const egg = await createAdminEgg(selectedNestId, payload);
        navigate(`/admin/nests/egg/${egg.id}?nest_id=${selectedNestId}`);
    };

    const handleFileImport = async (selectedNestId: number, file: File) => {
        const egg = await importAdminEgg(selectedNestId, file);
        navigate(`/admin/nests/egg/${egg.id}?nest_id=${selectedNestId}`);
    };

    const handleUrlImport = async (selectedNestId: number, url: string) => {
        const egg = await importAdminEggFromUrl(selectedNestId, url);
        navigate(`/admin/nests/egg/${egg.id}?nest_id=${selectedNestId}`);
    };

    return (
        <AdminPage title='Create Egg' description='Create a new egg and assign it to a nest.'>
            {error ? (
                <AdminError error={error} />
            ) : !data ? (
                <AdminLoading />
            ) : (
                <div className='flex flex-col gap-4'>
                    <EggImportForm
                        nests={data.items}
                        nestId={nestId}
                        onImportFile={handleFileImport}
                        onImportUrl={handleUrlImport}
                    />
                    <EggForm nests={data.items} nestId={nestId} submitLabel='Create Egg' onSubmit={handleSubmit} />
                </div>
            )}
        </AdminPage>
    );
};

export default EggCreateContainer;
