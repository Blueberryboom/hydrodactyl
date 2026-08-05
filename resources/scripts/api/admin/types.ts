import type { PaginationDataSet } from '@/api/http';

export interface AdminUser {
    id: number;
    externalId: string | null;
    uuid: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    servers: AdminServerSummary[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminLocation {
    id: number;
    short: string;
    long: string;
    nodeCount: number;
    onlineNodeCount: number;
    serverCount: number;
    allocatedMemory: number;
    allocatedDisk: number;
    memoryCapacity: number;
    diskCapacity: number;
    nodes: AdminNodeSummary[];
    servers: AdminServerSummary[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminNodeSummary {
    id: number;
    uuid: string;
    name: string;
    fqdn: string;
    scheme: string;
    memory: number;
    disk: number;
    allocatedMemory: number;
    allocatedDisk: number;
    memoryCapacity: number;
    diskCapacity: number;
    maintenanceMode: boolean;
}

export interface AdminNodeLocationRef {
    id: number;
    short: string;
    long: string;
}

export interface AdminNode {
    id: number;
    uuid: string;
    public: boolean;
    trustAlias: boolean;
    name: string;
    description: string | null;
    locationId: number;
    fqdn: string;
    internalFqdn: string | null;
    scheme: string;
    behindProxy: boolean;
    maintenanceMode: boolean;
    memory: number;
    memoryOverallocate: number;
    disk: number;
    diskOverallocate: number;
    uploadSize: number;
    daemonListen: number;
    daemonSftp: number;
    daemonBase: string;
    daemonType: string;
    backupDisk: string;
    bucket: number | null;
    allocatedMemory: number;
    allocatedDisk: number;
    memoryCapacity: number;
    diskCapacity: number;
    location: AdminNodeLocationRef | null;
    allocations: AdminAllocation[];
    servers: AdminServerSummary[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminAllocation {
    id: number;
    ip: string;
    alias: string | null;
    port: number;
    notes: string | null;
    assigned: boolean;
    server: AdminServerSummary | null;
}

export interface NodeFormPayload {
    public: boolean;
    name: string;
    description?: string | null;
    location_id: number;
    fqdn: string;
    internal_fqdn: string | null;
    scheme: string;
    behind_proxy: boolean;
    maintenance_mode: boolean;
    trust_alias: boolean;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    daemon_listen: number;
    daemon_sftp: number;
    daemon_base: string;
    daemon_type: string;
    backup_disk: string;
    bucket: number | null;
}

export interface AllocationFormPayload {
    ip: string;
    alias?: string | null;
    ports: string[];
}

export interface AdminServerSummary {
    id: number;
    uuid: string;
    identifier: string;
    name: string;
    nodeId: number;
    memory: number;
    disk: number;
    excludeFromResourceCalculation: boolean;
    ownerId: number;
    ownerUsername: string | null;
    ownerEmail: string | null;
    nestName: string | null;
    eggName: string | null;
}

export interface AdminEggSummary {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
}

export interface AdminEgg extends AdminEggSummary {
    nestId: number;
    author: string;
    dockerImages: Record<string, string>;
    startup: string;
    forceOutgoingIp: boolean;
    features: string[];
    fileDenylist: string[];
    configFiles: unknown;
    configStartup: unknown;
    configLogs: unknown;
    configStop: string | null;
    configExtends: number | null;
    scriptPrivileged: boolean;
    scriptInstall: string | null;
    scriptEntry: string;
    scriptContainer: string;
    scriptExtends: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminNest {
    id: number;
    uuid: string;
    author: string;
    name: string;
    description: string | null;
    eggCount: number;
    createdAt: string;
    updatedAt: string;
    eggs: AdminEggSummary[];
}

export interface AdminS3Bucket {
    id: number;
    name: string;
    description: string | null;
    accessKey: string;
    secretKey: string;
    endpoint: string | null;
    region: string;
    bucketName: string;
    usePathStyleEndpoint: boolean;
    enabled: boolean;
    serverCount: number;
    servers: AdminServerSummary[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminPaginatedResult<T> {
    items: T[];
    pagination: PaginationDataSet;
}

export interface UserFormPayload {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    language: string;
    root_admin: boolean;
    password?: string;
}

export interface LocationFormPayload {
    short: string;
    long: string;
}

export interface NestFormPayload {
    name: string;
    description?: string | null;
}

export interface EggFormPayload {
    name: string;
    description?: string | null;
    docker_images: Record<string, string>;
    startup: string;
    force_outgoing_ip: boolean;
    file_denylist: string[];
    config_stop: string;
    config_startup: string;
    config_logs: string;
    config_files: string;
    config_from?: number | null;
    copy_script_from?: number | null;
    script_is_privileged: boolean;
    script_install?: string | null;
    script_entry: string;
    script_container: string;
    features: string[];
}

export interface S3BucketFormPayload {
    name: string;
    description?: string | null;
    access_key: string;
    secret_key: string;
    endpoint?: string | null;
    region?: string | null;
    bucket_name: string;
    use_path_style_endpoint: boolean;
    enabled: boolean;
}

export interface AdminDatabaseHost {
    id: number;
    name: string;
    host: string;
    port: number;
    username: string;
    nodeId: number | null;
    nodeName: string | null;
    databaseCount: number;
    databases: AdminDatabaseHostDatabase[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminDatabaseHostDatabase {
    id: number;
    serverId: number;
    hostId: number;
    database: string;
    username: string;
    remote: string;
    maxConnections: number | null;
    serverName: string | null;
    serverIdentifier: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminDatabaseHostNodeOption {
    id: number;
    name: string;
}

export interface AdminDatabaseHostLocation {
    id: number;
    short: string;
    long: string;
    nodes: AdminDatabaseHostNodeOption[];
}

export interface DatabaseHostFormPayload {
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    node_id: number | null;
}

export interface TestDatabaseHostConnectionResponse {
    success: boolean;
    message: string;
    version?: string;
    has_grant_option?: boolean;
}

export interface AdminApplicationApiKey {
    id: number;
    identifier: string;
    token: string;
    memo: string;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
    permissions: Record<string, number>;
}

export interface AdminApplicationApiKeyPayload {
    memo: string;
    [key: string]: string | number;
}

export interface AdminApiKeyPermissionOptions {
    resources: string[];
    read: number;
    readWrite: number;
    none: number;
}
