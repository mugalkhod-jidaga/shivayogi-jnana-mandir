import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHealthAttachmentUrl } from '@/hooks/useHealth';
import type { HealthVisitAttachment } from '@/types/health';

function isPdf(attachment: HealthVisitAttachment) {
  return (attachment.mimeType ?? '').toLowerCase() === 'application/pdf'
    || attachment.fileName.toLowerCase().endsWith('.pdf');
}

function AttachmentThumb({
  attachment,
  onSelect,
}: {
  attachment: HealthVisitAttachment;
  onSelect: () => void;
}) {
  const { data, isLoading, isError } = useHealthAttachmentUrl(attachment.id);
  const pdf = isPdf(attachment);

  if (pdf) {
    return (
      <a
        href={data?.downloadUrl}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-muted p-2 text-center text-xs hover:bg-muted/80"
        onClick={(e) => {
          if (!data?.downloadUrl) e.preventDefault();
        }}
      >
        <FileText className="size-6 text-muted-foreground" />
        <span className="line-clamp-2 w-full">{attachment.kind?.value ?? attachment.fileName}</span>
        {isLoading && <span className="text-muted-foreground">…</span>}
        {isError && <span className="text-destructive">!</span>}
      </a>
    );
  }

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
      {attachment.kind && (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[10px] text-white">
          {attachment.kind.value}
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
          {title ?? t('visitDetail.attachments')}
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

      {lightbox && lightboxUrl?.downloadUrl && !isPdf(lightbox) && (
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
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {lightbox.kind?.value ? `${lightbox.kind.value} · ` : ''}
              {lightbox.fileName}
            </p>
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
