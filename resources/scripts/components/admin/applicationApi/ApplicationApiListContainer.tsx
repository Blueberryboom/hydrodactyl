import { TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { deleteAdminApplicationApiKey, getAdminApplicationApiKeys } from '@/api/admin/application-api';
import { httpErrorToHuman } from '@/api/http';
import {
    AdminEmpty,
    AdminError,
    AdminLoading,
    AdminPage,
    AdminTable,
    AdminTableBody,
    AdminTableHead,
} from '@/components/admin/common';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';

const formatDate = (value: string | null): string => {
    if (!value) {
        return '—';
    }

    return format(new Date(value), 'MMM d, yyyy h:mm a');
};

const ApplicationApiListContainer = () => {
    const { data, error, mutate } = useSWR('admin:application-api-keys', getAdminApplicationApiKeys);
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [deleting, setDeleting] = useState(false);

    const doDelete = async () => {
        setDeleting(true);

        try {
            await deleteAdminApplicationApiKey(deleteIdentifier);
            await mutate();
            toast.success('API Key has been revoked.');
            setDeleteIdentifier('');
        } catch (error) {
            toast.error(httpErrorToHuman(error as { response?: { data?: unknown }; message?: string }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminPage
            title='Application API'
            description='Control access credentials for managing this Panel via the API.'
            actions={
                <Button asChild>
                    <Link to='/admin/api/new'>Create New</Link>
                </Button>
            }
        >
            <Dialog.Confirm
                open={deleteIdentifier !== ''}
                onClose={() => setDeleteIdentifier('')}
                title='Revoke API Key'
                confirm='Revoke'
                loading={deleting}
                onConfirmed={() => doDelete()}
            >
                Once this API key is revoked any applications currently using it will stop working.
            </Dialog.Confirm>
            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}
            {data && data.length === 0 && <AdminEmpty>No application API keys found.</AdminEmpty>}
            {data && data.length > 0 && (
                <AdminTable>
                    <AdminTableHead>
                        <tr>
                            <th className='px-4 py-3'>Key</th>
                            <th className='px-4 py-3'>Memo</th>
                            <th className='px-4 py-3'>Last Used</th>
                            <th className='px-4 py-3'>Created</th>
                            <th className='px-4 py-3 text-center'>
                                <span className='sr-only'>Actions</span>
                            </th>
                        </tr>
                    </AdminTableHead>
                    <AdminTableBody>
                        {data.map((key) => (
                            <tr key={key.identifier}>
                                <td className='max-w-xs px-4 py-3'>
                                    <code className='break-all font-mono text-xs text-white/65'>
                                        {key.identifier}
                                        {key.token}
                                    </code>
                                </td>
                                <td className='px-4 py-3'>{key.memo}</td>
                                <td className='px-4 py-3 text-white/55'>{formatDate(key.lastUsedAt)}</td>
                                <td className='px-4 py-3 text-white/55'>{formatDate(key.createdAt)}</td>
                                <td className='px-4 py-3 text-center'>
                                    <button
                                        type='button'
                                        className='cursor-pointer text-red-400 transition hover:text-red-300'
                                        aria-label={`Revoke ${key.memo}`}
                                        onClick={() => setDeleteIdentifier(key.identifier)}
                                    >
                                        <TrashBin width={18} height={18} fill='currentColor' />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </AdminTableBody>
                </AdminTable>
            )}
        </AdminPage>
    );
};

export default ApplicationApiListContainer;
