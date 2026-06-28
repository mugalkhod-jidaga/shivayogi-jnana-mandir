import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { AcademicPlacementFields } from '@/features/students/components/AcademicPlacementFields';
import { DemographicsFields } from '@/features/students/components/DemographicsFields';
import { EmergencyContactFields } from '@/features/students/components/EmergencyContactFields';
import { FamilyDetailsFields } from '@/features/students/components/FamilyDetailsFields';
import {
  buildCreateStudentPayload,
  buildUpdateStudentPayload,
  createStudentFormSchema,
  defaultAcademicPlacement,
  defaultEmergencyContact,
  defaultFamilyDetails,
  updateStudentFormSchema,
  type CreateStudentFormValues,
  type UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';
import { useLookups } from '@/hooks/useLookups';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateStudent, useStudent, useUpdateStudent } from '@/hooks/useStudent';
import { formatDobDisplay } from '@/lib/date';
import { phoneToDisplay } from '@/lib/phone';
import { ApiError } from '@/lib/api';

export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { hasPermission } = usePermissions();
  const canViewFamily = hasPermission('students:view_sensitive_data');
  const { currentAcademicYear } = useLookups();

  const { data: student, isLoading } = useStudent(isEdit ? id : undefined);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(id ?? '');

  const createForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      gender: 'Male',
      admissionDate: formatDobDisplay(new Date().toISOString().slice(0, 10)),
      academicPlacement: defaultAcademicPlacement,
      emergencyContacts: [defaultEmergencyContact],
      familyDetails: defaultFamilyDetails,
    },
  });

  const editForm = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentFormSchema),
    defaultValues: {
      gender: 'Male',
      academicPlacement: defaultAcademicPlacement,
      emergencyContacts: [defaultEmergencyContact],
    },
  });

  const [bloodGroupId, setBloodGroupId] = useState('');
  const [admissionCategoryId, setAdmissionCategoryId] = useState('');
  const [motherTongueId, setMotherTongueId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [standardId, setStandardId] = useState('');
  const [sectionId, setSectionId] = useState('');

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
      academicPlacement: {
        rollNumber: student.currentEnrollment?.rollNumber ?? '',
        previousSchool: student.currentEnrollment?.previousSchool ?? '',
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
  }, [isEdit, student, editForm]);

  if (isEdit && !hasPermission('students:edit')) {
    return <Navigate to={id ? `/students/${id}` : '/students'} replace />;
  }

  if (!isEdit && !hasPermission('students:create')) {
    return <Navigate to="/students" replace />;
  }

  if (isEdit && isLoading) {
    return <p className="text-muted-foreground">Loading student…</p>;
  }

  if (isEdit && !student) {
    return <Navigate to="/students" replace />;
  }

  const lookupIds = {
    bloodGroupId,
    admissionCategoryId,
    motherTongueId,
    academicYearId,
    standardId,
    sectionId: sectionId || undefined,
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    if (!canViewFamily) {
      toast.error('You do not have permission to create students with family details');
      return;
    }

    if (!academicYearId || !standardId) {
      toast.error('Academic year and standard are required');
      return;
    }

    try {
      const payload = buildCreateStudentPayload(values, lookupIds);
      const created = await createStudent.mutateAsync(payload);
      toast.success('Student created. Add documents and photo from the student profile.');
      navigate(`/students/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not create student');
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!academicYearId || !standardId) {
      toast.error('Academic year and standard are required');
      return;
    }

    try {
      const payload = buildUpdateStudentPayload(values, lookupIds, canViewFamily);
      const updated = await updateStudent.mutateAsync(payload);
      toast.success('Student updated');
      navigate(`/students/${updated.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update student');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit student' : 'Add student'}
        description={
          isEdit
            ? `Update record for ${student?.admissionNumber}`
            : 'Create a student record. Documents and photo can be added after saving.'
        }
      >
        <Button asChild variant="outline">
          <Link to={isEdit ? `/students/${id}` : '/students'}>Cancel</Link>
        </Button>
      </PageHeader>

      <form className="space-y-8" onSubmit={isEdit ? onUpdate : onCreate}>
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">Basic information</h2>
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
                createRegister={createForm.register}
                errors={createForm.formState.errors}
                {...demographicsProps}
                isCreate
              />
            )}
          </div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">Academic placement</h2>
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
          <h2 className="text-lg font-medium">Emergency contact</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A separate emergency contact in addition to the family primary contact.
          </p>
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
            <h2 className="text-lg font-medium">Family & address</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sensitive family and income details — visible only to authorized staff.
            </p>
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
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
