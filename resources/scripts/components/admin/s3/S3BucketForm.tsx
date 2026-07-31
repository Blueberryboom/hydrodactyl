import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { testAdminS3Connection } from '@/api/admin/s3';
import type { AdminS3Bucket, S3BucketFormPayload } from '@/api/admin/types';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';
import { Button } from '@/components/ui/button';

interface S3BucketFormProps {
    bucket?: AdminS3Bucket;
    submitLabel: string;
    onSubmit: (payload: S3BucketFormPayload) => Promise<void>;
}

const getPayload = (form: HTMLFormElement): S3BucketFormPayload => {
    const formData = new FormData(form);
    const description = String(formData.get('description') ?? '');
    const endpoint = String(formData.get('endpoint') ?? '');
    const region = String(formData.get('region') ?? '');

    return {
        name: String(formData.get('name') ?? ''),
        description: description.trim() === '' ? null : description,
        access_key: String(formData.get('access_key') ?? ''),
        secret_key: String(formData.get('secret_key') ?? ''),
        endpoint: endpoint.trim() === '' ? null : endpoint,
        region: region.trim() === '' ? null : region,
        bucket_name: String(formData.get('bucket_name') ?? ''),
        use_path_style_endpoint: formData.get('use_path_style_endpoint') === '1',
        enabled: formData.get('enabled') === '1',
    };
};

const S3BucketForm = ({ bucket, submitLabel, onSubmit }: S3BucketFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [isTesting, setTesting] = useState(false);
    const [error, setError] = useState<unknown>();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        try {
            await onSubmit(getPayload(event.currentTarget));
            toast.success('Changes saved.');
            setSubmitting(false);
        } catch (error) {
            setError(error);
            setSubmitting(false);
        }
    };

    const handleTestConnection = async (form: HTMLFormElement) => {
        setTesting(true);
        setError(undefined);

        try {
            const response = await testAdminS3Connection(getPayload(form));
            toast.success(response.message);
            setTesting(false);
        } catch (error) {
            setError(error);
            setTesting(false);
        }
    };

    return (
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <div className='grid gap-4 xl:grid-cols-2'>
                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Bucket Details</h2>
                    <AdminField id='name' label='Name' description='A unique display name for this S3 configuration.'>
                        <input id='name' name='name' required defaultValue={bucket?.name ?? ''} className={adminInputClass} />
                    </AdminField>
                    <AdminField id='bucket_name' label='S3 Bucket Name' description='The actual bucket name on your S3 provider.'>
                        <input
                            id='bucket_name'
                            name='bucket_name'
                            required
                            defaultValue={bucket?.bucketName ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='description' label='Description'>
                        <textarea
                            id='description'
                            name='description'
                            rows={4}
                            defaultValue={bucket?.description ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                </AdminCard>

                <AdminCard className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold'>Connection</h2>
                    <AdminField id='access_key' label='Access Key'>
                        <input
                            id='access_key'
                            name='access_key'
                            required
                            defaultValue={bucket?.accessKey ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='secret_key' label='Secret Key'>
                        <input
                            id='secret_key'
                            name='secret_key'
                            type='password'
                            required
                            defaultValue={bucket?.secretKey ?? ''}
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='endpoint' label='Endpoint' description='Leave blank for AWS S3, or enter an S3-compatible endpoint URL.'>
                        <input
                            id='endpoint'
                            name='endpoint'
                            type='url'
                            defaultValue={bucket?.endpoint ?? ''}
                            placeholder='https://s3.amazonaws.com'
                            className={adminInputClass}
                        />
                    </AdminField>
                    <AdminField id='region' label='Region' description='Defaults to us-east-1 when left blank.'>
                        <input
                            id='region'
                            name='region'
                            defaultValue={bucket?.region ?? 'us-east-1'}
                            className={adminInputClass}
                        />
                    </AdminField>
                </AdminCard>
            </div>

            <AdminCard className='grid gap-4 md:grid-cols-2'>
                <AdminField id='use_path_style_endpoint' label='Use Path-Style Endpoints' description='Enable this for providers that require path-style endpoint addressing.'>
                    <select
                        id='use_path_style_endpoint'
                        name='use_path_style_endpoint'
                        defaultValue={bucket?.usePathStyleEndpoint ? '1' : '0'}
                        className={adminInputClass}
                    >
                        <option value='0'>Disabled</option>
                        <option value='1'>Enabled</option>
                    </select>
                </AdminField>
                <AdminField id='enabled' label='Enabled' description='Disabled buckets cannot be selected for new backup storage.'>
                    <select id='enabled' name='enabled' defaultValue={bucket?.enabled === false ? '0' : '1'} className={adminInputClass}>
                        <option value='1'>Enabled</option>
                        <option value='0'>Disabled</option>
                    </select>
                </AdminField>
            </AdminCard>

            <div className='flex flex-wrap gap-2'>
                <AdminSubmitRow isSubmitting={isSubmitting} submitLabel={submitLabel} cancelTo='/admin/buckets' />
                <Button
                    type='button'
                    variant='secondary'
                    disabled={isTesting}
                    onClick={(event) => {
                        if (event.currentTarget.form) {
                            void handleTestConnection(event.currentTarget.form);
                        }
                    }}
                >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
            </div>
        </form>
    );
};

export default S3BucketForm;
