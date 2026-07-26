import { rawDataToAdminNest } from '@/api/admin/transformers';
import type { AdminNest, AdminPaginatedResult, NestFormPayload } from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    withQueryBuilderParams,
} from '@/api/http';

interface GetNestsOptions {
    page?: number;
    name?: string;
}

export const getAdminNests = async ({ page, name }: GetNestsOptions = {}): Promise<AdminPaginatedResult<AdminNest>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/nests', {
        params: {
            include: 'eggs',
            ...withQueryBuilderParams({
                page,
                filters: { name },
                sorts: { id: 'asc' },
            }),
        },
    });

    return {
        items: data.data.map(rawDataToAdminNest),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminNest = async (id: string): Promise<AdminNest> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/nests/${id}`, {
        params: { include: 'eggs' },
    });

    return rawDataToAdminNest(data);
};

export const createAdminNest = async (payload: NestFormPayload): Promise<AdminNest> => {
    const { data } = await http.post<FractalResponseData>('/api/application/nests', payload);

    return rawDataToAdminNest(data);
};

export const updateAdminNest = async (id: number, payload: NestFormPayload): Promise<AdminNest> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/nests/${id}`, payload);

    return rawDataToAdminNest(data);
};

export const deleteAdminNest = async (id: number): Promise<void> => {
    await http.delete(`/api/application/nests/${id}`);
};
