import { useStoreState } from 'easy-peasy';
import { Link, Route, Routes } from 'react-router-dom';

import AdminOverviewContainer from '@/components/admin/AdminOverviewContainer';
import ApplicationApiCreateContainer from '@/components/admin/applicationApi/ApplicationApiCreateContainer';
import ApplicationApiListContainer from '@/components/admin/applicationApi/ApplicationApiListContainer';
import DatabaseHostListContainer from '@/components/admin/databases/DatabaseHostListContainer';
import DatabaseHostViewContainer from '@/components/admin/databases/DatabaseHostViewContainer';
import LocationCreateContainer from '@/components/admin/locations/LocationCreateContainer';
import LocationListContainer from '@/components/admin/locations/LocationListContainer';
import LocationViewContainer from '@/components/admin/locations/LocationViewContainer';
import EggCreateContainer from '@/components/admin/nests/EggCreateContainer';
import EggViewContainer from '@/components/admin/nests/EggViewContainer';
import NestCreateContainer from '@/components/admin/nests/NestCreateContainer';
import NestListContainer from '@/components/admin/nests/NestListContainer';
import NestViewContainer from '@/components/admin/nests/NestViewContainer';
import S3BucketCreateContainer from '@/components/admin/s3/S3BucketCreateContainer';
import S3BucketListContainer from '@/components/admin/s3/S3BucketListContainer';
import S3BucketViewContainer from '@/components/admin/s3/S3BucketViewContainer';
import AdvancedSettingsContainer from '@/components/admin/settings/AdvancedSettingsContainer';
import CaptchaSettingsContainer from '@/components/admin/settings/CaptchaSettingsContainer';
import CustomNavigationSettingsContainer from '@/components/admin/settings/CustomNavigationSettingsContainer';
import DomainCreateContainer from '@/components/admin/settings/DomainCreateContainer';
import DomainEditContainer from '@/components/admin/settings/DomainEditContainer';
import DomainListContainer from '@/components/admin/settings/DomainListContainer';
import LogoSettingsContainer from '@/components/admin/settings/LogoSettingsContainer';
import MailSettingsContainer from '@/components/admin/settings/MailSettingsContainer';
import SettingsContainer from '@/components/admin/settings/SettingsContainer';
import UserCreateContainer from '@/components/admin/users/UserCreateContainer';
import UserListContainer from '@/components/admin/users/UserListContainer';
import UserViewContainer from '@/components/admin/users/UserViewContainer';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';

interface AdminPageDefinition {
    path: string;
    title: string;
    description: string;
    legacyRoute: string;
}

