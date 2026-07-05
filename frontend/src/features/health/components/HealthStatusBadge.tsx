import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Props = {
  status: string | null | undefined;
  className?: string;
};

const STYLES: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  recovering: 'bg-amber-100 text-amber-900 border-amber-200',
};

export function HealthStatusBadge({ status, className }: Props) {
  const { t } = useTranslation('health');
  const key = status ?? 'healthy';
  const label = t(`profile.healthStatus.${key}`, { defaultValue: key });

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STYLES[key] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  );
}
