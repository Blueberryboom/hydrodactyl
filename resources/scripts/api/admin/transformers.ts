import type {
    AdminDatabaseHost,
    AdminDatabaseHostDatabase,
    AdminEgg,
    AdminEggSummary,
    AdminLocation,
    AdminNest,
    AdminNodeSummary,
    AdminS3Bucket,
    AdminServerSummary,
    AdminUser,
} from '@/api/admin/types';
import type { FractalResponseData, FractalResponseList } from '@/api/http';

const attr = (data: FractalResponseData, key: string): unknown => data.attributes[key];

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asNullableString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const asNumber = (value: unknown): number => (typeof value === 'number' ? value : 0);
const asBoolean = (value: unknown): boolean => value === true;
const asNullableNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);
const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
const asRecord = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const asStringRecord = (value: unknown): Record<string, string> =>
    Object.entries(asRecord(value)).reduce<Record<string, string>>((record, [key, entry]) => {
        if (typeof entry === 'string') {
            record[key] = entry;
        }

        return record;
    }, {});

const relationshipList = (data: FractalResponseData, key: string): FractalResponseData[] => {
    const relationship = data.attributes.relationships?.[key];

    if (relationship && relationship.object === 'list') {
        return (relationship as FractalResponseList).data;
    }

    return [];
};

export const rawDataToAdminUser = (data: FractalResponseData): AdminUser => ({
    id: asNumber(attr(data, 'id')),
    externalId: asNullableString(attr(data, 'external_id')),
    uuid: asString(attr(data, 'uuid')),
    username: asString(attr(data, 'username')),
    email: asString(attr(data, 'email')),
    firstName: asString(attr(data, 'first_name')),
    lastName: asString(attr(data, 'last_name')),
    language: asString(attr(data, 'language')),
    rootAdmin: asBoolean(attr(data, 'root_admin')),
    useTotp: asBoolean(attr(data, '2fa')),
    servers: relationshipList(data, 'servers').map(rawDataToAdminServerSummary),
    createdAt: asString(attr(data, 'created_at')),
    updatedAt: asString(attr(data, 'updated_at')),
});

export const rawDataToAdminNodeSummary = (data: FractalResponseData): AdminNodeSummary => {
    const allocatedResources = asRecord(attr(data, 'allocated_resources'));
    const resourceCapacity = asRecord(attr(data, 'resource_capacity'));

    return {
        id: asNumber(attr(data, 'id')),
        uuid: asString(attr(data, 'uuid')),
        name: asString(attr(data, 'name')),
        fqdn: asString(attr(data, 'fqdn')),
        scheme: asString(attr(data, 'scheme')),
        memory: asNumber(attr(data, 'memory')),
        disk: asNumber(attr(data, 'disk')),
        allocatedMemory: asNumber(allocatedResources.memory),
        allocatedDisk: asNumber(allocatedResources.disk),
        memoryCapacity: asNumber(resourceCapacity.memory),
        diskCapacity: asNumber(resourceCapacity.disk),
        maintenanceMode: asBoolean(attr(data, 'maintenance_mode')),
    };
};

export const rawDataToAdminServerSummary = (data: FractalResponseData): AdminServerSummary => {
    const limits = asRecord(attr(data, 'limits'));

    return {
        id: asNumber(attr(data, 'id')),
        uuid: asString(attr(data, 'uuid')),
        identifier: asString(attr(data, 'identifier')),
        name: asString(attr(data, 'name')),
        nodeId: asNumber(attr(data, 'node')),
        memory: asNumber(limits.memory),
        disk: asNumber(limits.disk),
        excludeFromResourceCalculation: asBoolean(limits.exclude_from_resource_calculation),
    };
};

export const rawDataToAdminLocation = (data: FractalResponseData): AdminLocation => {
    const allocatedResources = asRecord(attr(data, 'allocated_resources'));
    const resourceCapacity = asRecord(attr(data, 'resource_capacity'));
    const nodes = relationshipList(data, 'nodes').map(rawDataToAdminNodeSummary);
    const servers = relationshipList(data, 'servers').map(rawDataToAdminServerSummary);

    return {
        id: asNumber(attr(data, 'id')),
        short: asString(attr(data, 'short')),
        long: asString(attr(data, 'long')),
        nodeCount: asNumber(attr(data, 'nodes_count')) || nodes.length,
        onlineNodeCount: asNumber(attr(data, 'nodes_online_count')),
        serverCount: asNumber(attr(data, 'servers_count')) || servers.length,
        allocatedMemory: asNumber(allocatedResources.memory),
        allocatedDisk: asNumber(allocatedResources.disk),
        memoryCapacity: asNumber(resourceCapacity.memory),
        diskCapacity: asNumber(resourceCapacity.disk),
        nodes,
        servers,
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
    };
};

