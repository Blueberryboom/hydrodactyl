import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import {
    createAdminDatabaseHost,
    getAdminDatabaseHostLocations,
    testAdminDatabaseHostConnection,
} from '@/api/admin/databases';
import type { DatabaseHostFormPayload } from '@/api/admin/types';
import { httpErrorToHuman } from '@/api/http';
import { AdminField, adminInputClass } from '@/components/admin/common';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';

interface DatabaseHostCreateDialogProps {
    open: boolean;
    onClose: () => void;
}

interface TestResult {
    type: 'success' | 'error';
    message: string;
}

const DatabaseHostCreateDialog = ({ open, onClose }: DatabaseHostCreateDialogProps) => {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const { data: locations } = useSWR(open ? 'admin:database-host-locations' : null, getAdminDatabaseHostLocations);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isTesting, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);

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

    const handleTest = async (form: HTMLFormElement) => {
        const payload = buildPayload(form);

        if (!payload.host || !payload.port || !payload.username || !payload.password) {
            setTestResult({ type: 'error', message: 'Please fill in all required database connection fields.' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const response = await testAdminDatabaseHostConnection({
                host: payload.host,
                port: payload.port,
                username: payload.username,
                password: payload.password,
            });
            setTestResult({ type: 'success', message: response.message });
        } catch (error) {
            setTestResult({ type: 'error', message: error instanceof Error ? error.message : httpErrorToHuman(error) });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setTestResult(null);

        try {
            const host = await createAdminDatabaseHost(buildPayload(event.currentTarget));
            onClose();
            navigate(`/admin/databases/view/${host.id}`);
        } catch (error) {
            setTestResult({ type: 'error', message: httpErrorToHuman(error) });
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Create New Database Host' onClose={onClose}>
            <form ref={formRef} className='mt-4 flex flex-col gap-4' onSubmit={handleSubmit}>
                {testResult && (
                    <div
                        className={`rounded-xl border px-3 py-2 text-sm ${
                            testResult.type === 'success'
                                ? 'border-green-500/40 bg-green-500/10 text-green-100'
                                : 'border-red-500/40 bg-red-500/10 text-red-100'
                        }`}
                    >
                        {testResult.message}
                    </div>
                )}
                <AdminField
                    id='name'
                    label='Name'
                    description='A short identifier used to distinguish this host from others. Must be between 1 and 60 characters, for example, us.nyc.lvl3.'
                >
                    <input id='name' name='name' required className={adminInputClass} />
                </AdminField>
                <div className='grid gap-4 sm:grid-cols-2'>
                    <AdminField
                        id='host'
                        label='Host'
                        description='The IP address or FQDN that should be used when attempting to connect to this MySQL host from the panel to add new databases.'
                    >
                        <input id='host' name='host' required className={adminInputClass} />
                    </AdminField>
                    <AdminField id='port' label='Port' description='The port that MySQL is running on for this host.'>
                        <input
                            id='port'
                            name='port'
                            type='number'
                            required
                            min={1}
                            max={65535}
                            defaultValue='3306'
                            className={adminInputClass}
                        />
                    </AdminField>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                    <AdminField
                        id='username'
                        label='Username'
                        description='The username of an account that has enough permissions to create new users and databases on the system.'
                    >
                        <input id='username' name='username' required className={adminInputClass} />
                    </AdminField>
                    <AdminField id='password' label='Password' description='The password to the account defined.'>
                        <input id='password' name='password' type='password' required className={adminInputClass} />
                    </AdminField>
                </div>
                <AdminField
                    id='node_id'
                    label='Linked Node'
                    description='This setting does nothing other than default to this database host when adding a database to a server on the selected node.'
                >
                    <select id='node_id' name='node_id' className={adminInputClass}>
                        <option value=''>None</option>
                        {locations?.map((location) => (
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
            </form>
            <Dialog.Footer>
                <div className='flex w-full flex-col gap-3'>
                    <p className='text-left text-xs text-red-300/85'>
                        The account defined for this database host <strong>must</strong> have the{' '}
                        <code>WITH GRANT OPTION</code> permission. If the defined account does not have this permission
                        requests to create databases <em>will</em> fail.{' '}
                        <strong>
                            Do not use the same account details for MySQL that you have defined for this panel.
                        </strong>
                    </p>
                    <div className='flex flex-wrap justify-end gap-2'>
                        <Button type='button' variant='secondary' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type='button'
                            variant='secondary'
                            disabled={isTesting}
                            onClick={() => {
                                if (formRef.current) {
                                    void handleTest(formRef.current);
                                }
                            }}
                        >
                            {isTesting ? 'Testing...' : 'Test Database'}
                        </Button>
                        <Button type='button' disabled={isSubmitting} onClick={() => formRef.current?.requestSubmit()}>
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog>
    );
};

export default DatabaseHostCreateDialog;
