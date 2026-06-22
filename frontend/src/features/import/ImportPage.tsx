import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { toCommitRows, useMigrationCommit, useMigrationParse } from '@/hooks/useMigration';
import { ApiError } from '@/lib/api';
import { formatDobDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { MigrationParseResult } from '@/types/migration';

type Step = 'upload' | 'preview' | 'done';

const ACCEPTED_EXTENSIONS = '.csv,.xlsx,.xls';
const SAMPLE_URL = '/samples/sample-students.csv';

const steps: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'done', label: 'Done' },
];

function formatName(firstName: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const parse = useMigrationParse();
  const commit = useMigrationCommit();

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<MigrationParseResult | null>(null);
  const [insertedCount, setInsertedCount] = useState(0);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    const isAllowed = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!isAllowed) {
      toast.error('Only .csv, .xlsx, and .xls files are allowed');
      return;
    }

    try {
      const result = await parse.mutateAsync(file);
      setFileName(file.name);
      setParseResult(result);
      setStep('preview');
      toast.success(`Parsed ${result.validRows} valid row(s)`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not parse file';
      toast.error(message);
    }
  };

  const handleCommit = async () => {
    if (!parseResult || parseResult.preview.length === 0) return;

    try {
      const { inserted } = await commit.mutateAsync(toCommitRows(parseResult.preview));
      setInsertedCount(inserted);
      setStep('done');
      toast.success(`Imported ${inserted} student(s)`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Import failed';
      toast.error(message);
    }
  };

  const reset = () => {
    setStep('upload');
    setFileName(null);
    setParseResult(null);
    setInsertedCount(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const stepIndex = steps.findIndex((item) => item.key === step);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import"
        description="Upload a CSV or spreadsheet, review validation errors, then commit student records."
      />

      <ol className="flex gap-4 border-b pb-4">
        {steps.map((item, index) => (
          <li
            key={item.key}
            className={cn(
              'flex items-center gap-2 text-sm',
              index <= stepIndex ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                index < stepIndex && 'bg-primary text-primary-foreground',
                index === stepIndex && 'border-2 border-primary',
                index > stepIndex && 'border border-muted-foreground/40',
              )}
            >
              {index < stepIndex ? '✓' : index + 1}
            </span>
            {item.label}
          </li>
        ))}
      </ol>

      {step === 'upload' && (
        <div className="rounded-lg border p-6">
          <div className="flex flex-col items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <FileSpreadsheet className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-medium">Upload spreadsheet</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                CSV or Excel (.xlsx / .xls), up to 5 MB. Date of birth uses DD/MM/YYYY (e.g.
                15/05/2010). Other columns match the sample file.
              </p>
            </div>
            <a
              href={SAMPLE_URL}
              download="sample-students.csv"
              className="text-sm font-medium text-primary hover:underline"
            >
              Download sample CSV
            </a>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <Button type="button" disabled={parse.isPending} onClick={() => inputRef.current?.click()}>
              {parse.isPending ? (
                'Parsing…'
              ) : (
                <>
                  <Upload className="size-4" />
                  Choose file
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && parseResult && (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 text-sm">
            <p>
              <span className="font-medium">{fileName}</span> — {parseResult.validRows} valid row(s)
              {parseResult.errorRows.length > 0 && (
                <>, {parseResult.errorRows.length} error(s)</>
              )}
            </p>
          </div>

          {parseResult.preview.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Valid rows ({parseResult.preview.length})</h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium">Row</th>
                      <th className="px-4 py-3 font-medium">Admission #</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">DOB</th>
                      <th className="px-4 py-3 font-medium">District</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.preview.map((row) => (
                      <tr key={row.row} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{row.row}</td>
                        <td className="px-4 py-3">{row.admission_number}</td>
                        <td className="px-4 py-3">{formatName(row.first_name, row.last_name)}</td>
                        <td className="px-4 py-3">{formatDobDisplay(row.dob)}</td>
                        <td className="px-4 py-3">{row.district}</td>
                        <td className="px-4 py-3">{row.primary_contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {parseResult.errorRows.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-destructive">
                Errors ({parseResult.errorRows.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                These rows will not be imported. Fix the file and upload again, or commit the valid
                rows only.
              </p>
              <div className="overflow-x-auto rounded-lg border border-destructive/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-destructive/5 text-left">
                      <th className="px-4 py-3 font-medium">Row</th>
                      <th className="px-4 py-3 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.errorRows.map((error) => (
                      <tr key={`${error.row}-${error.error}`} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{error.row}</td>
                        <td className="px-4 py-3">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              Upload different file
            </Button>
            <Button
              type="button"
              disabled={parseResult.preview.length === 0 || commit.isPending}
              onClick={() => void handleCommit()}
            >
              {commit.isPending
                ? 'Importing…'
                : `Import ${parseResult.preview.length} student(s)`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-lg border p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h2 className="mt-4 text-lg font-medium">Import complete</h2>
          <p className="mt-2 text-muted-foreground">
            Successfully inserted {insertedCount} student record(s).
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              Import another file
            </Button>
            <Button asChild>
              <Link to="/students">View students</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
