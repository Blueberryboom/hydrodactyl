import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
    AdminDomain,
    AdminDomainPayload,
    AdminDomainProvider,
    AdminDomainSchemaField,
} from '@/api/admin/settings';
import { getAdminDomainProviderSchema, testAdminDomainConnection } from '@/api/admin/settings';
import { AdminCard, AdminError, AdminField, AdminSubmitRow, adminInputClass } from '@/components/admin/common';
import { Button } from '@/components/ui/button';

interface DomainFormProps {
    domain?: AdminDomain;
    providers: Record<string, AdminDomainProvider>;
    onSubmit: (payload: AdminDomainPayload) => Promise<void>;
    submitLabel: string;
}

const payloadFromForm = (form: HTMLFormElement, schema: Record<string, AdminDomainSchemaField>): AdminDomainPayload => {
    const formData = new FormData(form);
    const dnsConfig = Object.keys(schema).reduce<Record<string, string>>((config, key) => {
        config[key] = String(formData.get(`dns_config.${key}`) ?? '');

        return config;
    }, {});

    return {
        name: String(formData.get('name') ?? ''),
        dns_provider: String(formData.get('dns_provider') ?? ''),
        dns_config: dnsConfig,
        is_active: String(formData.get('is_active') ?? 'true') === 'true',
        is_default: String(formData.get('is_default') ?? 'false') === 'true',
    };
};

const DomainForm = ({ domain, providers, onSubmit, submitLabel }: DomainFormProps) => {
    const [provider, setProvider] = useState(domain?.dnsProvider ?? '');
    const [schema, setSchema] = useState<Record<string, AdminDomainSchemaField>>({});
    const [isSubmitting, setSubmitting] = useState(false);
    const [isTesting, setTesting] = useState(false);
    const [error, setError] = useState<unknown>();

    useEffect(() => {
        if (!provider) {
            setSchema({});
            return;
        }

        getAdminDomainProviderSchema(provider).then(setSchema).catch(setError);
    }, [provider]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(undefined);

        try {
            await onSubmit(payloadFromForm(event.currentTarget, schema));
        } catch (error) {
            setError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTest = async (form: HTMLFormElement) => {
        setTesting(true);
        setError(undefined);

        try {
            const message = await testAdminDomainConnection(payloadFromForm(form, schema));
            toast.success(message);
        } catch (error) {
            setError(error);
        } finally {
            setTesting(false);
        }
    };

    return (
        <form className='flex max-w-5xl flex-col gap-4' onSubmit={handleSubmit}>
            {error && <AdminError error={error} />}
            <AdminCard className='grid gap-4 md:grid-cols-2'>
                <AdminField
                    id='name'
                    label='Domain Name'
                    description='The domain used for generated subdomains, for example example.com.'
                >
                    <input
                        id='name'
                        name='name'
                        defaultValue={domain?.name ?? ''}
                        placeholder='example.com'
                        required
                        className={adminInputClass}
                    />
                </AdminField>
                <AdminField id='dns_provider' label='DNS Provider'>
                    <select
                        id='dns_provider'
                        name='dns_provider'
                        value={provider}
                        required
                        className={adminInputClass}
                        onChange={(event) => setProvider(event.currentTarget.value)}
                    >
                        <option value=''>Select a DNS provider...</option>
                        {Object.entries(providers).map(([value, provider]) => (
                            <option key={value} value={value}>
                                {provider.name}
                            </option>
                        ))}
                    </select>
                </AdminField>
            </AdminCard>
            {Object.keys(schema).length > 0 && (
                <AdminCard className='grid gap-4 md:grid-cols-2'>
                    {Object.entries(schema).map(([key, field]) => (
                        <AdminField key={key} id={`dns_config.${key}`} label={field.description ?? key}>
                            <input
                                id={`dns_config.${key}`}
                                name={`dns_config.${key}`}
                                type={field.sensitive ? 'password' : 'text'}
                                defaultValue={domain?.dnsConfig[key] ?? ''}
                                required={field.required}
                                className={adminInputClass}
                            />
                        </AdminField>
                    ))}
                </AdminCard>
            )}
            <AdminCard className='grid gap-4 md:grid-cols-2'>
                <AdminField id='is_active' label='Status'>
                    <select
                        id='is_active'
                        name='is_active'
                        defaultValue={String(domain?.isActive ?? true)}
                        className={adminInputClass}
                    >
                        <option value='true'>Active</option>
                        <option value='false'>Inactive</option>
                    </select>
                </AdminField>
                <AdminField id='is_default' label='Default Domain'>
                    <select
                        id='is_default'
                        name='is_default'
                        defaultValue={String(domain?.isDefault ?? false)}
                        className={adminInputClass}
                    >
                        <option value='false'>No</option>
                        <option value='true'>Yes</option>
                    </select>
                </AdminField>
            </AdminCard>
            <div className='flex flex-wrap gap-2'>
                <AdminSubmitRow
                    isSubmitting={isSubmitting}
                    submitLabel={submitLabel}
                    cancelTo='/admin/settings/domains'
                />
                <Button
                    type='button'
                    variant='secondary'
                    disabled={!provider || isTesting}
                    onClick={(event) => {
                        if (event.currentTarget.form) {
                            void handleTest(event.currentTarget.form);
                        }
                    }}
                >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
            </div>
        </form>
    );
};

export default DomainForm;
