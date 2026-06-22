import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAvatarUpload } from '@/hooks/useStudent';

type StudentAvatarUploadProps = {
  studentId: string;
};

export function StudentAvatarUpload({ studentId }: StudentAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useAvatarUpload(studentId);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    try {
      await upload.mutateAsync(file);
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Could not upload avatar');
    }
  };

  return (
    <div className="rounded-lg border border-dashed p-6">
      <h3 className="font-medium">Student photo</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a profile photo. The file is stored securely via presigned upload.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <Button
        type="button"
        className="mt-4"
        variant="outline"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? 'Uploading…' : 'Choose image'}
      </Button>
    </div>
  );
}
