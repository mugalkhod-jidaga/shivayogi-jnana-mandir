import { env } from '@/lib/env';
import { getApiLocale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type PdfDownloadOptions = {
  filename?: string;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildQueryString(query?: PdfDownloadOptions['query']) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const match = /filename="([^"]+)"/.exec(header);
  return match?.[1] ?? fallback;
}

/**
 * Reusable PDF download — pass any `/exports/pdf/...` path (or full API path).
 */
export async function downloadPdf(path: string, options: PdfDownloadOptions = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const url = `${env.apiBaseUrl}${path}${buildQueryString(options.query)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': getApiLocale(),
    },
  });

  if (!response.ok) {
    let message = `PDF download failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // binary or empty body
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename =
    options.filename ??
    filenameFromDisposition(response.headers.get('Content-Disposition'), 'export.pdf');

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export const pdfExports = {
  students: (query?: PdfDownloadOptions['query']) =>
    downloadPdf('/exports/pdf/students', { query, filename: 'students.pdf' }),
  studentDetail: (studentId: string) =>
    downloadPdf(`/exports/pdf/students/${studentId}`, { filename: `student-${studentId}.pdf` }),
  remarks: (query?: PdfDownloadOptions['query']) =>
    downloadPdf('/exports/pdf/remarks', { query, filename: 'remarks.pdf' }),
};
