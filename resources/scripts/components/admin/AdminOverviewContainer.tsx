import { WarningAlt } from '@carbon/icons-react';
import { AiBookIcon, CodeFolderIcon, DiscordIcon, HeartAddIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { getAdminOverviewStats } from '@/api/admin/overview';
import { AdminCard, AdminError, AdminLoading, AdminPage } from '@/components/admin/common';
import ChartBlock from '@/components/server/console/ChartBlock';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { bytesToString } from '@/lib/formatters';
import { hexToRgba } from '@/lib/helpers';

const HelpDropdown = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button
                type='button'
                className='flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/25 hover:active:translate-y-0.5 hover:active:scale-[0.98]'
            >
                <HugeiconsIcon size={16} icon={HelpCircleIcon} />
                Help
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='z-99999' sideOffset={8}>
            <DropdownMenuItem
                className='flex cursor-pointer items-center gap-2'
                onSelect={() => window.open('https://discord.gg/HmSeFTNas4', '_blank')}
            >
                <HugeiconsIcon size={16} icon={DiscordIcon} />
                Join the Discord
            </DropdownMenuItem>
            <DropdownMenuItem
                className='flex cursor-pointer items-center gap-2'
                onSelect={() => window.open('https://hydrodactyl.dev', '_blank')}
            >
                <HugeiconsIcon size={16} icon={AiBookIcon} />
                Checkout the Docs
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const ContributeDropdown = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button
                type='button'
                className='flex cursor-pointer items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/15 px-3 py-1.5 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/25 hover:active:translate-y-0.5 hover:active:scale-[0.98]'
            >
                <HugeiconsIcon size={16} icon={HeartAddIcon} />
                Contribute
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='z-99999' sideOffset={8}>
            <DropdownMenuItem
                className='flex cursor-pointer items-center gap-2'
                onSelect={() => window.open('https://ko-fi.com/naterfute', '_blank')}
            >
                <HugeiconsIcon size={16} icon={HeartAddIcon} />
                Support the Maintainer
            </DropdownMenuItem>
            <DropdownMenuItem
                className='flex cursor-pointer items-center gap-2'
                onSelect={() => window.open('https://bpfw.io/donate', '_blank')}
            >
                <HugeiconsIcon size={16} icon={HeartAddIcon} />
                Donate to Blueprint
            </DropdownMenuItem>
            <DropdownMenuItem
                className='flex cursor-pointer items-center gap-2'
                onSelect={() => window.open('https://github.com/BlueprintFramework/hydrodactyl', '_blank')}
            >
                <HugeiconsIcon size={16} icon={CodeFolderIcon} />
                Contribute or Share on Github
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const formatNumber = (value: number): string => value.toLocaleString();

const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
};

const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
    count === 1 ? singular : plural;

const offlineNodeMessage = (count: number): string =>
    `${formatNumber(count)} ${pluralize(count, 'node')} ${count === 1 ? 'is' : 'are'} offline!`;

const OverviewStat = ({
    label,
    value,
    children,
    to,
}: {
    label: string;
    value: string;
    children?: ReactNode;
    to?: string;
}) => {
    const content = (
        <AdminCard className='flex min-h-36 h-full flex-col items-center justify-center overflow-hidden text-center'>
            <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>{label}</span>
            <span className='mt-4 text-3xl font-extrabold tracking-[-0.04em] text-white'>{value}</span>
            {children && <div className='mt-3 flex flex-col items-center gap-1 text-xs font-semibold'>{children}</div>}
        </AdminCard>
    );

    return to ? (
        <Link to={to} className='block h-full transition hover:opacity-80'>
            {content}
        </Link>
    ) : (
        content
    );
};

