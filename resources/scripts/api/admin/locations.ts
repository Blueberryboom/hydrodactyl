import { rawDataToAdminLocation } from '@/api/admin/transformers';
import type { AdminLocation, AdminPaginatedResult, LocationFormPayload } from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    withQueryBuilderParams,
} from '@/api/http';

interface GetLocationsOptions {
    page?: number;
    short?: string;
}

export const getAdminLocations = async ({
    page,
    short,
}: GetLocationsOptions = {}): Promise<AdminPaginatedResult<AdminLocation>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/locations', {
        params: withQueryBuilderParams({
            page,
            filters: { short },
            sorts: { id: 'asc' },
        }),
    });

    return {
        items: data.data.map(rawDataToAdminLocation),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminLocation = async (id: string): Promise<AdminLocation> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/locations/${id}`, {
        params: { include: 'nodes,servers' },
    });

    return rawDataToAdminLocation(data);
};

export const createAdminLocation = async (payload: LocationFormPayload): Promise<AdminLocation> => {
    const { data } = await http.post<FractalResponseData>('/api/application/locations', payload);

    return rawDataToAdminLocation(data);
};

export const updateAdminLocation = async (id: number, payload: LocationFormPayload): Promise<AdminLocation> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/locations/${id}`, payload);

    return rawDataToAdminLocation(data);
};

export const deleteAdminLocation = async (id: number): Promise<void> => {
    await http.delete(`/api/application/locations/${id}`);
};
