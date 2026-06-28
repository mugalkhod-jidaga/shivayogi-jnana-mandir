import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useDashboardSummary } from '@/hooks/useDashboard';

export function DashboardPage() {
  const summary = useDashboardSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="School operations overview — students, staff, and enrollment breakdown."
      />

      {summary.isError && (
        <PlaceholderPanel
          title="Could not load dashboard"
          description="Check that the backend is running and you have dashboard access."
        />
      )}

      {!summary.isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <KpiCard
              title="Active students"
              value={summary.isLoading ? '…' : (summary.data?.activeStudents ?? 0)}
              description={`${summary.data?.totalStudents ?? 0} total enrolled`}
            />
            <KpiCard
              title="Active staff"
              value={summary.isLoading ? '…' : (summary.data?.activeStaff ?? 0)}
              description={`${summary.data?.totalStaff ?? 0} staff accounts`}
            />
            <KpiCard
              title="Admissions this month"
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisMonth ?? 0)}
            />
            <KpiCard
              title="Admissions this year"
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisAcademicYear ?? 0)}
              description={summary.data?.currentAcademicYear ?? undefined}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">Students by standard</h2>
              <p className="mt-1 text-sm text-muted-foreground">Active students in current enrollment.</p>
              {summary.isLoading && (
                <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByStandard.length ?? 0) === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No enrollment data yet.</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByStandard.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium">Standard</th>
                        <th className="py-2 font-medium text-right">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.data?.studentsByStandard.map((row) => (
                        <tr key={row.standardId} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
                          <td className="py-2 text-right tabular-nums">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">Students by category</h2>
              <p className="mt-1 text-sm text-muted-foreground">Active students by admission category.</p>
              {summary.isLoading && (
                <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByCategory.length ?? 0) === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No category data yet.</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByCategory.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium">Category</th>
                        <th className="py-2 font-medium text-right">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.data?.studentsByCategory.map((row) => (
                        <tr key={row.categoryId} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
                          <td className="py-2 text-right tabular-nums">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">Document compliance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review pending uploads and missing verified documents from the documents queue.
            </p>
            <Link to="/documents" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Open document queue →
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
