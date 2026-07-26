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

export interface AdminServerSummary {
    id: number;
    uuid: string;
    identifier: string;
    name: string;
    nodeId: number;
    memory: number;
    disk: number;
    excludeFromResourceCalculation: boolean;
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