const PanelGraphs = ({ data }: { data: Awaited<ReturnType<typeof getAdminOverviewStats>> }) => {
    const previousNetwork = useRef({ rx: -1, tx: -1 });
    const [networkRate, setNetworkRate] = useState({ rx: 0, tx: 0 });
    const cpu = useChartTickLabel('CPU', 100, '%', 2);
    const memory = useChart('RAM', {
        sets: 1,
        options: {
            scales: {
                y: {
                    suggestedMax: Math.ceil(data.metrics.memory.total / 1024 / 1024),
                    ticks: {
                        callback(value) {
                            return `${value}MiB`;
                        },
                    },
                },
            },
        },
    });
    const network = useChart('Network', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            const color = index === 0 ? '#facc15' : '#60a5fa';

            return {
                ...opts,
                label: index === 0 ? 'Network In' : 'Network Out',
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.09),
            };
        },
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: chart helpers intentionally mirror server StatGraphs usage.
    useEffect(() => {
        cpu.push(data.metrics.cpu);
        memory.push(Math.floor(data.metrics.memory.used / 1024 / 1024));

        const rx =
            previousNetwork.current.rx < 0 ? 0 : Math.max(0, data.metrics.network.rxBytes - previousNetwork.current.rx);
        const tx =
            previousNetwork.current.tx < 0 ? 0 : Math.max(0, data.metrics.network.txBytes - previousNetwork.current.tx);

        network.push([rx, tx]);
        setNetworkRate({ rx, tx });

        previousNetwork.current = {
            rx: data.metrics.network.rxBytes,
            tx: data.metrics.network.txBytes,
        };
    }, [data]);

    const usedMemoryMiB = Math.floor(data.metrics.memory.used / 1024 / 1024);
    const totalMemoryMiB = Math.ceil(data.metrics.memory.total / 1024 / 1024);

    const usedDiskBytes = data.metrics.disk.used;
    const totalDiskBytes = data.metrics.disk.total;
    const diskPercent = totalDiskBytes > 0 ? Math.round((usedDiskBytes / totalDiskBytes) * 100) : 0;

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                <ChartBlock
                    title='System CPU Usage'
                    className='min-h-48 min-w-0 sm:min-h-56'
                    legend={
                        <span className='text-xs font-semibold text-white/60'>
                            {data.metrics.cpu.toFixed(2)}% / 100%
                        </span>
                    }
                >
                    <div className='h-36 w-full sm:h-44'>
                        <Line aria-label='System CPU Usage' role='img' {...cpu.props} />
                    </div>
                </ChartBlock>
                <ChartBlock
                    title='System Memory Usage'
                    className='min-h-48 min-w-0 sm:min-h-56'
                    legend={
                        <span className='text-xs font-semibold text-white/60'>
                            {usedMemoryMiB}MiB / {totalMemoryMiB}MiB
                        </span>
                    }
                >
                    <div className='h-36 w-full sm:h-44'>
                        <Line aria-label='System Memory Usage' role='img' {...memory.props} />
                    </div>
                </ChartBlock>
                <ChartBlock
                    title='System Network Activity'
                    className='min-h-48 min-w-0 sm:min-h-56'
                    legend={
                        <div className='flex gap-3 text-xs font-semibold'>
                            <span className='text-yellow-400'>In {bytesToString(networkRate.rx)}/s</span>
                            <span className='text-blue-400'>Out {bytesToString(networkRate.tx)}/s</span>
                        </div>
                    }
                >
                    <div className='h-36 w-full sm:h-44'>
                        <Line aria-label='System Network Activity' role='img' {...network.props} />
                    </div>
                </ChartBlock>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <AdminCard className='flex flex-col gap-2'>
                    <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>System Disk</span>
                    <div className='flex items-baseline justify-between gap-2'>
                        <span className='text-sm font-bold text-white'>
                            {bytesToString(usedDiskBytes)}{' '}
                            <span className='font-semibold text-white/45'>/ {bytesToString(totalDiskBytes)}</span>
                        </span>
                        <span className='text-xs font-semibold text-white/60'>{diskPercent}%</span>
                    </div>
                    <div className='h-1.5 overflow-hidden rounded-full bg-white/10'>
                        <div
                            className='h-full rounded-full bg-brand transition-all'
                            style={{ width: `${Math.min(100, diskPercent)}%` }}
                        />
                    </div>
                </AdminCard>
                <AdminCard className='flex flex-col gap-2'>
                    <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>Hostname</span>
                    <span className='truncate text-sm font-bold text-white'>{data.hostname}</span>
                </AdminCard>
            </div>
        </div>
    );
};

const AdminOverviewContainer = () => {
    const username = useStoreState((state) => state.user.data?.username ?? 'Admin');
    const { data, error } = useSWR('admin:overview', getAdminOverviewStats, { refreshInterval: 5000 });

    return (
        <AdminPage
            title='Administrative Overview'
            description='A quick glance at your panel.'
            actions={
                <div className='flex items-center gap-2'>
                    <HelpDropdown />
                    <ContributeDropdown />
                </div>
            }
        >
            <AdminCard className='border-brand/30 bg-brand/10'>
                <div className='flex items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-2xl font-extrabold tracking-[-0.04em] text-white'>Hello, {username}!</h2>
                        <p className='mt-2 text-sm text-white/60'>
                            Here is the current overview for your Hydrodactyl panel.
                        </p>
                    </div>
                    <TooltipProvider>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <div className='shrink-0 cursor-pointer'>
                                    <AdminCard className='flex min-w-32 flex-col items-center justify-center bg-white/5 py-2'>
                                        <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>
                                            Panel Version
                                        </span>
                                        <span className='mt-1 text-xl font-extrabold tracking-[-0.04em] text-white'>
                                            {import.meta.env.VITE_HYDRODACTYL_VERSION}
                                        </span>
                                    </AdminCard>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' sideOffset={8}>
                                Commit: {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </AdminCard>

            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}

            {data && (
                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    <OverviewStat label='Total Nodes' value={formatNumber(data.totalNodes)} to='/admin/nodes'>
                        {data.offlineNodes > 0 && (
                            <span className='inline-flex items-center gap-1 text-red-400'>
                                <WarningAlt className='h-4 w-4' />
                                {offlineNodeMessage(data.offlineNodes)}
                            </span>
                        )}
                    </OverviewStat>
                    <OverviewStat label='Total Servers' value={formatNumber(data.totalServers)} to='/admin/servers'>
                        <span className='text-green-400'>
                            {formatNumber(data.onlineServers)} Online {pluralize(data.onlineServers, 'Server')}
                        </span>
                        <span className='text-red-400'>
                            {formatNumber(data.offlineServers)} Offline {pluralize(data.offlineServers, 'Server')}
                        </span>
                    </OverviewStat>
                    <OverviewStat label='Total Users' value={formatNumber(data.totalUsers)} to='/admin/users' />
                    <OverviewStat label='Uptime' value={formatUptime(data.uptime)} />
                </div>
            )}

            {data && <PanelGraphs data={data} />}
        </AdminPage>
    );
};

export default AdminOverviewContainer;
