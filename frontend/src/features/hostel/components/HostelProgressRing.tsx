import { cn } from '@/lib/utils';

type HostelProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  label?: string;
};

export function HostelProgressRing({
  value,
  max,
  size = 72,
  strokeWidth = 7,
  className,
  trackClassName = 'text-muted/30',
  indicatorClassName = 'text-orange-500',
  label,
}: HostelProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={indicatorClassName}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-center text-xs font-semibold tabular-nums">
        {label ?? `${pct}%`}
      </span>
    </div>
  );
}
