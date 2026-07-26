import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { AdminPaginatedResult } from '@/api/admin/types';
import { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminPageProps {
    title: string;
    description: string;
    children: ReactNode;
    actions?: ReactNode;
}

export const AdminPage = ({ title, description, children, actions }: AdminPageProps) => (
    <PageContentBlock title={title}>
        <div className='flex min-h-full flex-col gap-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex flex-col gap-2'>
                    <p className='text-sm font-medium uppercase tracking-[0.18em] text-brand'>Admin</p>
                    <h1 className='text-3xl font-extrabold leading-none tracking-[-0.08rem]'>{title}</h1>
                    <p className='max-w-2xl text-sm text-white/60'>{description}</p>
                </div>
                {actions && <div className='flex shrink-0 flex-wrap gap-2'>{actions}</div>}
            </div>
            {children}
        </div>
    </PageContentBlock>
);

export const AdminCard = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn('rounded-2xl border border-mocha-400 bg-bg-lowered p-5', className)}>{children}</div>
);

export const AdminTable = ({ children }: { children: ReactNode }) => (
    <div className='overflow-x-auto rounded-2xl border border-mocha-400'>
        <table className='w-full min-w-[760px] text-left text-sm'>{children}</table>
    </div>
);

export const AdminTableHead = ({ children }: { children: ReactNode }) => (
    <thead className='border-b border-mocha-400 bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-white/45'>
        {children}
    </thead>
);

export const AdminTableBody = ({ children }: { children: ReactNode }) => (
    <tbody className='divide-y divide-mocha-400 text-white/75'>{children}</tbody>
);

export const AdminField = ({
    id,
    label,
    description,
    children,
}: {
    id: string;
    label: string;
    description?: string;
    children: ReactNode;
}) => (
    <label className='flex flex-col gap-2' htmlFor={id}>
        <span className='text-sm font-medium text-white/70'>{label}</span>
        {children}
        {description && <span className='text-xs text-white/45'>{description}</span>}
    </label>
);

export const adminInputClass =
    'rounded-xl border border-mocha-400 bg-white/[0.06] px-3 py-2 text-sm text-white outline-hidden transition focus:border-brand/70 disabled:cursor-not-allowed disabled:opacity-60';

export const AdminError = ({ error }: { error: unknown }) => (
    <AdminCard className='border-red-500/40 bg-red-500/10 text-sm text-red-100'>
        {httpErrorToHuman(error as { response?: { data?: unknown }; message?: string })}
    </AdminCard>
);

export const AdminLoading = () => (
    <div className='flex min-h-48 items-center justify-center opacity-70'>
        <Spinner centered />
    </div>
);

export const AdminEmpty = ({ children }: { children: ReactNode }) => (
    <AdminCard className='text-sm text-white/55'>{children}</AdminCard>
);

export const AdminSubmitRow = ({
    isSubmitting,
    submitLabel,
    cancelTo,
}: {
    isSubmitting: boolean;
    submitLabel: string;
    cancelTo: string;
}) => (
    <div className='flex flex-wrap gap-2'>
        <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        <Button asChild variant='secondary'>
            <Link to={cancelTo}>Cancel</Link>
        </Button>
    </div>
);

export const AdminDeleteButton = ({
    label,
    confirmation,
    onDelete,
}: {
    label: string;
    confirmation: string;
    onDelete: () => Promise<void>;
}) => {
    const [open, setOpen] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setCountdown(3);
    }, [open]);

    useEffect(() => {
        if (!open || countdown <= 0) {
            return;
        }

        const timeout = window.setTimeout(() => setCountdown((value) => value - 1), 1000);

        return () => window.clearTimeout(timeout);
    }, [countdown, open]);

    const handleConfirmed = async () => {
        setLoading(true);

        try {
            await onDelete();
            setOpen(false);
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setLoading(false);
        }
    };

    const confirmLabel = countdown > 0 ? `${label} (${countdown}s)` : label;

    return (
        <>
            <Button type='button' variant='destructive' onClick={() => setOpen(true)}>
                {label}
            </Button>
            <Dialog.Confirm
                open={open}
                onClose={() => setOpen(false)}
                title={label}
                confirm={confirmLabel}
                loading={loading}
                onConfirmed={handleConfirmed}
                disabled={countdown > 0}
            >
                {confirmation}
            </Dialog.Confirm>
        </>
    );
};

export const AdminSearchForm = ({
    value,
    placeholder,
    onSubmit,
    createTo,
    createLabel,
}: {
    value: string;
    placeholder: string;
    onSubmit: (value: string) => void;
    createTo?: string;
    createLabel?: string;
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSubmit(event.currentTarget.value);
    };

    return (
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
            <input
                name='query'
                value={value}
                className={adminInputClass}
                placeholder={placeholder}
                onChange={handleChange}
            />
            {createTo && createLabel && (
                <Button asChild>
                    <Link to={createTo}>{createLabel}</Link>
                </Button>
            )}
        </div>
    );
};

export const AdminPagination = <T,>({
    data,
    onPageSelect,
    children,
}: {
    data: AdminPaginatedResult<T>;
    onPageSelect: (page: number) => void;
    children: (items: T[]) => ReactNode;
}) => (
    <Pagination data={data} onPageSelect={onPageSelect}>
        {({ items }) => children(items)}
    </Pagination>
);
