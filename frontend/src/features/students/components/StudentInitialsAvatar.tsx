import { getInitials, getInitialsAvatarStyle } from '@/lib/initialsAvatar';
import { cn } from '@/lib/utils';

type StudentInitialsAvatarProps = {
  firstName: string;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
};

export function StudentInitialsAvatar({
  firstName,
  lastName,
  size = 'md',
  className,
}: StudentInitialsAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colors = getInitialsAvatarStyle(firstName, lastName);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-black/5 font-semibold',
        sizeClasses[size],
        colors.bg,
        colors.text,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