export const rawDataToAdminEggSummary = (data: FractalResponseData): AdminEggSummary => ({
    id: asNumber(attr(data, 'id')),
    uuid: asString(attr(data, 'uuid')),
    name: asString(attr(data, 'name')),
    description: asNullableString(attr(data, 'description')),
});

export const rawDataToAdminEgg = (data: FractalResponseData): AdminEgg => {
    const config = asRecord(attr(data, 'config'));
    const script = asRecord(attr(data, 'script'));

    return {
        ...rawDataToAdminEggSummary(data),
        nestId: asNumber(attr(data, 'nest')),
        author: asString(attr(data, 'author')),
        dockerImages: asStringRecord(attr(data, 'docker_images')),
        startup: asString(attr(data, 'startup')),
        forceOutgoingIp: asBoolean(attr(data, 'force_outgoing_ip')),
        features: asStringArray(attr(data, 'features')),
        fileDenylist: asStringArray(config.file_denylist),
        configFiles: config.files,
        configStartup: config.startup,
        configLogs: config.logs,
        configStop: asNullableString(config.stop),
        configExtends: asNullableNumber(config.extends),
        scriptPrivileged: asBoolean(script.privileged),
        scriptInstall: asNullableString(script.install),
        scriptEntry: asString(script.entry),
        scriptContainer: asString(script.container),
        scriptExtends: asNullableNumber(script.extends),
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
    };
};

export const rawDataToAdminNest = (data: FractalResponseData): AdminNest => {
    const eggs = relationshipList(data, 'eggs').map(rawDataToAdminEggSummary);

    return {
        id: asNumber(attr(data, 'id')),
        uuid: asString(attr(data, 'uuid')),
        author: asString(attr(data, 'author')),
        name: asString(attr(data, 'name')),
        description: asNullableString(attr(data, 'description')),
        eggCount: asNumber(attr(data, 'eggs_count')) || eggs.length,
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
        eggs,
    };
};

export const rawDataToAdminS3Bucket = (data: FractalResponseData): AdminS3Bucket => {
    const servers = relationshipList(data, 'servers').map(rawDataToAdminServerSummary);

    return {
        id: asNumber(attr(data, 'id')),
        name: asString(attr(data, 'name')),
        description: asNullableString(attr(data, 'description')),
        accessKey: asString(attr(data, 'access_key')),
        secretKey: asString(attr(data, 'secret_key')),
        endpoint: asNullableString(attr(data, 'endpoint')),
        region: asString(attr(data, 'region')) || 'us-east-1',
        bucketName: asString(attr(data, 'bucket_name')),
        usePathStyleEndpoint: asBoolean(attr(data, 'use_path_style_endpoint')),
        enabled: asBoolean(attr(data, 'enabled')),
        serverCount: asNumber(attr(data, 'servers_count')) || servers.length,
        servers,
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
    };
};

export const rawDataToAdminDatabaseHostDatabase = (data: FractalResponseData): AdminDatabaseHostDatabase => {
    const serverDetails = data.attributes.relationships?.server_details;

    return {
        id: asNumber(attr(data, 'id')),
        serverId: asNumber(attr(data, 'server')),
        hostId: asNumber(attr(data, 'host')),
        database: asString(attr(data, 'database')),
        username: asString(attr(data, 'username')),
        remote: asString(attr(data, 'remote')),
        maxConnections: asNullableNumber(attr(data, 'max_connections')),
        serverName: serverDetails ? asString(serverDetails.attributes.name) : null,
        serverIdentifier: serverDetails ? asString(serverDetails.attributes.identifier) : null,
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
    };
};

export const rawDataToAdminDatabaseHost = (data: FractalResponseData): AdminDatabaseHost => {
    const nodeDetails = data.attributes.relationships?.node_details;
    const databases = relationshipList(data, 'databases').map(rawDataToAdminDatabaseHostDatabase);

    return {
        id: asNumber(attr(data, 'id')),
        name: asString(attr(data, 'name')),
        host: asString(attr(data, 'host')),
        port: asNumber(attr(data, 'port')),
        username: asString(attr(data, 'username')),
        nodeId: asNullableNumber(attr(data, 'node')),
        nodeName: nodeDetails ? asString(nodeDetails.attributes.name) : null,
        databaseCount: asNumber(attr(data, 'databases_count')) || databases.length,
        databases,
        createdAt: asString(attr(data, 'created_at')),
        updatedAt: asString(attr(data, 'updated_at')),
    };
};
