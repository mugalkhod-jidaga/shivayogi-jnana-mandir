import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useComplianceReport, useDashboardSummary } from '@/hooks/useDashboard';

export function DashboardPage() {
  const summary = useDashboardSummary();
  const compliance = useComplianceReport();

  const isLoading = summary.isLoading || compliance.isLoading;
  const isError = summary.isError || compliance.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Tenant overview, document compliance, and student counts."
      />

      {isError && (
        <PlaceholderPanel
          title="Could not load dashboard"
          description="Check that the backend is running and you have dashboard access."
        />
      )}

      {!isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              title="Total students"
              value={isLoading ? '…' : (summary.data?.totalStudents ?? 0)}
            />
            <KpiCard
              title="Active"
              value={isLoading ? '…' : (summary.data?.activeStudents ?? 0)}
            />
            <KpiCard
              title="Alumni"
              value={isLoading ? '…' : (summary.data?.alumniCount ?? 0)}
            />
            <KpiCard
              title="Docs complete"
              value={isLoading ? '…' : (summary.data?.documentsComplete ?? 0)}
              description="Active students with all document types verified"
            />
            <KpiCard
              title="Docs pending"
              value={isLoading ? '…' : (summary.data?.documentsPending ?? 0)}
              description="Documents awaiting review"
            />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-medium">Document compliance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Active students missing one or more verified document types.
              </p>
            </div>

            {compliance.isLoading && (
              <p className="text-sm text-muted-foreground">Loading compliance report…</p>
            )}

            {!compliance.isLoading && (compliance.data?.length ?? 0) === 0 && (
              <p className="rounded-lg border p-6 text-sm text-muted-foreground">
                All active students have verified documents for every required type.
              </p>
            )}

            {!compliance.isLoading && (compliance.data?.length ?? 0) > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Admission #</th>
                      <th className="px-4 py-3 font-medium">Missing documents</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.data?.map((row) => (
                      <tr key={row.studentId} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3">{row.admissionNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.missingDocumentTypes.map((type) => (
                              <span
                                key={type}
                                className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/students/${row.studentId}?tab=documents`}
                            className="font-medium text-primary hover:underline"
                          >
                            View documents
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
