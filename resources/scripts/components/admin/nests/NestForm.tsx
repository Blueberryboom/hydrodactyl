import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminNest, NestFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';

interface NestFormProps {
    nest?: AdminNest;
    submitLabel: string;
    onSubmit: (payload: NestFormPayload) => Promise<void>;
}

const NestForm = ({ nest, submitLabel, onSubmit }: NestFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const description = String(formData.get('description') ?? '');
        const payload: NestFormPayload = {
            name: String(formData.get('name') ?? ''),
            description: description.trim() === '' ? null : description,
        };

        try {
            await onSubmit(payload);
            toast.success('Changes saved.');
            setSubmitting(false);
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    return (
        <form className='flex max-w-3xl flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <AdminCard className='flex flex-col gap-4'>
                <AdminField
                    id='name'
                    label='Name'
                    description='A descriptive category name that encompasses the eggs within this nest.'
                >
                    <input id='name' name='name' required defaultValue={nest?.name ?? ''} className={adminInputClass} />
                </AdminField>
                <AdminField id='description' label='Description'>
                    <textarea
                        id='description'
                        name='description'
                        rows={6}
                        defaultValue={nest?.description ?? ''}
                        className={adminInputClass}
                    />
                </AdminField>
            </AdminCard>
            <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo='/admin/nests' />
        </form>
    );
};

export default NestForm;
