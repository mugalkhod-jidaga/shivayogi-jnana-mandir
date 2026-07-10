import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { Button } from '@/components/ui/button';
import { toCommitRows, useMigrationCommit, useMigrationParse } from '@/hooks/useMigration';
import { ApiError } from '@/lib/api';
import { formatDobDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { MigrationParseResult, MigrationSkippedRow } from '@/types/migration';

type Step = 'upload' | 'preview' | 'done';

const ACCEPTED_EXTENSIONS = '.csv,.xlsx,.xls';
const SAMPLE_URL = '/samples/sample-students.csv';

function formatName(firstName: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function downloadSkippedRowsCsv(rows: MigrationSkippedRow[]) {
  const header = ['row', 'admission_number', 'first_name', 'standard', 'reason'];
  const escape = (value: string) =>
    value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.row,
        row.admission_number ?? '',
        row.first_name ?? '',
        row.standard ?? '',
        row.reason,
      ]
        .map((v) => escape(String(v)))
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'migration-skipped-rows.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportPage() {
  const { t } = useTranslation('import');
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
      toast.error(t('upload.invalidType'));
      return;
    }

    try {
      const result = await parse.mutateAsync(file);
      setFileName(file.name);
      setParseResult(result);
      setStep('preview');
      if (result.skippedRows.length > 0) {
        toast.success(
          t('upload.parseSuccessWithSkipped', {
            valid: result.validRows,
            skipped: result.skippedRows.length,
          }),
        );
      } else {
        toast.success(t('upload.parseSuccess', { count: result.validRows }));
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('upload.parseError');
      toast.error(message);
    }
  };

  const handleCommit = async () => {
    if (!parseResult || parseResult.preview.length === 0) return;

    try {
      const { inserted } = await commit.mutateAsync(toCommitRows(parseResult.preview));
      setInsertedCount(inserted);
      setStep('done');
      toast.success(t('done.imported', { count: inserted }));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('commitError');
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

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: t('steps.upload') },
    { key: 'preview', label: t('steps.preview') },
    { key: 'done', label: t('steps.done') },
  ];

  const stepIndex = steps.findIndex((item) => item.key === step);

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={FileSpreadsheet}
        module="import"
      />

      <ol className="flex gap-4 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50/50 to-cyan-50/40 p-4 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-cyan-950/15">
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
              <h2 className="text-lg font-medium">{t('upload.title')}</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('upload.description')}</p>
            </div>
            <a
              href={SAMPLE_URL}
              download="sample-students.csv"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('upload.sampleLink')}
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
                t('upload.parsing')
              ) : (
                <>
                  <Upload className="size-4" />
                  {t('upload.chooseFile')}
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
              {t('preview.summary', { name: fileName, valid: parseResult.validRows })}
              {parseResult.skippedRows.length > 0 && (
                <>{t('preview.skippedSuffix', { count: parseResult.skippedRows.length })}</>
              )}
              {parseResult.errorRows.length > 0 && (
                <>{t('preview.errorsSuffix', { count: parseResult.errorRows.length })}</>
              )}
            </p>
          </div>

          {parseResult.skippedRows.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium text-amber-700 dark:text-amber-400">
                  {t('preview.skippedTitle', { count: parseResult.skippedRows.length })}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSkippedRowsCsv(parseResult.skippedRows)}
                >
                  {t('preview.downloadSkipped')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('preview.skippedHint')}</p>
              <div className="overflow-x-auto rounded-lg border border-amber-500/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-amber-500/5 text-left">
                      <th className="px-4 py-3 font-medium">{t('preview.columns.row')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.admissionNumber')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.name')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.standard')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.reason')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.skippedRows.map((row) => (
                      <tr key={`skipped-${row.row}`} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{row.row}</td>
                        <td className="px-4 py-3">{row.admission_number ?? '—'}</td>
                        <td className="px-4 py-3">{row.first_name ?? '—'}</td>
                        <td className="px-4 py-3">{row.standard ?? '—'}</td>
                        <td className="px-4 py-3">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {parseResult.preview.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">
                {t('preview.validRowsTitle', { count: parseResult.preview.length })}
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium">{t('preview.columns.row')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.admissionNumber')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.name')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.dob')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.district')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.contact')}</th>
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
                {t('preview.errorsTitle', { count: parseResult.errorRows.length })}
              </h2>
              <p className="text-sm text-muted-foreground">{t('preview.errorsHint')}</p>
              <div className="overflow-x-auto rounded-lg border border-destructive/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-destructive/5 text-left">
                      <th className="px-4 py-3 font-medium">{t('preview.columns.row')}</th>
                      <th className="px-4 py-3 font-medium">{t('preview.columns.error')}</th>
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
              {t('preview.back')}
            </Button>
            <Button
              type="button"
              disabled={parseResult.preview.length === 0 || commit.isPending}
              onClick={() => void handleCommit()}
            >
              {commit.isPending
                ? t('preview.committing')
                : t('preview.commit', { count: parseResult.preview.length })}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-lg border p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h2 className="mt-4 text-lg font-medium">{t('done.title')}</h2>
          <p className="mt-2 text-muted-foreground">
            {t('done.imported', { count: insertedCount })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              {t('done.importAnother')}
            </Button>
            <Button asChild>
              <Link to="/students">{t('done.viewStudents')}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
