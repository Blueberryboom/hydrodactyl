import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminApiKeyPermissionOptions, AdminApplicationApiKeyPayload } from '@/api/admin/types';
import {
    AdminCard,
    AdminError,
    AdminField,
    AdminSubmitRow,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
    adminInputClass,
} from '@/components/admin/common';

interface ApplicationApiFormProps {
    permissionOptions: AdminApiKeyPermissionOptions;
    onSubmit: (payload: AdminApplicationApiKeyPayload) => Promise<void>;
}

const formatResourceName = (resource: string): string =>
    resource
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const ApplicationApiForm = ({ permissionOptions, onSubmit }: ApplicationApiFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();
    const [permissions, setPermissions] = useState<Record<string, number>>(() =>
        Object.fromEntries(permissionOptions.resources.map((resource) => [resource, permissionOptions.none])),
    );

    const setPermission = (resource: string, value: number) => {
        setPermissions((prev) => ({ ...prev, [resource]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);

        const payload: AdminApplicationApiKeyPayload = {
            memo: String(formData.get('memo') ?? ''),
            ...Object.fromEntries(
                permissionOptions.resources.map((resource) => [`r_${resource}`, permissions[resource]]),
            ),
        };

        try {
            await onSubmit(payload);
            toast.success('A new application API key has been generated.');
            setSubmitting(false);
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    return (
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {error ? <AdminError error={error} /> : null}
            <div className='grid gap-4 lg:grid-cols-3'>
                <div className='flex flex-col gap-4 lg:col-span-2'>
                    <h2 className='text-lg font-semibold'>Select Permissions</h2>
                    <AdminTable>
                        <AdminTableHead>
                            <tr>
                                <th className='px-4 py-3'>Resource</th>
                                <th className='px-4 py-3 text-center'>Read</th>
                                <th className='px-4 py-3 text-center'>Read &amp; Write</th>
                                <th className='px-4 py-3 text-center'>None</th>
                            </tr>
                        </AdminTableHead>
                        <AdminTableBody>
                            {permissionOptions.resources.map((resource) => (
                                <tr key={resource}>
                                    <td className='px-4 py-3 font-medium'>{formatResourceName(resource)}</td>
                                    {[
                                        { label: 'Read', value: permissionOptions.read },
                                        { label: 'Read & Write', value: permissionOptions.readWrite },
                                        { label: 'None', value: permissionOptions.none },
                                    ].map(({ label, value }) => (
                                        <td key={label} className='px-4 py-3 text-center'>
                                            <label className='inline-flex cursor-pointer items-center gap-2 text-sm text-white/70'>
                                                <input
                                                    type='radio'
                                                    name={`r_${resource}`}
                                                    value={value}
                                                    checked={permissions[resource] === value}
                                                    onChange={() => setPermission(resource, value)}
                                                />
                                                {label}
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </AdminTableBody>
                    </AdminTable>
                </div>

                <div className='flex flex-col gap-4'>
                    <AdminCard className='flex flex-col gap-4'>
                        <AdminField id='memo' label='Description'>
                            <input id='memo' name='memo' required maxLength={500} className={adminInputClass} />
                        </AdminField>
                        <p className='text-sm text-white/55'>
                            Once you have assigned permissions and created this set of credentials you will be unable to
                            come back and edit it. If you need to make changes down the road you will need to create a
                            new set of credentials.
                        </p>
                    </AdminCard>
                    <AdminSubmitRow
                        isSubmitting={isSubmitting}
                        submitLabel='Create Credentials'
                        cancelTo='/admin/api'
                    />
                </div>
            </div>
        </form>
    );
};

export default ApplicationApiForm;
