import { Download } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { useDocumentDownload, useDocumentVerify } from '@/hooks/useDocuments';
import type { DocumentStatus, StudentDocument } from '@/types/document';

type DocumentActionsProps = {
  document: StudentDocument;
  compact?: boolean;
};

export function DocumentActions({ document, compact = false }: DocumentActionsProps) {
  const { t } = useTranslation('documents');
  const download = useDocumentDownload();
  const verify = useDocumentVerify();
  const canVerify = document.status === 'Pending Review';

  const verifyOptions = useMemo(
    () =>
      [
        { status: 'Verified' as const, label: t('actions.verify'), success: t('actions.verifySuccess') },
        { status: 'Rejected' as const, label: t('actions.reject'), success: t('actions.rejectSuccess') },
        {
          status: 'Renewal Needed' as const,
          label: t('actions.renewalNeeded'),
          success: t('actions.renewalSuccess'),
        },
      ] satisfies Array<{
        status: Exclude<DocumentStatus, 'Pending Review'>;
        label: string;
        success: string;
      }>,
    [t],
  );

  const handleDownload = async () => {
    try {
      await download.mutateAsync(document.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('actions.downloadError');
      toast.error(message);
    }
  };

  const handleVerify = async (
    status: Exclude<DocumentStatus, 'Pending Review'>,
    successMessage: string,
  ) => {
    try {
      await verify.mutateAsync({ documentId: document.id, status });
      toast.success(successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('actions.updateError');
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
          {t('actions.download')}
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
              onClick={() => void handleVerify(option.status, option.success)}
            >
              {option.label}
            </Button>
          ))}
        </RequirePermission>
      )}
    </div>
  );
}
