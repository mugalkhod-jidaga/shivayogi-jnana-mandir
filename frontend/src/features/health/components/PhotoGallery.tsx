import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthAttachmentUrl } from '@/hooks/useHealth';
import type { HealthVisitAttachment } from '@/types/health';

function AttachmentThumb({
  attachment,
  onSelect,
}: {
  attachment: HealthVisitAttachment;
  onSelect: () => void;
}) {
  const { data, isLoading, isError } = useHealthAttachmentUrl(attachment.id);

  return (
    <button
      type="button"
      className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
      onClick={onSelect}
      disabled={isLoading || isError || !data?.downloadUrl}
    >
      {data?.downloadUrl ? (
        <img src={data.downloadUrl} alt={attachment.fileName} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
          {isLoading ? '…' : '!'}
        </span>
      )}
    </button>
  );
}

type Props = {
  attachments: HealthVisitAttachment[];
  title?: string;
};

export function PhotoGallery({ attachments, title }: Props) {
  const { t } = useTranslation('health');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const lightbox = attachments.find((a) => a.id === lightboxId);
  const { data: lightboxUrl } = useHealthAttachmentUrl(lightbox?.id);

  if (!attachments.length) return null;

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title ?? t('visitDetail.photos')}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {attachments.map((attachment) => (
            <AttachmentThumb
              key={attachment.id}
              attachment={attachment}
              onSelect={() => setLightboxId(attachment.id)}
            />
          ))}
        </div>
      </div>

      {lightbox && lightboxUrl?.downloadUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxId(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightboxId(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-background p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={t('visitDetail.photoLightbox')}
          >
            <img
              src={lightboxUrl.downloadUrl}
              alt={lightbox.fileName}
              className="mx-auto max-h-[75vh] rounded-md object-contain"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">{lightbox.fileName}</p>
            <button
              type="button"
              className="mt-3 w-full text-sm text-primary hover:underline"
              onClick={() => setLightboxId(null)}
            >
              {t('visitDetail.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
