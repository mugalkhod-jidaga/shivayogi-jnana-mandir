import { RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StudentInitialsAvatar } from '@/features/students/components/StudentInitialsAvatar';
import { useAvatarUpload, useStudentAvatarUrl } from '@/hooks/useStudent';

type StudentAvatarPanelProps = {
  studentId: string;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  canEdit: boolean;
};

export function StudentAvatarPanel({
  studentId,
  firstName,
  lastName,
  photoUrl,
  canEdit,
}: StudentAvatarPanelProps) {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useAvatarUpload(studentId);
  const [loadRequested, setLoadRequested] = useState(false);

  const hasPhoto = Boolean(photoUrl);
  const shouldFetchUrl = hasPhoto && loadRequested;

  const {
    data: avatarData,
    isLoading: isLoadingUrl,
    isError: isUrlError,
    refetch,
  } = useStudentAvatarUrl(studentId, shouldFetchUrl);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('detail.avatar.invalidFile'));
      return;
    }

    try {
      await upload.mutateAsync(file);
      setLoadRequested(true);
      await refetch();
      toast.success(t('detail.avatar.success'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('detail.avatar.error');
      toast.error(message);
    }
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-medium">{t('detail.avatar.title')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('detail.avatar.description')}</p>

      <div className="mt-6 flex flex-col items-start gap-4">
        {!loadRequested && (
          <div className="flex flex-col items-start gap-3">
            <StudentInitialsAvatar firstName={firstName} lastName={lastName} size="lg" />
            {hasPhoto && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setLoadRequested(true)}>
                {t('detail.avatar.viewPhoto')}
              </Button>
            )}
          </div>
        )}

        {hasPhoto && loadRequested && isLoadingUrl && (
          <div className="flex h-40 w-40 items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
            {tc('loading')}
          </div>
        )}

        {hasPhoto && loadRequested && isUrlError && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{t('detail.avatar.loadError')}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
              {t('detail.avatar.retry')}
            </Button>
          </div>
        )}

        {avatarData?.downloadUrl && (
          <img
            src={avatarData.downloadUrl}
            alt={t('detail.avatar.alt')}
            className="h-40 w-40 rounded-lg border object-cover"
          />
        )}

        {canEdit && (
          <>
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
              variant="outline"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                t('detail.avatar.uploading')
              ) : hasPhoto ? (
                <>
                  <RefreshCw className="size-4" />
                  {t('detail.avatar.replacePhoto')}
                </>
              ) : (
                t('detail.avatar.uploadPhoto')
              )}
            </Button>
          </>
        )}

        {!canEdit && !hasPhoto && (
          <p className="text-sm text-muted-foreground">{t('detail.avatar.noPhoto')}</p>
        )}
      </div>
    </div>
  );
}
