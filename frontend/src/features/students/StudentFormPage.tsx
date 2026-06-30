import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { AcademicPlacementFields } from '@/features/students/components/AcademicPlacementFields';
import { DemographicsFields } from '@/features/students/components/DemographicsFields';
import { EmergencyContactFields } from '@/features/students/components/EmergencyContactFields';
import { FamilyDetailsFields } from '@/features/students/components/FamilyDetailsFields';
import { SocialDetailsFields } from '@/features/students/components/SocialDetailsFields';
import {
  buildCreateStudentPayload,
  buildUpdateStudentPayload,
  defaultAcademicPlacement,
  defaultEmergencyContact,
  defaultFamilyDetails,
  defaultSocialDetails,
  type CreateStudentFormValues,
  type UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';
import { useStudentFormSchemas } from '@/hooks/useStudentFormSchemas';
import { useLookups } from '@/hooks/useLookups';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateStudent, useNextAdmissionNumber, useStudent, useUpdateStudent } from '@/hooks/useStudent';
import { formatDobDisplay } from '@/lib/date';
import { phoneToDisplay } from '@/lib/phone';
import { ApiError } from '@/lib/api';

export function StudentFormPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { hasPermission } = usePermissions();
  const canViewFamily = hasPermission('students:view_sensitive_data');
  const { currentAcademicYear } = useLookups();
  const { createStudentFormSchema, updateStudentFormSchema } = useStudentFormSchemas();

  const { data: student, isLoading } = useStudent(isEdit ? id : undefined);
  const { data: nextAdmission, isLoading: isLoadingAdmissionNumber } = useNextAdmissionNumber(
    !isEdit,
  );
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(id ?? '');

  const createForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      gender: 'Male',
      admissionDate: formatDobDisplay(new Date().toISOString().slice(0, 10)),
      academicPlacement: defaultAcademicPlacement,
      emergencyContacts: [defaultEmergencyContact],
      socialDetails: defaultSocialDetails,
      familyDetails: defaultFamilyDetails,
    },
  });

  const editForm = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentFormSchema),
    defaultValues: {
      gender: 'Male',
      academicPlacement: defaultAcademicPlacement,
      emergencyContacts: [defaultEmergencyContact],
      socialDetails: defaultSocialDetails,
    },
  });

  const [bloodGroupId, setBloodGroupId] = useState('');
  const [admissionCategoryId, setAdmissionCategoryId] = useState('');
  const [motherTongueId, setMotherTongueId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [standardId, setStandardId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [religionId, setReligionId] = useState('');
  const [socialCategoryId, setSocialCategoryId] = useState('');

  useEffect(() => {
    if (!isEdit && currentAcademicYear && !academicYearId) {
      setAcademicYearId(String(currentAcademicYear.id));
    }
  }, [isEdit, currentAcademicYear, academicYearId]);

  useEffect(() => {
    if (!isEdit || !student) return;

    editForm.reset({
      firstName: student.firstName,
      lastName: student.lastName ?? '',
      dob: formatDobDisplay(student.dob),
      gender: student.gender,
      admissionDate: formatDobDisplay(student.admissionDate),
      aadhaarNumber: student.aadhaarNumber?.replace(/\D/g, '').length === 12
        ? student.aadhaarNumber.replace(/\D/g, '')
        : '',
      satsId: student.satsId?.replace(/\D/g, '').length === 9
        ? student.satsId.replace(/\D/g, '')
        : '',
      satsTransferStatus: student.satsTransferStatus ?? undefined,
      academicPlacement: {
        rollNumber: student.currentEnrollment?.rollNumber ?? '',
        previousSchool: student.currentEnrollment?.previousSchool ?? '',
        previousSchoolAddress: student.currentEnrollment?.previousSchoolAddress ?? '',
        lastClassStudied: student.currentEnrollment?.lastClassStudied ?? '',
      },
      emergencyContacts:
        student.emergencyContacts.length > 0
          ? student.emergencyContacts.map((contact) => ({
              contactName: contact.contactName,
              relationship: contact.relationship,
              phone: phoneToDisplay(contact.phone),
            }))
          : [defaultEmergencyContact],
      familyDetails: student.familyDetails
        ? {
            fatherName: student.familyDetails.fatherName ?? '',
            motherName: student.familyDetails.motherName ?? '',
            guardianName: student.familyDetails.guardianName ?? '',
            parentStatus: student.familyDetails.parentStatus,
            annualIncome:
              student.familyDetails.annualIncome != null
                ? String(student.familyDetails.annualIncome)
                : '',
            primaryContact: phoneToDisplay(student.familyDetails.primaryContact),
            houseDetails: student.familyDetails.houseDetails ?? '',
            villageTown: student.familyDetails.villageTown,
            talukMandal: student.familyDetails.talukMandal,
            district: student.familyDetails.district,
            state: student.familyDetails.state,
            pincode: student.familyDetails.pincode,
          }
        : defaultFamilyDetails,
      socialDetails: student.socialDetails
        ? {
            caste: student.socialDetails.caste ?? '',
            subCaste: student.socialDetails.subCaste ?? '',
            rdNumber: student.socialDetails.rdNumber ?? '',
            rdNumberSecondary: student.socialDetails.rdNumberSecondary ?? '',
          }
        : defaultSocialDetails,
    });

    setBloodGroupId(student.bloodGroup ? String(student.bloodGroup.id) : '');
    setAdmissionCategoryId(
      student.admissionCategory ? String(student.admissionCategory.id) : '',
    );
    setMotherTongueId(student.motherTongue ? String(student.motherTongue.id) : '');
    setAcademicYearId(
      student.currentEnrollment?.academicYear
        ? String(student.currentEnrollment.academicYear.id)
        : '',
    );
    setStandardId(
      student.currentEnrollment?.standard ? String(student.currentEnrollment.standard.id) : '',
    );
    setSectionId(
      student.currentEnrollment?.section ? String(student.currentEnrollment.section.id) : '',
    );
    setReligionId(student.socialDetails?.religion ? String(student.socialDetails.religion.id) : '');
    setSocialCategoryId(
      student.socialDetails?.socialCategory
        ? String(student.socialDetails.socialCategory.id)
        : '',
    );
  }, [isEdit, student, editForm]);

  if (isEdit && !hasPermission('students:edit')) {
    return <Navigate to={id ? `/students/${id}` : '/students'} replace />;
  }

  if (!isEdit && !hasPermission('students:create')) {
    return <Navigate to="/students" replace />;
  }

  if (isEdit && isLoading) {
    return <p className="text-muted-foreground">{t('form.loadingStudent')}</p>;
  }

  if (isEdit && !student) {
    return <Navigate to="/students" replace />;
  }

  const lookupIds = {
    bloodGroupId,
    admissionCategoryId,
    motherTongueId,
    religionId,
    socialCategoryId,
    academicYearId,
    standardId,
    sectionId: sectionId || undefined,
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    if (!canViewFamily) {
      toast.error(t('form.errors.noFamilyPermission'));
      return;
    }

    if (!academicYearId || !standardId) {
      toast.error(t('form.errors.academicRequired'));
      return;
    }

    try {
      const payload = buildCreateStudentPayload(values, lookupIds);
      const created = await createStudent.mutateAsync(payload);
      toast.success(t('form.createSuccess'));
      navigate(`/students/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('form.errors.createFailed'));
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!academicYearId || !standardId) {
      toast.error(t('form.errors.academicRequired'));
      return;
    }

    try {
      const payload = buildUpdateStudentPayload(values, lookupIds, canViewFamily);
      const updated = await updateStudent.mutateAsync(payload);
      toast.success(t('form.updateSuccess'));
      navigate(`/students/${updated.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('form.errors.updateFailed'));
    }
  });

  const isSubmitting = createStudent.isPending || updateStudent.isPending;

  const demographicsProps = {
    bloodGroupId,
    admissionCategoryId,
    motherTongueId,
    onBloodGroupChange: setBloodGroupId,
    onAdmissionCategoryChange: setAdmissionCategoryId,
    onMotherTongueChange: setMotherTongueId,
  };

  const academicProps = {
    academicYearId,
    standardId,
    sectionId,
    onAcademicYearChange: setAcademicYearId,
    onStandardChange: setStandardId,
    onSectionChange: setSectionId,
  };

  const socialProps = {
    religionId,
    socialCategoryId,
    onReligionChange: setReligionId,
    onSocialCategoryChange: setSocialCategoryId,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? t('form.editTitle') : t('form.addTitle')}
        description={
          isEdit
            ? t('form.editDescription', { admissionNumber: student?.admissionNumber })
            : t('form.addDescription')
        }
      >
        <Button asChild variant="outline">
          <Link to={isEdit ? `/students/${id}` : '/students'}>{tc('actions.cancel')}</Link>
        </Button>
      </PageHeader>

      <form className="space-y-8" onSubmit={isEdit ? onUpdate : onCreate}>
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">{t('form.sections.basic')}</h2>
          <div className="mt-4">
            {isEdit ? (
              <DemographicsFields
                register={editForm.register}
                errors={editForm.formState.errors}
                {...demographicsProps}
              />
            ) : (
              <DemographicsFields
                register={createForm.register}
                errors={createForm.formState.errors}
                {...demographicsProps}
                isCreate
                nextAdmissionNumber={nextAdmission?.admissionNumber}
                isLoadingAdmissionNumber={isLoadingAdmissionNumber}
              />
            )}
          </div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">{t('form.sections.academic')}</h2>
          <div className="mt-4">
            {isEdit ? (
              <AcademicPlacementFields
                register={editForm.register}
                errors={editForm.formState.errors}
                {...academicProps}
              />
            ) : (
              <AcademicPlacementFields
                register={createForm.register}
                errors={createForm.formState.errors}
                {...academicProps}
              />
            )}
          </div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">{t('form.sections.emergency')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('form.hints.emergency')}</p>
          <div className="mt-4">
            {isEdit ? (
              <EmergencyContactFields
                register={editForm.register}
                errors={editForm.formState.errors}
              />
            ) : (
              <EmergencyContactFields
                register={createForm.register}
                errors={createForm.formState.errors}
              />
            )}
          </div>
        </section>

        {canViewFamily && (
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('form.sections.social')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('form.hints.social')}</p>
            <div className="mt-4">
              {isEdit ? (
                <SocialDetailsFields
                  register={editForm.register}
                  errors={editForm.formState.errors}
                  {...socialProps}
                />
              ) : (
                <SocialDetailsFields
                  register={createForm.register}
                  errors={createForm.formState.errors}
                  {...socialProps}
                />
              )}
            </div>
          </section>
        )}

        {canViewFamily && (
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('form.sections.family')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('form.hints.family')}</p>
            <div className="mt-4">
              {isEdit ? (
                <FamilyDetailsFields
                  register={editForm.register}
                  errors={editForm.formState.errors}
                />
              ) : (
                <FamilyDetailsFields
                  register={createForm.register}
                  errors={createForm.formState.errors}
                />
              )}
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? tc('saving')
              : isEdit
                ? tc('actions.saveChanges')
                : t('form.createSubmit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
