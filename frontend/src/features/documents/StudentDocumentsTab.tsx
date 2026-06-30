import { useTranslation } from 'react-i18next';
import { RequirePermission } from '@/components/RequirePermission';
import { DocumentActions } from '@/features/documents/components/DocumentActions';
import { DocumentStatusBadge } from '@/features/documents/components/DocumentStatusBadge';
import { DocumentUploadForm } from '@/features/documents/components/DocumentUploadForm';
import { formatDate, formatFileSize } from '@/features/documents/documentFormatters';
import { useStudentDocuments } from '@/hooks/useDocuments';

type StudentDocumentsTabProps = {
  studentId: string;
};

export function StudentDocumentsTab({ studentId }: StudentDocumentsTabProps) {
  const { t } = useTranslation('documents');
  const { data: documents = [], isLoading, isError } = useStudentDocuments(studentId);

  return (
    <div className="space-y-6">
      <RequirePermission permission="documents:upload">
        <DocumentUploadForm studentId={studentId} />
      </RequirePermission>

      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h3 className="font-medium">{t('studentTab.uploadedTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('studentTab.financeNote')}</p>
        </div>

        {isLoading && <p className="p-6 text-sm text-muted-foreground">{t('studentTab.loading')}</p>}

        {isError && (
          <p className="p-6 text-sm text-destructive">{t('studentTab.error')}</p>
        )}

        {!isLoading && !isError && documents.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">{t('studentTab.empty')}</p>
        )}

        {!isLoading && !isError && documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.type')}</th>
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.file')}</th>
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.status')}</th>
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.uploaded')}</th>
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.expires')}</th>
                  <th className="px-6 py-3 font-medium">{t('studentTab.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className="border-b last:border-b-0">
                    <td className="px-6 py-4">{document.documentType?.value ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div>{document.originalFilename ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(document.fileSize)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DocumentStatusBadge status={document.status} />
                    </td>
                    <td className="px-6 py-4">{formatDate(document.uploadedAt)}</td>
                    <td className="px-6 py-4">{formatDate(document.expiryDate)}</td>
                    <td className="px-6 py-4">
                      <DocumentActions document={document} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
