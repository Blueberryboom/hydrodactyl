import { WarningAlt } from '@carbon/icons-react';
import { AiBookIcon, CodeFolderIcon, DiscordIcon, HeartAddIcon, HelpCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
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

const OverviewStat = ({ label, value, children }: { label: string; value: string; children?: ReactNode }) => (
    <AdminCard className='flex min-h-36 flex-col items-center justify-center overflow-hidden text-center'>
        <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>{label}</span>
        <span className='mt-4 text-3xl font-extrabold tracking-[-0.04em] text-white'>{value}</span>
        {children && <div className='mt-3 flex flex-col items-center gap-1 text-xs font-semibold'>{children}</div>}
    </AdminCard>
);

const PanelGraphs = ({ data }: { data: Awaited<ReturnType<typeof getAdminOverviewStats>> }) => {
    const previousNetwork = useRef({ rx: -1, tx: -1 });
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
        network.push([
            previousNetwork.current.rx < 0 ? 0 : Math.max(0, data.metrics.network.rxBytes - previousNetwork.current.rx),
            previousNetwork.current.tx < 0 ? 0 : Math.max(0, data.metrics.network.txBytes - previousNetwork.current.tx),
        ]);

        previousNetwork.current = {
            rx: data.metrics.network.rxBytes,
            tx: data.metrics.network.txBytes,
        };
    }, [data]);

    return (
        <div className='grid gap-4 xl:grid-cols-3'>
            <ChartBlock title='Panel CPU Usage' className='min-h-56'>
                <div className='h-44'>
                    <Line aria-label='Panel CPU Usage' role='img' {...cpu.props} />
                </div>
            </ChartBlock>
            <ChartBlock title='Panel Memory/RAM Usage' className='min-h-56'>
                <div className='h-44'>
                    <Line aria-label='Panel Memory/RAM Usage' role='img' {...memory.props} />
                </div>
            </ChartBlock>
            <ChartBlock
                title='Panel Network Activity'
                className='min-h-56'
                legend={
                    <div className='flex gap-3 text-xs font-semibold'>
                        <span className='text-yellow-400'>In</span>
                        <span className='text-blue-400'>Out</span>
                    </div>
                }
            >
                <div className='h-44'>
                    <Line aria-label='Panel Network Activity' role='img' {...network.props} />
                </div>
            </ChartBlock>
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
                    <AdminCard className='flex min-w-32 shrink-0 flex-col items-center justify-center bg-white/5 py-2'>
                        <span className='text-xs font-semibold uppercase tracking-[0.16em] text-white/45'>
                            Panel Version
                        </span>
                        <span className='mt-1 text-xl font-extrabold tracking-[-0.04em] text-white'>
                            {import.meta.env.VITE_HYDRODACTYL_VERSION}
                        </span>
                    </AdminCard>
                </div>
            </AdminCard>

            {error ? <AdminError error={error} /> : !data ? <AdminLoading /> : null}

            {data && (
                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    <OverviewStat label='Total Nodes' value={formatNumber(data.totalNodes)}>
                        {data.offlineNodes > 0 && (
                            <span className='inline-flex items-center gap-1 text-red-400'>
                                <WarningAlt className='h-4 w-4' />
                                {offlineNodeMessage(data.offlineNodes)}
                            </span>
                        )}
                    </OverviewStat>
                    <OverviewStat label='Total Servers' value={formatNumber(data.totalServers)}>
                        <span className='text-green-400'>
                            {formatNumber(data.onlineServers)} Online {pluralize(data.onlineServers, 'Server')}
                        </span>
                        <span className='text-red-400'>
                            {formatNumber(data.offlineServers)} Offline {pluralize(data.offlineServers, 'Server')}
                        </span>
                    </OverviewStat>
                    <OverviewStat label='Total Users' value={formatNumber(data.totalUsers)} />
                    <OverviewStat label='Uptime' value={formatUptime(data.uptime)} />
                </div>
            )}

            {data && <PanelGraphs data={data} />}
        </AdminPage>
    );
};

export default AdminOverviewContainer;
