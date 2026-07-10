import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModuleNav } from '@/components/module-ui/ModuleNav';

const tabs = [
  { to: '/hostel', labelKey: 'tabs.roster', icon: ClipboardList, end: true },
  { to: '/hostel/overview', labelKey: 'tabs.overview', icon: LayoutDashboard, end: false },
  { to: '/hostel/setup', labelKey: 'tabs.setup', icon: Building2, end: false },
  { to: '/hostel/allocations', labelKey: 'tabs.allocations', icon: BedDouble, end: false },
  { to: '/hostel/attendance', labelKey: 'tabs.attendance', icon: CalendarCheck, end: false },
  { to: '/hostel/reports', labelKey: 'tabs.reports', icon: BarChart3, end: false },
] as const;

export function HostelModuleNav() {
  const { t } = useTranslation('hostel');

  return (
    <ModuleNav
      theme="saffron"
      hideLabelsOnMobile
      tabs={tabs.map(({ to, labelKey, icon, end }) => ({
        to,
        label: t(labelKey),
        icon,
        end,
      }))}
    />
  );
}
