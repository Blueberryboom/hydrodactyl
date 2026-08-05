import { createAdminApplicationApiKey, getAdminApplicationApiKeys } from '@/api/admin/application-api';
import { rawDataToAdminAllocation, rawDataToAdminNode } from '@/api/admin/transformers';
import type {
    AdminAllocation,
    AdminNode,
    AdminPaginatedResult,
    AllocationFormPayload,
    NodeFormPayload,
} from '@/api/admin/types';
import http, {
    type FractalPaginatedResponse,
    type FractalResponseData,
    getPaginationSet,
    withQueryBuilderParams,
} from '@/api/http';

interface GetNodesOptions {
    page?: number;
    name?: string;
}

export interface AdminNodeSystemInformation {
    version: string;
    system: {
        type: string;
        arch: string;
        release: string;
        cpus: number;
    };
}

const NODE_INCLUDES = 'location,servers.user,servers.nest,servers.egg';

export const getAdminNodes = async ({ page, name }: GetNodesOptions = {}): Promise<AdminPaginatedResult<AdminNode>> => {
    const { data } = await http.get<FractalPaginatedResponse>('/api/application/nodes', {
        params: {
            include: 'location,servers',
            ...withQueryBuilderParams({
                page,
                filters: { name },
                sorts: { id: 'asc' },
            }),
        },
    });

    return {
        items: data.data.map(rawDataToAdminNode),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const getAdminNode = async (id: string): Promise<AdminNode> => {
    const { data } = await http.get<FractalResponseData>(`/api/application/nodes/${id}`, {
        params: { include: NODE_INCLUDES },
    });

    return rawDataToAdminNode(data);
};

export const createAdminNode = async (payload: NodeFormPayload): Promise<AdminNode> => {
    const { data } = await http.post<FractalResponseData>('/api/application/nodes', payload);

    return rawDataToAdminNode(data);
};

export const updateAdminNode = async (
    id: number,
    payload: NodeFormPayload,
    resetSecret = false,
): Promise<AdminNode> => {
    const { data } = await http.patch<FractalResponseData>(`/api/application/nodes/${id}`, {
        ...payload,
        reset_secret: resetSecret,
    });

    return rawDataToAdminNode(data);
};

export const deleteAdminNode = async (id: number): Promise<void> => {
    await http.delete(`/api/application/nodes/${id}`);
};

export const getAdminNodeConfiguration = async (id: number): Promise<Record<string, unknown>> => {
    const { data } = await http.get<Record<string, unknown>>(`/api/application/nodes/${id}/configuration`);

    return data;
};

export const getAdminNodeSystemInformation = async (id: number): Promise<AdminNodeSystemInformation> => {
    const { data } = await http.get<AdminNodeSystemInformation>(`/admin/nodes/view/${id}/system-information`);

    return data;
};

interface GetNodeAllocationsOptions {
    page?: number;
}

export const getAdminNodeAllocations = async (
    nodeId: number,
    { page }: GetNodeAllocationsOptions = {},
): Promise<AdminPaginatedResult<AdminAllocation>> => {
    const { data } = await http.get<FractalPaginatedResponse>(`/api/application/nodes/${nodeId}/allocations`, {
        params: {
            include: 'server',
            ...withQueryBuilderParams({ page, sorts: { id: 'asc' } }),
        },
    });

    return {
        items: data.data.map(rawDataToAdminAllocation),
        pagination: getPaginationSet(data.meta.pagination),
    };
};

export const createAdminNodeAllocations = async (nodeId: number, payload: AllocationFormPayload): Promise<void> => {
    await http.post(`/api/application/nodes/${nodeId}/allocations`, payload);
};

export const updateAdminNodeAllocation = async (
    nodeId: number,
    allocationId: number,
    alias: string | null,
): Promise<void> => {
    await http.patch(`/api/application/nodes/${nodeId}/allocations/${allocationId}`, { alias });
};

export const deleteAdminNodeAllocation = async (nodeId: number, allocationId: number): Promise<void> => {
    await http.delete(`/api/application/nodes/${nodeId}/allocations/${allocationId}`);
};

const AUTO_DEPLOY_KEY_MEMO = 'Automatically generated node deployment key.';

export const getAdminNodeAutoDeployToken = async (): Promise<string> => {
    const existing = await getAdminApplicationApiKeys();
    const key = existing.find((candidate) => candidate.permissions.r_nodes === 1);

    if (key) {
        return `${key.identifier}${key.token}`;
    }

    const created = await createAdminApplicationApiKey({
        memo: AUTO_DEPLOY_KEY_MEMO,
        r_nodes: 1,
    });

    return `${created.identifier}${created.token}`;
};

export const buildAdminNodeDeployCommand = (node: AdminNode, token: string): string => {
    const daemon = node.daemonType === 'elytra' ? 'elytra' : 'wings';
    const path = node.daemonType === 'elytra' ? '/etc/elytra' : '/etc/pterodactyl';
    const allowInsecure = window.location.protocol === 'http:' ? ' --allow-insecure' : '';

    return `cd ${path} && sudo ${daemon} configure --panel-url ${window.location.origin} --token ${token} --node ${node.id}${allowInsecure}`;
};
