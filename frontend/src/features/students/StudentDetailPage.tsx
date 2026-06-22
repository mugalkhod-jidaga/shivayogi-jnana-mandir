import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { RequirePermission } from '@/components/RequirePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { StudentDocumentsTab } from '@/features/documents/StudentDocumentsTab';
import { DeactivateStudentDialog } from '@/features/students/components/DeactivateStudentDialog';
import { StudentAvatarPanel } from '@/features/students/components/StudentAvatarPanel';
import { StudentInitialsAvatar } from '@/features/students/components/StudentInitialsAvatar';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudent } from '@/hooks/useStudent';
import { formatDobDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';

type TabKey = 'profile' | 'documents' | 'avatar';

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '—'}</dd>
    </div>
  );
}

export function StudentDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const { data: student, isLoading, isError } = useStudent(id);
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<TabKey>(() =>
    tabParam === 'documents' || tabParam === 'avatar' ? tabParam : 'profile',
  );
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  useEffect(() => {
    if (tabParam === 'documents' || tabParam === 'avatar' || tabParam === 'profile') {
      setTab(tabParam);
    }
  }, [tabParam]);

  if (!id) return <Navigate to="/students" replace />;

  if (isLoading) {
    return <p className="text-muted-foreground">Loading student…</p>;
  }

  if (isError || !student) {
    return <Navigate to="/students" replace />;
  }

  const displayName = [student.firstName, student.lastName].filter(Boolean).join(' ');
  const canViewFamily = hasPermission('students:view_sensitive_data') && student.familyDetails;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    ...(hasPermission('documents:view')
      ? [{ key: 'documents' as const, label: 'Documents' }]
      : []),
    { key: 'avatar', label: 'Photo' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={displayName} description={`Admission # ${student.admissionNumber}`}>
        <div className="flex flex-wrap items-center gap-3">
          <StudentInitialsAvatar
            firstName={student.firstName}
            lastName={student.lastName}
            size="lg"
          />
          <div className="flex flex-wrap gap-2">
          <StatusBadge status={student.status} />
          <RequirePermission permission="students:edit">
            <Button asChild variant="outline" size="sm">
              <Link to={`/students/${student.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </RequirePermission>
          <RequirePermission permission="students:soft_delete">
            {student.status === 'Active' && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate
              </Button>
            )}
          </RequirePermission>
          </div>
        </div>
      </PageHeader>

      <div className="flex gap-2 border-b">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === item.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-6">
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">Demographics</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Admission number" value={student.admissionNumber} />
              <DetailField label="Date of birth" value={formatDobDisplay(student.dob)} />
              <DetailField label="Gender" value={student.gender} />
              <DetailField label="Blood group" value={student.bloodGroup?.value} />
              <DetailField label="Category" value={student.admissionCategory?.value} />
              <DetailField label="Medical alerts" value={student.medicalAlerts} />
              <DetailField label="Status reason" value={student.statusReason} />
            </dl>
          </section>

          {canViewFamily && student.familyDetails && (
            <section className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">Family & address</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Father" value={student.familyDetails.fatherName} />
                <DetailField label="Mother" value={student.familyDetails.motherName} />
                <DetailField label="Guardian" value={student.familyDetails.guardianName} />
                <DetailField label="Parent status" value={student.familyDetails.parentStatus} />
                <DetailField
                  label="Annual income"
                  value={
                    student.familyDetails.annualIncome != null
                      ? `₹${student.familyDetails.annualIncome}`
                      : null
                  }
                />
                <DetailField label="Primary contact" value={student.familyDetails.primaryContact} />
                <DetailField label="House details" value={student.familyDetails.houseDetails} />
                <DetailField label="Village / town" value={student.familyDetails.villageTown} />
                <DetailField label="Taluk / mandal" value={student.familyDetails.talukMandal} />
                <DetailField label="District" value={student.familyDetails.district} />
                <DetailField label="State" value={student.familyDetails.state} />
                <DetailField label="Pincode" value={student.familyDetails.pincode} />
              </dl>
            </section>
          )}

          {!canViewFamily && (
            <PlaceholderPanel
              title="Family details hidden"
              description="Your role can view basic student profiles only. Family and income information is not shown."
            />
          )}
        </div>
      )}

      {tab === 'documents' && hasPermission('documents:view') && (
        <StudentDocumentsTab studentId={student.id} />
      )}

      {tab === 'avatar' && (
        <StudentAvatarPanel
          studentId={student.id}
          firstName={student.firstName}
          lastName={student.lastName}
          photoUrl={student.photoUrl}
          canEdit={hasPermission('students:edit')}
        />
      )}

      <DeactivateStudentDialog
        studentId={student.id}
        studentName={displayName}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
    </div>
  );
}
