import AdminTabs, { type AdminTabDefinition } from '@/components/admin/AdminTabs';

const tabs: AdminTabDefinition[] = [
    { label: 'General', to: '/admin/settings', end: true },
    { label: 'Mail', to: '/admin/settings/mail' },
    { label: 'Captcha', to: '/admin/settings/captcha' },
    { label: 'Domains', to: '/admin/settings/domains' },
    { label: 'Custom Navigation', to: '/admin/settings/custom-navigation' },
    { label: 'Branding', to: '/admin/settings/logo' },
    { label: 'Advanced', to: '/admin/settings/advanced' },
];

const SettingsNav = () => <AdminTabs tabs={tabs} />;

export default SettingsNav;
