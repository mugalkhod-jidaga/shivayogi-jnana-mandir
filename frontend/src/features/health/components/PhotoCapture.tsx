import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { HealthLookupOption, PendingAttachment } from '@/types/health';

export const MAX_ATTACHMENTS_PER_VISIT = 8;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const ALLOWED_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF = 'application/pdf';

function newAttachmentId() {
  return globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}`;
}

function isAllowedFile(file: File) {
  const mime = (file.type || '').toLowerCase();
  return ALLOWED_IMAGE.includes(mime) || mime === ALLOWED_PDF;
}

type Props = {
  attachments: PendingAttachment[];
  onChange: (attachments: PendingAttachment[]) => void;
  kinds: (HealthLookupOption & { code: string })[];
  disabled?: boolean;
};

export function PhotoCapture({ attachments, onChange, kinds, disabled = false }: Props) {
  const { t } = useTranslation('health');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const defaultKindId =
    kinds.find((k) => k.code === 'photo')?.id ?? kinds[0]?.id ?? 0;

  function addFiles(fileList: FileList | null, preferKindCode?: string) {
    const files = Array.from(fileList ?? []).filter(isAllowedFile);
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS_PER_VISIT - attachments.length;
    const toAdd = files.slice(0, remaining);
    const kindId =
      kinds.find((k) => k.code === preferKindCode)?.id ??
      defaultKindId;

    onChange([
      ...attachments,
      ...toAdd.map((file) => {
        const isPdf = (file.type || '').toLowerCase() === ALLOWED_PDF;
        return {
          id: newAttachmentId(),
          file,
          previewUrl: isPdf ? null : URL.createObjectURL(file),
          attachmentKindId: isPdf
            ? (kinds.find((k) => k.code === 'lab_report')?.id ??
              kinds.find((k) => k.code === 'prescription')?.id ??
              kindId)
            : kindId,
          isPdf,
        };
      }),
    ]);
  }

  function removeAttachment(id: string) {
    const target = attachments.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  }

  function setKind(id: string, attachmentKindId: number) {
    onChange(
      attachments.map((a) => (a.id === id ? { ...a, attachmentKindId } : a)),
    );
  }

  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_VISIT;
  const inputDisabled = disabled || atLimit || !defaultKindId;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={inputDisabled}
          onChange={(e) => {
            addFiles(e.target.files, 'photo');
            e.target.value = '';
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={inputDisabled}
          onChange={(e) => {
            addFiles(e.target.files, 'photo');
            e.target.value = '';
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
          multiple
          className="hidden"
          disabled={inputDisabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={inputDisabled}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-4" />
          {t('record.takePhoto')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={inputDisabled}
          onClick={() => galleryRef.current?.click()}
        >
          <ImageIcon className="size-4" />
          {t('record.chooseFromGallery')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={inputDisabled}
          onClick={() => fileRef.current?.click()}
        >
          <FileText className="size-4" />
          {t('record.uploadFile')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('record.attachmentCount', {
            count: attachments.length,
            max: MAX_ATTACHMENTS_PER_VISIT,
          })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t('record.attachmentHelp')}</p>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-2"
            >
              {item.isPdf ? (
                <div className="flex size-14 items-center justify-center rounded-md bg-muted">
                  <FileText className="size-6 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={item.previewUrl ?? ''}
                  alt=""
                  className="size-14 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <Select
                  value={String(item.attachmentKindId)}
                  onChange={(e) => setKind(item.id, Number(e.target.value))}
                  disabled={disabled}
                >
                  {kinds.map((k) => (
                    <option key={k.id} value={String(k.id)}>
                      {k.value}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(item.id)}
                disabled={disabled}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function emptyPendingPhotos(): PendingAttachment[] {
  return [];
}

export function emptyPendingAttachments(): PendingAttachment[] {
  return [];
}
