import { rawDataToAdminUser } from '@/api/admin/transformers';
import type { AdminPaginatedResult, AdminUser, UserFormPayload } from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    withQueryBuilderParams,
} from '@/api/http';

interface GetUsersOptions {
    page?: number;
    email?: string;
}

export const getAdminUsers = async ({
    page,
    email,
}: GetUsersOptions = {}): Promise<AdminPaginatedResult<AdminUser>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/users', {
        params: withQueryBuilderParams({
            page,
            filters: { email },
            sorts: { id: 'asc' },
        }),
    });

    return {
        items: data.data.map(rawDataToAdminUser),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminUser = async (id: string): Promise<AdminUser> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/users/${id}`, {
        params: { include: 'servers' },
    });

    return rawDataToAdminUser(data);
};

export const createAdminUser = async (payload: UserFormPayload): Promise<AdminUser> => {
    const { data } = await http.post<FractalResponseData>('/api/application/users', payload);

    return rawDataToAdminUser(data);
};

export const updateAdminUser = async (id: number, payload: UserFormPayload): Promise<AdminUser> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/users/${id}`, payload);

    return rawDataToAdminUser(data);
};

export const deleteAdminUser = async (id: number): Promise<void> => {
    await http.delete(`/api/application/users/${id}`);
};
