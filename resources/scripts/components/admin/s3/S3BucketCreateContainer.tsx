import { useNavigate } from 'react-router-dom';
import { createAdminS3Bucket } from '@/api/admin/s3';
import type { S3BucketFormPayload } from '@/api/admin/types';
import { AdminPage } from '@/components/admin/common';
import S3BucketForm from '@/components/admin/s3/S3BucketForm';

const S3BucketCreateContainer = () => {
    const navigate = useNavigate();

    const handleSubmit = async (payload: S3BucketFormPayload) => {
        const bucket = await createAdminS3Bucket(payload);
        navigate(`/admin/buckets/view/${bucket.id}`);
    };

    return (
        <AdminPage title='Create S3 Bucket' description='Add a new S3 bucket configuration for backups.'>
            <S3BucketForm submitLabel='Create Bucket' onSubmit={handleSubmit} />
        </AdminPage>
    );
};

export default S3BucketCreateContainer;
