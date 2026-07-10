import { ArrowLeft, GraduationCap, HeartPulse, Pencil, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { RequirePermission } from '@/components/RequirePermission';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { StudentDocumentsTab } from '@/features/documents/StudentDocumentsTab';
import { StudentMedicalTab } from '@/features/medical/StudentMedicalTab';
import { StudentRemarksTab } from '@/features/remarks/StudentRemarksTab';
import { DeactivateStudentDialog } from '@/features/students/components/DeactivateStudentDialog';
import { StudentAvatarPanel } from '@/features/students/components/StudentAvatarPanel';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudent } from '@/hooks/useStudent';
import { formatDobDisplay } from '@/lib/date';
import { genderLabel, parentStatusLabel, satsStatusLabel } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

import { pdfExports } from '@/lib/pdfDownload';

type TabKey = 'profile' | 'documents' | 'avatar' | 'remarks' | 'medical';

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '—'}</dd>
    </div>
  );
}

export function StudentDetailPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const backToStudents =
    (location.state as { from?: string } | null)?.from ?? '/students';
  const { hasPermission } = usePermissions();
  const { data: student, isLoading, isError } = useStudent(id);
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<TabKey>(() => {
    if (
      tabParam === 'documents' ||
      tabParam === 'avatar' ||
      tabParam === 'remarks' ||
      tabParam === 'medical'
    ) {
      return tabParam;
    }
    return 'profile';
  });
  const { t: tRemarks } = useTranslation('remarks');
  const { t: tMedical } = useTranslation('medical');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  useEffect(() => {
    if (
      tabParam === 'documents' ||
      tabParam === 'avatar' ||
      tabParam === 'profile' ||
      tabParam === 'remarks' ||
      tabParam === 'medical'
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  if (!id) return <Navigate to="/students" replace />;

  if (isLoading) {
    return <p className="text-muted-foreground">{t('detail.loading')}</p>;
  }

  if (isError || !student) {
    return <Navigate to="/students" replace />;
  }

  const displayName = [student.firstName, student.lastName].filter(Boolean).join(' ');
  const canViewFamily = hasPermission('students:view_sensitive_data') && student.familyDetails;
  const enrollment = student.currentEnrollment;
  const emergencyContact = student.emergencyContacts[0];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'profile', label: t('detail.tabs.profile') },
    ...(hasPermission('documents:view')
      ? [{ key: 'documents' as const, label: t('detail.tabs.documents') }]
      : []),
    ...(hasPermission('remarks:read')
      ? [{ key: 'remarks' as const, label: tRemarks('detail.tabs.remarks') }]
      : []),
    ...(hasPermission('medical:read')
      ? [{ key: 'medical' as const, label: tMedical('detail.tabs.medical') }]
      : []),
    { key: 'avatar', label: t('detail.tabs.photo') },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 px-2">
        <Link to={backToStudents}>
          <ArrowLeft className="size-4" />
          {t('detail.actions.backToStudents')}
        </Link>
      </Button>

      <ModuleHeroBanner
        title={displayName}
        description={t('detail.admissionDescription', { admissionNumber: student.admissionNumber })}
        tagline={t('hero.tagline')}
        icon={GraduationCap}
        gradientClassName={MODULE_GRADIENTS.students}
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={student.status} />
          <RequirePermission permission="students:edit">
            <Button asChild variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30">
              <Link to={`/students/${student.id}/edit`}>
                <Pencil className="size-4" />
                {t('detail.actions.edit')}
              </Link>
            </Button>
          </RequirePermission>
          <RequirePermission permission="medical:read">
            <Button asChild variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30">
              <Link to={`/health/students/${student.id}`}>
                <HeartPulse className="size-4" />
                {t('detail.actions.healthProfile')}
              </Link>
            </Button>
          </RequirePermission>
          <RequirePermission permission="exports:pdf">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30"
              disabled={pdfLoading}
              onClick={() => {
                setPdfLoading(true);
                void pdfExports.studentDetail(student.id).finally(() => setPdfLoading(false));
              }}
            >
              <Download className="size-4" />
              {t('detail.actions.downloadProfilePdf')}
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
                {t('detail.actions.deactivate')}
              </Button>
            )}
          </RequirePermission>
        </div>
      </ModuleHeroBanner>

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
            <h2 className="text-lg font-medium">{t('form.sections.basic')}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label={t('list.columns.admissionNumber')}
                value={student.admissionNumber}
              />
              <DetailField label={t('form.fields.dob')} value={formatDobDisplay(student.dob)} />
              <DetailField
                label={t('form.fields.admissionDate')}
                value={formatDobDisplay(student.admissionDate)}
              />
              <DetailField label={t('form.fields.gender')} value={genderLabel(tc, student.gender)} />
              <DetailField label={t('form.fields.motherTongue')} value={student.motherTongue?.value} />
              <DetailField label={t('form.fields.bloodGroup')} value={student.bloodGroup?.value} />
              <DetailField
                label={t('detail.fields.category')}
                value={student.admissionCategory?.value}
              />
              <DetailField label={t('form.fields.aadhaarNumber')} value={student.aadhaarNumber} />
              <DetailField label={t('form.fields.satsId')} value={student.satsId} />
              <DetailField
                label={t('form.fields.satsTransferStatus')}
                value={satsStatusLabel(t, student.satsTransferStatus)}
              />
              <DetailField label={t('detail.fields.statusReason')} value={student.statusReason} />
            </dl>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('form.sections.academic')}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label={t('form.fields.academicYear')}
                value={enrollment?.academicYear?.value ?? null}
              />
              <DetailField label={t('form.fields.standard')} value={enrollment?.standard?.value ?? null} />
              <DetailField label={t('form.fields.section')} value={enrollment?.section?.value ?? null} />
              <DetailField label={t('form.fields.rollNumber')} value={enrollment?.rollNumber} />
              <DetailField
                label={t('form.fields.previousSchool')}
                value={enrollment?.previousSchool}
              />
              <DetailField
                label={t('form.fields.previousSchoolAddress')}
                value={enrollment?.previousSchoolAddress}
              />
              <DetailField
                label={t('form.fields.lastClassStudied')}
                value={enrollment?.lastClassStudied}
              />
            </dl>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('form.sections.emergency')}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label={t('detail.fields.name')} value={emergencyContact?.contactName} />
              <DetailField
                label={t('form.fields.relationship')}
                value={emergencyContact?.relationship}
              />
              <DetailField label={t('detail.fields.phone')} value={emergencyContact?.phone} />
            </dl>
          </section>

          {canViewFamily && student.socialDetails && (
            <section className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">{t('form.sections.social')}</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label={t('form.fields.religion')} value={student.socialDetails.religion?.value} />
                <DetailField
                  label={t('form.fields.socialCategory')}
                  value={student.socialDetails.socialCategory?.value}
                />
                <DetailField label={t('form.fields.caste')} value={student.socialDetails.caste} />
                <DetailField label={t('form.fields.subCaste')} value={student.socialDetails.subCaste} />
                <DetailField label={t('form.fields.rdNumber')} value={student.socialDetails.rdNumber} />
                <DetailField
                  label={t('form.fields.rdNumberSecondary')}
                  value={student.socialDetails.rdNumberSecondary}
                />
              </dl>
            </section>
          )}

          {canViewFamily && student.familyDetails && (
            <section className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">{t('form.sections.family')}</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label={t('detail.fields.father')} value={student.familyDetails.fatherName} />
                <DetailField label={t('detail.fields.mother')} value={student.familyDetails.motherName} />
                <DetailField label={t('detail.fields.guardian')} value={student.familyDetails.guardianName} />
                <DetailField
                  label={t('form.fields.parentStatus')}
                  value={parentStatusLabel(tc, student.familyDetails.parentStatus)}
                />
                <DetailField
                  label={t('detail.fields.annualIncome')}
                  value={
                    student.familyDetails.annualIncome != null
                      ? `₹${student.familyDetails.annualIncome}`
                      : null
                  }
                />
                <DetailField
                  label={t('form.fields.primaryContact')}
                  value={student.familyDetails.primaryContact}
                />
                <DetailField
                  label={t('form.fields.houseDetails')}
                  value={student.familyDetails.houseDetails}
                />
                <DetailField
                  label={t('form.fields.villageTown')}
                  value={student.familyDetails.villageTown}
                />
                <DetailField
                  label={t('form.fields.talukMandal')}
                  value={student.familyDetails.talukMandal}
                />
                <DetailField label={t('form.fields.district')} value={student.familyDetails.district} />
                <DetailField label={t('form.fields.state')} value={student.familyDetails.state} />
                <DetailField label={t('form.fields.pincode')} value={student.familyDetails.pincode} />
              </dl>
            </section>
          )}

          {!canViewFamily && (
            <PlaceholderPanel
              title={t('detail.hiddenFamily.title')}
              description={t('detail.hiddenFamily.description')}
            />
          )}
        </div>
      )}

      {tab === 'documents' && hasPermission('documents:view') && (
        <StudentDocumentsTab studentId={student.id} />
      )}

      {tab === 'remarks' && hasPermission('remarks:read') && (
        <StudentRemarksTab studentId={student.id} />
      )}

      {tab === 'medical' && hasPermission('medical:read') && (
        <StudentMedicalTab studentId={student.id} />
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