const adminPages: AdminPageDefinition[] = [
    {
        path: '',
        title: 'Administrative Overview',
        description: 'System status, panel version, and project support links.',
        legacyRoute: 'admin.index',
    },
    {
        path: 'api',
        title: 'Application API',
        description: 'Application API key listing and revocation.',
        legacyRoute: 'admin.api.index',
    },
    {
        path: 'api/new',
        title: 'Create Application API Key',
        description: 'Create a new application API key with scoped permissions.',
        legacyRoute: 'admin.api.new',
    },
    {
        path: 'locations',
        title: 'Locations',
        description: 'Location listing and creation.',
        legacyRoute: 'admin.locations',
    },
    {
        path: 'locations/new',
        title: 'Create Location',
        description: 'Create a new location.',
        legacyRoute: 'admin.locations',
    },
    {
        path: 'locations/view/:id',
        title: 'Location Details',
        description: 'Edit a location and review assigned nodes.',
        legacyRoute: 'admin.locations.view',
    },
    {
        path: 'databases',
        title: 'Databases',
        description: 'Database host listing and connection testing.',
        legacyRoute: 'admin.databases',
    },
    {
        path: 'databases/view/:id',
        title: 'Database Host Details',
        description: 'Edit database host settings and delete hosts.',
        legacyRoute: 'admin.databases.view',
    },
    {
        path: 'settings',
        title: 'Settings',
        description: 'General panel configuration.',
        legacyRoute: 'admin.settings',
    },
    {
        path: 'settings/mail',
        title: 'Mail Settings',
        description: 'Mail driver configuration and test delivery.',
        legacyRoute: 'admin.settings.mail',
    },
    {
        path: 'settings/advanced',
        title: 'Advanced Settings',
        description: 'Advanced panel and daemon configuration.',
        legacyRoute: 'admin.settings.advanced',
    },
    {
        path: 'settings/captcha',
        title: 'Captcha Settings',
        description: 'Captcha provider and challenge configuration.',
        legacyRoute: 'admin.settings.captcha',
    },
    {
        path: 'settings/custom-navigation',
        title: 'Custom Navigation',
        description: 'Configure custom panel navigation links.',
        legacyRoute: 'admin.settings.custom-navigation',
    },
    {
        path: 'settings/logo',
        title: 'Logo Settings',
        description: 'Configure the panel logo and favicon.',
        legacyRoute: 'admin.settings.logo',
    },
    {
        path: 'settings/domains',
        title: 'Domains',
        description: 'Domain provider configuration and listing.',
        legacyRoute: 'admin.settings.domains.index',
    },
    {
        path: 'settings/domains/create',
        title: 'Create Domain',
        description: 'Add a new domain provider configuration.',
        legacyRoute: 'admin.settings.domains.create',
    },
    {
        path: 'settings/domains/:id/edit',
        title: 'Edit Domain',
        description: 'Edit a domain provider configuration.',
        legacyRoute: 'admin.settings.domains.edit',
    },
    {
        path: 'users',
        title: 'Users',
        description: 'User listing, search, and account status.',
        legacyRoute: 'admin.users',
    },
    {
        path: 'users/new',
        title: 'Create User',
        description: 'Create a new panel user.',
        legacyRoute: 'admin.users.new',
    },
    {
        path: 'users/view/:id',
        title: 'User Details',
        description: 'Edit identity, permissions, and password settings.',
        legacyRoute: 'admin.users.view',
    },
    {
        path: 'servers',
        title: 'Servers',
        description: 'Server listing, filtering, and status.',
        legacyRoute: 'admin.servers',
    },
    {
        path: 'servers/new',
        title: 'Create Server',
        description: 'Create a new managed server.',
        legacyRoute: 'admin.servers.new',
    },
    {
        path: 'servers/view/:id',
        title: 'Server Overview',
        description: 'Review server details and resource usage.',
        legacyRoute: 'admin.servers.view',
    },
    {
        path: 'servers/view/:id/details',
        title: 'Server Details',
        description: 'Edit owner, name, description, and external ID.',
        legacyRoute: 'admin.servers.view.details',
    },
    {
        path: 'servers/view/:id/build',
        title: 'Server Build',
        description: 'Edit allocations, limits, and feature limits.',
        legacyRoute: 'admin.servers.view.build',
    },
    {
        path: 'servers/view/:id/startup',
        title: 'Server Startup',
        description: 'Edit startup command, variables, and Docker image.',
        legacyRoute: 'admin.servers.view.startup',
    },
    {
        path: 'servers/view/:id/database',
        title: 'Server Databases',
        description: 'Create databases and rotate database passwords.',
        legacyRoute: 'admin.servers.view.database',
    },
    {
        path: 'servers/view/:id/mounts',
        title: 'Server Mounts',
        description: 'Attach and remove server mounts.',
        legacyRoute: 'admin.servers.view.mounts',
    },
    {
        path: 'servers/view/:id/manage',
        title: 'Server Management',
        description: 'Suspend, reinstall, transfer, and toggle install state.',
        legacyRoute: 'admin.servers.view.manage',
    },
    {
        path: 'servers/view/:id/delete',
        title: 'Delete Server',
        description: 'Delete or force-delete a server.',
        legacyRoute: 'admin.servers.view.delete',
    },
    {
        path: 'nodes',
        title: 'Nodes',
        description: 'Node listing and resource overview.',
        legacyRoute: 'admin.nodes',
    },
    {
        path: 'nodes/new',
        title: 'Create Node',
        description: 'Create a new Wings node.',
        legacyRoute: 'admin.nodes.new',
    },
    {
        path: 'nodes/view/:id',
        title: 'Node Overview',
        description: 'Review node health and allocated resources.',
        legacyRoute: 'admin.nodes.view',
    },
    {
        path: 'nodes/view/:id/settings',
        title: 'Node Settings',
        description: 'Edit node connection and resource settings.',
        legacyRoute: 'admin.nodes.view.settings',
    },
    {
        path: 'nodes/view/:id/configuration',
        title: 'Node Configuration',
        description: 'Review daemon configuration and deployment token.',
        legacyRoute: 'admin.nodes.view.configuration',
    },
    {
        path: 'nodes/view/:id/allocation',
        title: 'Node Allocations',
        description: 'Create, alias, and remove node allocations.',
        legacyRoute: 'admin.nodes.view.allocation',
    },
    {
        path: 'nodes/view/:id/servers',
        title: 'Node Servers',
        description: 'Servers currently assigned to this node.',
        legacyRoute: 'admin.nodes.view.servers',
    },
    {
        path: 'mounts',
        title: 'Mounts',
        description: 'Mount listing and creation.',
        legacyRoute: 'admin.mounts',
    },
    {
        path: 'mounts/view/:id',
        title: 'Mount Details',
        description: 'Edit mount configuration and assignments.',
        legacyRoute: 'admin.mounts.view',
    },
    {
        path: 'nests',
        title: 'Nests',
        description: 'Nest listing and creation.',
        legacyRoute: 'admin.nests',
    },
    {
        path: 'nests/new',
        title: 'Create Nest',
        description: 'Create a new nest.',
        legacyRoute: 'admin.nests.new',
    },
    {
        path: 'nests/view/:id',
        title: 'Nest Details',
        description: 'Edit a nest and review its eggs.',
        legacyRoute: 'admin.nests.view',
    },
    {
        path: 'nests/egg/new',
        title: 'Create Egg',
        description: 'Create a new egg.',
        legacyRoute: 'admin.nests.egg.new',
    },
    {
        path: 'nests/egg/:id',
        title: 'Egg Details',
        description: 'Edit egg metadata, Docker images, and process config.',
        legacyRoute: 'admin.nests.egg.view',
    },
    {
        path: 'nests/egg/:id/variables',
        title: 'Egg Variables',
        description: 'Create, edit, and delete egg variables.',
        legacyRoute: 'admin.nests.egg.variables',
    },
    {
        path: 'nests/egg/:id/scripts',
        title: 'Egg Scripts',
        description: 'Edit egg install scripts.',
        legacyRoute: 'admin.nests.egg.scripts',
    },
    {
        path: 'buckets',
        title: 'S3 Buckets',
        description: 'S3 backup bucket listing and creation.',
        legacyRoute: 'admin.buckets',
    },
    {
        path: 'buckets/new',
        title: 'Create S3 Bucket',
        description: 'Create and test a new S3 backup bucket.',
        legacyRoute: 'admin.buckets.new',
    },
    {
        path: 'buckets/view/:id',
        title: 'S3 Bucket Overview',
        description: 'Review bucket details and assigned servers.',
        legacyRoute: 'admin.buckets.view',
    },
    {
        path: 'buckets/view/:id/details',
        title: 'S3 Bucket Details',
        description: 'Edit S3 endpoint and credential settings.',
        legacyRoute: 'admin.buckets.view.details',
    },
    {
        path: 'buckets/view/:id/servers',
        title: 'S3 Bucket Servers',
        description: 'Servers using this S3 backup bucket.',
        legacyRoute: 'admin.buckets.view.servers',
    },
    {
        path: 'buckets/view/:id/delete',
        title: 'Delete S3 Bucket',
        description: 'Delete an S3 backup bucket configuration.',
        legacyRoute: 'admin.buckets.view.delete',
    },
];

