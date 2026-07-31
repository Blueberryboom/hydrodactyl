import { rawDataToAdminDatabaseHost } from '@/api/admin/transformers';
import type {
    AdminDatabaseHost,
    AdminDatabaseHostLocation,
    AdminPaginatedResult,
    DatabaseHostFormPayload,
    TestDatabaseHostConnectionResponse,
} from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    httpErrorToHuman,
    withQueryBuilderParams,
} from '@/api/http';

interface GetDatabaseHostsOptions {
    page?: number;
    name?: string;
}

export const getAdminDatabaseHosts = async ({
    page,
    name,
}: GetDatabaseHostsOptions = {}): Promise<AdminPaginatedResult<AdminDatabaseHost>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/databases', {
        params: {
            ...withQueryBuilderParams({
                page,
                filters: { name },
                sorts: { id: 'asc' },
            }),
            include: 'node_details',
        },
    });

    return {
        items: data.data.map(rawDataToAdminDatabaseHost),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminDatabaseHost = async (id: string): Promise<AdminDatabaseHost> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/databases/${id}`, {
        params: { include: 'databases.server_details' },
    });

    return rawDataToAdminDatabaseHost(data);
};

export const getAdminDatabaseHostLocations = async (): Promise<AdminDatabaseHostLocation[]> => {
    const { data } = await http.get<{ data: AdminDatabaseHostLocation[] }>('/api/application/databases/locations');

    return data.data;
};

export const createAdminDatabaseHost = async (payload: DatabaseHostFormPayload): Promise<AdminDatabaseHost> => {
    const { data } = await http.post<FractalResponseData>('/api/application/databases', payload);

    return rawDataToAdminDatabaseHost(data);
};

export const updateAdminDatabaseHost = async (
    id: number,
    payload: DatabaseHostFormPayload,
): Promise<AdminDatabaseHost> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/databases/${id}`, payload);

    return rawDataToAdminDatabaseHost(data);
};

export const deleteAdminDatabaseHost = async (id: number): Promise<void> => {
    await http.delete(`/api/application/databases/${id}`);
};

export const testAdminDatabaseHostConnection = async (
    payload: Pick<DatabaseHostFormPayload, 'host' | 'port' | 'username' | 'password'>,
): Promise<TestDatabaseHostConnectionResponse> => {
    try {
        const { data } = await http.post<TestDatabaseHostConnectionResponse>(
            '/api/application/databases/test-connection',
            payload,
        );

        return data;
    } catch (error) {
        const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;

        throw new Error(message ?? httpErrorToHuman(error));
    }
};
