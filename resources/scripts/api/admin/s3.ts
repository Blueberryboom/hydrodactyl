import { rawDataToAdminS3Bucket } from '@/api/admin/transformers';
import type { AdminPaginatedResult, AdminS3Bucket, S3BucketFormPayload } from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    withQueryBuilderParams,
} from '@/api/http';

interface GetS3BucketsOptions {
    page?: number;
    name?: string;
}

interface TestS3ConnectionResponse {
    success: boolean;
    message: string;
}

export const getAdminS3Buckets = async ({
    page,
    name,
}: GetS3BucketsOptions = {}): Promise<AdminPaginatedResult<AdminS3Bucket>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/s3', {
        params: withQueryBuilderParams({
            page,
            filters: { name },
            sorts: { id: 'asc' },
        }),
    });

    return {
        items: data.data.map(rawDataToAdminS3Bucket),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminS3Bucket = async (id: string): Promise<AdminS3Bucket> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/s3/${id}`, {
        params: { include: 'servers' },
    });

    return rawDataToAdminS3Bucket(data);
};

export const createAdminS3Bucket = async (payload: S3BucketFormPayload): Promise<AdminS3Bucket> => {
    const { data } = await http.post<FractalResponseData>('/api/application/s3', payload);

    return rawDataToAdminS3Bucket(data);
};

export const updateAdminS3Bucket = async (id: number, payload: S3BucketFormPayload): Promise<AdminS3Bucket> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/s3/${id}`, payload);

    return rawDataToAdminS3Bucket(data);
};

export const deleteAdminS3Bucket = async (id: number): Promise<void> => {
    await http.delete(`/api/application/s3/${id}`);
};

export const testAdminS3Connection = async (payload: S3BucketFormPayload): Promise<TestS3ConnectionResponse> => {
    const { data } = await http.post<TestS3ConnectionResponse>('/api/application/s3/test-connection', payload);

    return data;
};
