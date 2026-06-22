import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { DocumentTypeSelect } from '@/components/lookups/DocumentTypeSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocumentUpload } from '@/hooks/useDocuments';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp';

type DocumentUploadFormProps = {
  studentId: string;
};

export function DocumentUploadForm({ studentId }: DocumentUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useDocumentUpload(studentId);
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    const typeId = Number(documentTypeId);
    if (!documentTypeId || !Number.isFinite(typeId)) {
      toast.error('Choose a document type first');
      return;
    }

    const isAllowed =
      file.type === 'application/pdf' ||
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isAllowed) {
      toast.error('Only PDF and image files are allowed');
      return;
    }

    try {
      await upload.mutateAsync({
        file,
        documentTypeId: typeId,
        expiryDate: expiryDate || undefined,
      });
      toast.success('Document uploaded');
      setExpiryDate('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload document';
      toast.error(message);
    }
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="font-medium">Upload document</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        PDF or image files up to 25 MB. Uploads go to secure storage and start as Pending Review.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document type</Label>
          <DocumentTypeSelect
            id="document-type"
            value={documentTypeId}
            onChange={setDocumentTypeId}
            placeholder="Select type"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry-date">Expiry date (optional)</Label>
          <Input
            id="expiry-date"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <Button
        type="button"
        className="mt-4"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? (
          'Uploading…'
        ) : (
          <>
            <Upload className="size-4" />
            Choose file
          </>
        )}
      </Button>
    </div>
  );
}
