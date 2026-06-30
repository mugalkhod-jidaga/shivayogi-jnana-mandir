import { useTranslation } from 'react-i18next';
import type { StaffStatus } from '@/types/user';
import { staffStatusLabel } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

const statusStyles: Record<StaffStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Inactive: 'bg-muted text-muted-foreground',
};

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      {staffStatusLabel(t, status)}
    </span>
  );
}
