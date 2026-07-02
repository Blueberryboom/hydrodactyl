interface BackupStorageInfo {
    used_mb: number;
    legacy_usage_mb: number;
    repository_usage_mb: number;
    rustic_backup_sum_mb: number;
    overhead_mb: number;
    overhead_percent: number;
    needs_pruning: boolean;
    limit_mb: number | null;
    has_limit: boolean;
    usage_percentage: number | null;
    available_mb: number | null;
    is_over_limit: boolean;
}

interface BackupStatsProps {
    backupCount: number;
    backupLimit: number | null;
    storage?: BackupStorageInfo;
    backupStorageLimit?: number | null;
}

const formatStorage = (mb: number | undefined | null): string => {
    if (mb === null || mb === undefined) {
        return '0MB';
    }
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
};

const StorageBreakdown = ({ storage }: { storage: BackupStorageInfo }) => {
    const hasBothUsages = storage.repository_usage_mb > 0 && storage.legacy_usage_mb > 0;

    if (!hasBothUsages) return null;

    return (
        <p className='text-xs text-zinc-400'>
            {storage.repository_usage_mb > 0 ? `${formatStorage(storage.repository_usage_mb)} deduplicated` : ''}
            {hasBothUsages && ' + '}
            {storage.legacy_usage_mb > 0 ? `${formatStorage(storage.legacy_usage_mb)} legacy` : ''}
        </p>
    );
};

const StorageTooltip = ({
    storage,
    backupStorageLimit,
}: {
    storage: BackupStorageInfo;
    backupStorageLimit: number | null;
}) => {
    const used = storage.used_mb?.toFixed(2) || 0;
    const repo = storage.repository_usage_mb?.toFixed(2) || 0;
    const legacy = storage.legacy_usage_mb?.toFixed(2) || 0;
    const available = storage.available_mb?.toFixed(2) || 0;

    if (backupStorageLimit === null) {
        return `${used}MB total (Repository: ${repo}MB, Legacy: ${legacy}MB)`;
    }
    return `${used}MB used of ${backupStorageLimit}MB (Repository: ${repo}MB, Legacy: ${legacy}MB, ${available}MB Available)`;
};

const BackupStats = ({ backupCount, backupLimit, storage, backupStorageLimit = null }: BackupStatsProps) => {
    return (
        <div>
            {backupLimit === null && <p className='text-sm text-zinc-300'>{backupCount} backups</p>}
            {backupLimit !== null && backupLimit > 0 && (
                <p className='text-sm text-zinc-300'>
                    {backupCount} of {backupLimit} backups
                </p>
            )}
            {backupLimit === 0 && <p className='text-sm text-red-400'>Backups disabled</p>}

            {storage && (
                <div className='flex flex-col gap-0.5'>
                    <p
                        className='text-sm text-zinc-300 cursor-help'
                        title={StorageTooltip({ storage, backupStorageLimit })}
                    >
                        <span className='font-medium'>{formatStorage(storage.used_mb)}</span>{' '}
                        {backupStorageLimit === null ? (
                            'storage used'
                        ) : (
                            <span className='font-medium'>of {formatStorage(backupStorageLimit)} used</span>
                        )}
                    </p>
                    <StorageBreakdown storage={storage} />
                </div>
            )}
        </div>
    );
};

export default BackupStats;
