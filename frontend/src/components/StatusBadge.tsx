import { useTranslation } from 'react-i18next';
import type { StudentStatus } from '@/types/student';
import { cn } from '@/lib/utils';

const statusStyles: Record<StudentStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Alumni: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Discontinued: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const statusKeys: Record<StudentStatus, 'active' | 'alumni' | 'discontinued'> = {
  Active: 'active',
  Alumni: 'alumni',
  Discontinued: 'discontinued',
};

export function StatusBadge({ status }: { status: StudentStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      {t(`status.${statusKeys[status]}`)}
    </span>
  );
}
