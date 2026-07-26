import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminLocation, LocationFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';

interface LocationFormProps {
    location?: AdminLocation;
    submitLabel: string;
    onSubmit: (payload: LocationFormPayload) => Promise<void>;
}

const LocationForm = ({ location, submitLabel, onSubmit }: LocationFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const payload: LocationFormPayload = {
            short: String(formData.get('short') ?? ''),
            long: String(formData.get('long') ?? ''),
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
                <AdminField id='short' label='Identifier' description='A short unique identifier for this location.'>
                    <input
                        id='short'
                        name='short'
                        required
                        defaultValue={location?.short ?? ''}
                        className={adminInputClass}
                    />
                </AdminField>
                <AdminField id='long' label='Description'>
                    <input
                        id='long'
                        name='long'
                        required
                        defaultValue={location?.long ?? ''}
                        className={adminInputClass}
                    />
                </AdminField>
            </AdminCard>
            <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo='/admin/locations' />
        </form>
    );
};

export default LocationForm;
