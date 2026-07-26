import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminNest } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, adminInputClass } from '@/components/admin/common';
import { Button } from '@/components/ui/button';

interface EggImportFormProps {
    nests: AdminNest[];
    nestId?: number;
    onImportFile: (nestId: number, file: File) => Promise<void>;
    onImportUrl: (nestId: number, url: string) => Promise<void>;
}

const EggImportForm = ({ nests, nestId, onImportFile, onImportUrl }: EggImportFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const getNestId = (form: HTMLFormElement): number => Number(new FormData(form).get('nest_id') ?? nestId ?? 0);

    const handleFileImport = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const file = formData.get('import_file');

        try {
            if (!(file instanceof File)) {
                throw new Error('Select a JSON egg file to import.');
            }

            await onImportFile(getNestId(event.currentTarget), file);
            toast.success('Egg imported.');
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    const handleUrlImport = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const url = String(formData.get('import_file_url') ?? '');

        try {
            await onImportUrl(getNestId(event.currentTarget), url);
            toast.success('Egg imported.');
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    const renderNestSelect = (id: string) => (
        <AdminField id={id} label='Associated Nest'>
            <select
                id={id}
                name='nest_id'
                required
                disabled={nestId !== undefined}
                defaultValue={nestId ?? nests[0]?.id ?? ''}
                className={adminInputClass}
            >
                {nests.map((nest) => (
                    <option key={nest.id} value={nest.id}>
                        {nest.name}
                    </option>
                ))}
            </select>
        </AdminField>
    );

    return (
        <AdminCard className='flex flex-col gap-4'>
            <div>
                <h2 className='text-lg font-semibold'>Import Egg</h2>
                <p className='mt-1 text-sm text-white/55'>
                    Upload a Pterodactyl egg JSON file or import one from an allowed URL.
                </p>
            </div>
            {error && <AdminError error={error} />}
            <div className='grid gap-4 xl:grid-cols-2'>
                <form className='flex flex-col gap-4' onSubmit={handleFileImport}>
                    {renderNestSelect('import_file_nest_id')}
                    <AdminField id='import_file' label='Egg JSON File'>
                        <input
                            id='import_file'
                            name='import_file'
                            type='file'
                            accept='.json,application/json'
                            required
                            className={adminInputClass}
                        />
                    </AdminField>
                    <Button type='submit' disabled={isSubmitting}>
                        {isSubmitting ? 'Importing...' : 'Upload JSON'}
                    </Button>
                </form>
                <form className='flex flex-col gap-4' onSubmit={handleUrlImport}>
                    {renderNestSelect('import_url_nest_id')}
                    <AdminField id='import_file_url' label='Egg URL'>
                        <input
                            id='import_file_url'
                            name='import_file_url'
                            type='url'
                            required
                            className={adminInputClass}
                        />
                    </AdminField>
                    <Button type='submit' disabled={isSubmitting} variant='secondary'>
                        {isSubmitting ? 'Importing...' : 'Import URL'}
                    </Button>
                </form>
            </div>
        </AdminCard>
    );
};

export default EggImportForm;