const implementedPaths = new Set([
    '',
    'api',
    'api/new',
    'users',
    'users/new',
    'users/view/:id',
    'locations',
    'locations/new',
    'locations/view/:id',
    'databases',
    'databases/view/:id',
    'settings',
    'settings/mail',
    'settings/advanced',
    'settings/captcha',
    'settings/custom-navigation',
    'settings/logo',
    'settings/domains',
    'settings/domains/create',
    'settings/domains/:id/edit',
    'nests',
    'nests/new',
    'nests/view/:id',
    'nests/egg/new',
    'nests/egg/:id',
    'buckets',
    'buckets/new',
    'buckets/view/:id',
    'buckets/view/:id/details',
    'buckets/view/:id/servers',
    'buckets/view/:id/delete',
]);

const AdminPlaceholderPage = ({ title, description, legacyRoute }: AdminPageDefinition) => (
    <PageContentBlock title={title}>
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
                <p className='text-sm font-medium uppercase tracking-[0.18em] text-brand'>Admin</p>
                <h1 className='text-3xl font-extrabold leading-none tracking-[-0.08rem]'>{title}</h1>
                <p className='max-w-2xl text-sm text-white/60'>{description}</p>
            </div>

            <div className='rounded-2xl border border-mocha-400 bg-bg-lowered p-5 text-sm text-white/70'>
                <p>
                    This route is now mounted in the React admin router. The page implementation will be migrated in the
                    next phases using the existing API and UI components.
                </p>
                <p className='mt-3 text-xs text-white/45'>Legacy route: {legacyRoute}</p>
            </div>

            <Link to='/admin' className='w-fit text-sm font-medium text-brand hover:text-brand/80'>
                Back to admin overview
            </Link>
        </div>
    </PageContentBlock>
);

