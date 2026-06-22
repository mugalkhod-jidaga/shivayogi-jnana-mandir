import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { useDocumentDownload, useDocumentVerify } from '@/hooks/useDocuments';
import type { DocumentStatus, StudentDocument } from '@/types/document';

type DocumentActionsProps = {
  document: StudentDocument;
  compact?: boolean;
};

const verifyOptions: Array<{ status: Exclude<DocumentStatus, 'Pending Review'>; label: string }> =
  [
    { status: 'Verified', label: 'Verify' },
    { status: 'Rejected', label: 'Reject' },
    { status: 'Renewal Needed', label: 'Renewal needed' },
  ];

export function DocumentActions({ document, compact = false }: DocumentActionsProps) {
  const download = useDocumentDownload();
  const verify = useDocumentVerify();
  const canVerify = document.status === 'Pending Review';

  const handleDownload = async () => {
    try {
      await download.mutateAsync(document.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not download document';
      toast.error(message);
    }
  };

  const handleVerify = async (status: Exclude<DocumentStatus, 'Pending Review'>) => {
    try {
      await verify.mutateAsync({ documentId: document.id, status });
      toast.success(`Document marked as ${status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update document status';
      toast.error(message);
    }
  };

  return (
    <div className={compact ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-2'}>
      <RequirePermission permission="documents:download">
        <Button
          type="button"
          size={compact ? 'sm' : 'default'}
          variant="outline"
          disabled={download.isPending}
          onClick={() => void handleDownload()}
        >
          <Download className="size-4" />
          Download
        </Button>
      </RequirePermission>

      {canVerify && (
        <RequirePermission permission="documents:verify">
          {verifyOptions.map((option) => (
            <Button
              key={option.status}
              type="button"
              size={compact ? 'sm' : 'default'}
              variant={option.status === 'Verified' ? 'default' : 'outline'}
              disabled={verify.isPending}
              onClick={() => void handleVerify(option.status)}
            >
              {option.label}
            </Button>
          ))}
        </RequirePermission>
      )}
    </div>
  );
}
