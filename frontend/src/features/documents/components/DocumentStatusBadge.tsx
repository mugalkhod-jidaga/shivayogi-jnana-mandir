import { useTranslation } from 'react-i18next';
import type { DocumentStatus } from '@/types/document';
import { documentStatusLabel } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

const statusStyles: Record<DocumentStatus, string> = {
  'Pending Review':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Renewal Needed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      {documentStatusLabel(t, status)}
    </span>
  );
}
