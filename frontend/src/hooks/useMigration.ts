import { useMutation } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/lib/api';
import type {
  MigrationCommitResult,
  MigrationCommitRow,
  MigrationParseResult,
} from '@/types/migration';

export function useMigrationParse() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiUpload<MigrationParseResult>('/migration/parse', formData);
    },
  });
}

export function useMigrationCommit() {
  return useMutation({
    mutationFn: (students: MigrationCommitRow[]) =>
      apiFetch<MigrationCommitResult>('/migration/commit', {
        method: 'POST',
        body: JSON.stringify({ students }),
      }),
  });
}

function toCommitRows(preview: MigrationParseResult['preview']): MigrationCommitRow[] {
  return preview.map(({ row: _row, ...student }) => student);
}

export { toCommitRows };
