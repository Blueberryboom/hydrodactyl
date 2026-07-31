import type { FormEvent } from 'react';
import { useState } from 'react';
import type { AdminDatabaseHost, AdminDatabaseHostLocation, DatabaseHostFormPayload } from '@/api/admin/types';
import { AdminCard, AdminDeleteButton, AdminError, AdminField, adminInputClass } from '@/components/admin/common';
import { Button } from '@/components/ui/button';

interface DatabaseHostFormProps {
    host: AdminDatabaseHost;
    locations: AdminDatabaseHostLocation[];
    onSubmit: (payload: DatabaseHostFormPayload) => Promise<void>;
    onDelete: () => Promise<void>;
}

const DatabaseHostForm = ({ host, locations, onSubmit, onDelete }: DatabaseHostFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [error, setError] = useState<unknown>();

    const buildPayload = (form: HTMLFormElement): DatabaseHostFormPayload => {
        const formData = new FormData(form);
        const nodeId = formData.get('node_id');
        const password = String(formData.get('password') ?? '');

        return {
            name: String(formData.get('name') ?? ''),
            host: String(formData.get('host') ?? ''),
            port: Number(formData.get('port') ?? '3306'),
            username: String(formData.get('username') ?? ''),
            password: password === '' ? undefined : password,
            node_id: nodeId ? Number(nodeId) : null,
        };
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        try {
            await onSubmit(buildPayload(event.currentTarget));
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
                    <h2 className='text-lg font-semibold'>Host Details</h2>
                    <AdminField id='name' label='Name'>
                        <input id='name' name='name' required defaultValue={host.name} className={adminInputClass} />
                    </AdminField>
                    <AdminField
                        id='host'
                        label='Host'
                        description='The IP address or FQDN that should be used when attempting to connect to this MySQL host from the panel to add new databases.'
                    >
                        <input id='host' name='host' required defaultValue={host.host} className={adminInputClass} />
                    </AdminField>
                    <AdminField id='port' label='Port' description='The port that MySQL is running on for this host.'>
                        <input
                            id='port'
                            name='port'
                            type='number'
                            required
                            min={1}
                            max={65535}
                            defaultValue={host.port}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='node_id'
                        label='Linked Node'
                        description='This setting does nothing other than default to this database host when adding a database to a server on the selected node.'
                    >
                        <select
                            id='node_id'
                            name='node_id'
                            defaultValue={host.nodeId ?? ''}
                            className={adminInputClass}
                        >
                            <option value=''>None</option>
                            {locations.map((location) => (
                                <optgroup key={location.id} label={location.short}>
                                    {location.nodes.map((node) => (
                                        <option key={node.id} value={node.id}>
                                            {node.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </AdminField>
                </AdminCard>
                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>User Details</h2>
                    <AdminField
                        id='username'
                        label='Username'
                        description='The username of an account that has enough permissions to create new users and databases on the system.'
                    >
                        <input
                            id='username'
                            name='username'
                            required
                            defaultValue={host.username}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField
                        id='password'
                        label='Password'
                        description='The password to the account defined. Leave blank to continue using the assigned password.'
                    >
                        <input id='password' name='password' type='password' className={adminInputClass} />
                    </AdminField>
                    <div className='mt-auto'>
                        <p className='text-xs text-red-300/85'>
                            The account defined for this database host <strong>must</strong> have the{' '}
                            <code>WITH GRANT OPTION</code> permission. If the defined account does not have this
                            permission requests to create databases <em>will</em> fail.{' '}
                            <strong>
                                Do not use the same account details for MySQL that you have defined for this panel!!
                            </strong>
                        </p>
                    </div>
                </AdminCard>
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2'>
                <AdminDeleteButton
                    label='Delete'
                    confirmation={`Delete database host ${host.name}? This action cannot be undone.`}
                    onDelete={onDelete}
                />
                <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
};

export default DatabaseHostForm;
