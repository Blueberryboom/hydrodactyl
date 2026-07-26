import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
    ['General', '/admin/settings'],
    ['Mail', '/admin/settings/mail'],
    ['Captcha', '/admin/settings/captcha'],
    ['Domains', '/admin/settings/domains'],
    ['Custom Navigation', '/admin/settings/custom-navigation'],
    ['Branding', '/admin/settings/logo'],
    ['Advanced', '/admin/settings/advanced'],
];

const SettingsNav = () => (
    <div className='flex flex-wrap gap-2'>
        {tabs.map(([label, to]) => (
            <NavLink
                key={to}
                to={to}
                end={to === '/admin/settings'}
                className={({ isActive }) =>
                    cn(
                        'rounded-xl border border-mocha-400 px-3 py-2 text-sm font-medium text-white/65 transition hover:border-brand/60 hover:text-white',
                        isActive && 'border-brand/70 bg-brand/10 text-brand',
                    )
                }
            >
                {label}
            </NavLink>
        ))}
    </div>
);

export default SettingsNav;
