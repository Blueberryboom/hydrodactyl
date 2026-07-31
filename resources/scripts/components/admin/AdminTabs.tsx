import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AdminTabDefinition {
    label: string;
    to: string;
    end?: boolean;
}

const AdminTabs = ({ tabs }: { tabs: AdminTabDefinition[] }) => (
    <div className='flex flex-wrap gap-2'>
        {tabs.map((tab) => (
            <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                    cn(
                        'rounded-xl border border-mocha-400 px-3 py-2 text-sm font-medium text-white/65 transition hover:border-brand/60 hover:text-white',
                        isActive && 'border-brand/70 bg-brand/10 text-brand',
                    )
                }
            >
                {tab.label}
            </NavLink>
        ))}
    </div>
);

export default AdminTabs;
