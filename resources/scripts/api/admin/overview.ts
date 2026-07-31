import http from '@/api/http';

export interface AdminOverviewStats {
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    totalUsers: number;
    uptime: number;
    hostname: string;
    metrics: {
        cpu: number;
        memory: {
            total: number;
            used: number;
        };
        network: {
            rxBytes: number;
            txBytes: number;
        };
        disk: {
            total: number;
            used: number;
        };
    };
}

interface SystemStatusResponse {
    system: {
        hostname: string;
    };
    metrics: {
        uptime: number;
        cpu: number;
        memory: {
            total: number;
            used: number;
        };
        network: {
            rx_bytes: number;
            tx_bytes: number;
        };
        disk: {
            total: number;
            free: number;
            used: number;
        };
    };
    overview: {
        total_nodes: number;
        online_nodes: number;
        offline_nodes: number;
        total_servers: number;
        online_servers: number;
        offline_servers: number;
        total_users: number;
    };
}

export const getAdminOverviewStats = async (): Promise<AdminOverviewStats> => {
    const { data } = await http.get<SystemStatusResponse>('/api/application/panel/status');

    return {
        totalNodes: data.overview.total_nodes,
        onlineNodes: data.overview.online_nodes,
        offlineNodes: data.overview.offline_nodes,
        totalServers: data.overview.total_servers,
        onlineServers: data.overview.online_servers,
        offlineServers: data.overview.offline_servers,
        totalUsers: data.overview.total_users,
        uptime: data.metrics.uptime,
        hostname: data.system.hostname,
        metrics: {
            cpu: data.metrics.cpu,
            memory: {
                total: data.metrics.memory.total,
                used: data.metrics.memory.used,
            },
            network: {
                rxBytes: data.metrics.network.rx_bytes,
                txBytes: data.metrics.network.tx_bytes,
            },
            disk: {
                total: data.metrics.disk.total,
                used: data.metrics.disk.used,
            },
        },
    };
};
