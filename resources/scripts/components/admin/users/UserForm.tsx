import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminUser, UserFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';

interface UserFormProps {
    user?: AdminUser;
    submitLabel: string;
    onSubmit: (payload: UserFormPayload) => Promise<void>;
}

const UserForm = ({ user, submitLabel, onSubmit }: UserFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        const formData = new FormData(event.currentTarget);
        const password = String(formData.get('password') ?? '');

        const payload: UserFormPayload = {
            email: String(formData.get('email') ?? ''),
            username: String(formData.get('username') ?? ''),
            first_name: String(formData.get('first_name') ?? ''),
            last_name: String(formData.get('last_name') ?? ''),
            language: String(formData.get('language') ?? 'en'),
            root_admin: formData.get('root_admin') === '1',
            ...(password.trim() !== '' ? { password } : {}),
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
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <div className='grid gap-4 xl:grid-cols-2'>
                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Identity</h2>
                    <AdminField id='email' label='Email'>
                        <input
                            id='email'
                            name='email'
                            type='email'
                            required
                            defaultValue={user?.email ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='username' label='Username'>
                        <input
                            id='username'
                            name='username'
                            required
                            defaultValue={user?.username ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='first_name' label='First Name'>
                        <input
                            id='first_name'
                            name='first_name'
                            required
                            defaultValue={user?.firstName ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='last_name' label='Last Name'>
                        <input
                            id='last_name'
                            name='last_name'
                            required
                            defaultValue={user?.lastName ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='language' label='Default Language'>
                        <input
                            id='language'
                            name='language'
                            required
                            defaultValue={user?.language ?? 'en'}
                            className={adminInputClass}
                        />
                    </AdminField>
                </AdminCard>

                <div className='flex flex-col gap-4'>
                    <AdminCard className='flex flex-col gap-4'>
                        <h2 className='text-lg font-semibold'>Permissions</h2>
                        <AdminField
                            id='root_admin'
                            label='Administrator'
                            description='Grants full administrative access.'
                        >
                            <select
                                id='root_admin'
                                name='root_admin'
                                defaultValue={user?.rootAdmin ? '1' : '0'}
                                className={adminInputClass}
                            >
                                <option value='0'>No</option>
                                <option value='1'>Yes</option>
                            </select>
                        </AdminField>
                    </AdminCard>

                    <AdminCard className='flex flex-col gap-4'>
                        <h2 className='text-lg font-semibold'>Password</h2>
                        <p className='text-sm text-white/55'>
                            Passwords are optional. Leave this blank to keep the current password or allow the user to
                            configure it separately.
                        </p>
                        <AdminField id='password' label='Password'>
                            <input id='password' name='password' type='password' className={adminInputClass} />
                        </AdminField>
                    </AdminCard>
                </div>
            </div>

            <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo='/admin/users' />
        </form>
    );
};

export default UserForm;
