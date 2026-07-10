import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PendingPhoto } from '@/types/health';

export const MAX_PHOTOS_PER_VISIT = 4;

function newPhotoId() {
  return globalThis.crypto?.randomUUID?.() ?? `photo-${Date.now()}`;
}

type Props = {
  photos: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
  disabled?: boolean;
};

export function PhotoCapture({ photos, onChange, disabled = false }: Props) {
  const { t } = useTranslation('health');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    const remaining = MAX_PHOTOS_PER_VISIT - photos.length;
    const toAdd = files.slice(0, remaining);

    onChange([
      ...photos,
      ...toAdd.map((file) => ({
        id: newPhotoId(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  }

  const atLimit = photos.length >= MAX_PHOTOS_PER_VISIT;
  const inputDisabled = disabled || atLimit;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Camera — capture attribute opens the rear camera on mobile */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={inputDisabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {/* Gallery — no capture attribute so the OS file picker / photo library opens */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={inputDisabled}
          onChange={(e) => {
            handleFiles(e.target.files);
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
        <span className="text-sm text-muted-foreground">
          {t('record.photoCount', { count: photos.length, max: MAX_PHOTOS_PER_VISIT })}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border">
              <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                onClick={() => removePhoto(photo.id)}
                disabled={disabled}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function emptyPendingPhotos(): PendingPhoto[] {
  return [];
}
