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
  const { data: documents = [], isLoading, isError } = useStudentDocuments(studentId);

  return (
    <div className="space-y-6">
      <RequirePermission permission="documents:upload">
        <DocumentUploadForm studentId={studentId} />
      </RequirePermission>

      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h3 className="font-medium">Uploaded documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Finance users only see Income Certificate and BPL Card here.
          </p>
        </div>

        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading documents…</p>}

        {isError && (
          <p className="p-6 text-sm text-destructive">Could not load documents for this student.</p>
        )}

        {!isLoading && !isError && documents.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No documents uploaded yet.</p>
        )}

        {!isLoading && !isError && documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">File</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Uploaded</th>
                  <th className="px-6 py-3 font-medium">Expiry</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
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
