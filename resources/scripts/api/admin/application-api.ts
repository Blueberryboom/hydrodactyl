import { rawDataToAdminApplicationApiKey } from '@/api/admin/transformers';
import type {
    AdminApiKeyPermissionOptions,
    AdminApplicationApiKey,
    AdminApplicationApiKeyPayload,
} from '@/api/admin/types';
import http, { type FractalResponseData, type FractalResponseList } from '@/api/http';

interface RawApiKeyPermissionsResponse {
    data: {
        resources: string[];
        permissions: {
            read: number;
            read_write: number;
            none: number;
        };
    };
}

export const getAdminApplicationApiKeys = async (): Promise<AdminApplicationApiKey[]> => {
    const { data } = await http.get<FractalResponseList>('/api/application/api-keys');

    return data.data.map(rawDataToAdminApplicationApiKey);
};

export const getAdminApiKeyPermissionOptions = async (): Promise<AdminApiKeyPermissionOptions> => {
    const { data } = await http.get<RawApiKeyPermissionsResponse>('/api/application/api-keys/permissions');

    return {
        resources: data.data.resources,
        read: data.data.permissions.read,
        readWrite: data.data.permissions.read_write,
        none: data.data.permissions.none,
    };
};

export const createAdminApplicationApiKey = async (
    payload: AdminApplicationApiKeyPayload,
): Promise<AdminApplicationApiKey> => {
    const { data } = await http.post<FractalResponseData>('/api/application/api-keys', payload);

    return rawDataToAdminApplicationApiKey(data);
};

export const deleteAdminApplicationApiKey = async (identifier: string): Promise<void> => {
    await http.delete(`/api/application/api-keys/${identifier}`);
};