const AdminRouter = () => {
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    if (!rootAdmin) {
        return <ServerError title='Access denied' message='You do not have permission to access the admin panel.' />;
    }

    return (
        <Routes>
            <Route path='' element={<AdminOverviewContainer />} />
            <Route path='api' element={<ApplicationApiListContainer />} />
            <Route path='api/new' element={<ApplicationApiCreateContainer />} />
            <Route path='users' element={<UserListContainer />} />
            <Route path='users/new' element={<UserCreateContainer />} />
            <Route path='users/view/:id' element={<UserViewContainer />} />
            <Route path='locations' element={<LocationListContainer />} />
            <Route path='locations/new' element={<LocationCreateContainer />} />
            <Route path='locations/view/:id' element={<LocationViewContainer />} />
            <Route path='databases' element={<DatabaseHostListContainer />} />
            <Route path='databases/view/:id' element={<DatabaseHostViewContainer />} />
            <Route path='settings' element={<SettingsContainer />} />
            <Route path='settings/mail' element={<MailSettingsContainer />} />
            <Route path='settings/advanced' element={<AdvancedSettingsContainer />} />
            <Route path='settings/captcha' element={<CaptchaSettingsContainer />} />
            <Route path='settings/custom-navigation' element={<CustomNavigationSettingsContainer />} />
            <Route path='settings/logo' element={<LogoSettingsContainer />} />
            <Route path='settings/domains' element={<DomainListContainer />} />
            <Route path='settings/domains/create' element={<DomainCreateContainer />} />
            <Route path='settings/domains/:id/edit' element={<DomainEditContainer />} />
            <Route path='nests' element={<NestListContainer />} />
            <Route path='nests/new' element={<NestCreateContainer />} />
            <Route path='nests/view/:id' element={<NestViewContainer />} />
            <Route path='nests/egg/new' element={<EggCreateContainer />} />
            <Route path='nests/egg/:id' element={<EggViewContainer />} />
            <Route path='buckets' element={<S3BucketListContainer />} />
            <Route path='buckets/new' element={<S3BucketCreateContainer />} />
            <Route path='buckets/view/:id' element={<S3BucketViewContainer mode='overview' />} />
            <Route path='buckets/view/:id/details' element={<S3BucketViewContainer mode='details' />} />
            <Route path='buckets/view/:id/servers' element={<S3BucketViewContainer mode='servers' />} />
            <Route path='buckets/view/:id/delete' element={<S3BucketViewContainer mode='delete' />} />
            {adminPages
                .filter((page) => !implementedPaths.has(page.path))
                .map((page) => (
                    <Route key={page.path || 'index'} path={page.path} element={<AdminPlaceholderPage {...page} />} />
                ))}
            <Route path='*' element={<NotFound />} />
        </Routes>
    );
};

export default AdminRouter;
