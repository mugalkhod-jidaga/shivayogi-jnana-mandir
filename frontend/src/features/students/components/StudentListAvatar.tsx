import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

type StudentListAvatarProps = {
  name: string;
  imageUrl?: string;
  hasPhoto: boolean;
  className?: string;
};

export function StudentListAvatar({ name, imageUrl, hasPhoto, className }: StudentListAvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn('size-10 shrink-0 rounded-full border object-cover', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted/60',
        hasPhoto && 'border-dashed',
        className,
      )}
      title={hasPhoto ? 'Photo available on student profile' : 'No photo'}
    >
      <User className="size-4 text-muted-foreground" />
    </div>
  );
}
