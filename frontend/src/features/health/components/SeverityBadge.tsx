import { cn } from '@/lib/utils';

type Props = {
  code: string;
  label: string;
  className?: string;
};

const STYLES: Record<string, string> = {
  normal: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-900 border-amber-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export function SeverityBadge({ code, label, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
        STYLES[code] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  );
}
