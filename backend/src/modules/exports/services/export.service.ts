import { getObjectBuffer } from '../../documents/services/presignedUrl.service';
import { studentService } from '../../students/services/student.service';
import { studentListQuerySchema } from '../../students/schemas/student.schemas';
import { remarkService } from '../../remarks/services/remark.service';
import { remarkListQuerySchema } from '../../remarks/schemas/remark.schemas';
import {
  createPdfBuffer,
  sendPdfResponse,
  writePdfHeader,
  writePdfKeyValueGrid,
  writePdfProfileHeader,
  writePdfSectionTitle,
  writePdfTable,
  type PdfTableColumn,
} from '../pdf/pdfBuilder';
import { pdfLabels, type PdfLocale } from '../pdf/pdfLabels';

function formatStudentName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function formatDate(value: string | null | undefined, locale: PdfLocale) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === 'kn' ? 'kn-IN' : 'en-IN');
}

export const exportService = {
  async studentListPdf(
    tenantId: number,
    query: unknown,
    userId: string,
    permissions: string[],
    res: import('express').Response,
    locale: PdfLocale = 'en',
  ) {
    const labels = pdfLabels(locale);
    const parsed = studentListQuerySchema.parse({ ...(query as object), page: 1, limit: 100 });
    const { data } = await studentService.list(tenantId, parsed, userId, permissions);

    const columns: PdfTableColumn[] = [
      { header: labels.admissionNumber, width: 72 },
      { header: labels.name, width: 110 },
      { header: labels.standard, width: 48 },
      { header: labels.socialCategory, width: 72 },
      { header: labels.status, width: 60 },
    ];

    const rows = data.map((student) => [
      student.admissionNumber,
      formatStudentName(student.firstName, student.lastName),
      student.currentEnrollment?.standard?.value ?? '—',
      student.socialCategory?.value ?? '—',
      student.status,
    ]);

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, {
        title: labels.studentList,
        subtitle: parsed.search ? `${labels.search}: ${parsed.search}` : undefined,
        locale,
      });
      writePdfTable(doc, columns, rows);
    });

    sendPdfResponse(res, buffer, `students-${Date.now()}.pdf`);
  },

  async studentDetailPdf(
    tenantId: number,
    studentId: string,
    userId: string,
    permissions: string[],
    res: import('express').Response,
    locale: PdfLocale = 'en',
  ) {
    const labels = pdfLabels(locale);
    const student = await studentService.getById(studentId, tenantId, userId, permissions);
    const enrollment = student.currentEnrollment;
    const emergency = student.emergencyContacts[0];
    const displayName = formatStudentName(student.firstName, student.lastName);
    const socialDetails = 'socialDetails' in student ? student.socialDetails : undefined;
    const familyDetails = 'familyDetails' in student ? student.familyDetails : undefined;

    const photoBuffer = student.photoUrl ? await getObjectBuffer(student.photoUrl) : null;

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, {
        title: labels.studentProfile,
        subtitle: labels.studentProfileSubtitle,
        locale,
      });

      writePdfProfileHeader(doc, {
        name: displayName,
        subtitle: `${labels.admissionNumber}: ${student.admissionNumber}`,
        photoBuffer,
        noPhotoLabel: labels.noPhoto,
      });

      writePdfSectionTitle(doc, labels.sections.basic);
      writePdfKeyValueGrid(doc, [
        { label: labels.admissionNumber, value: student.admissionNumber },
        { label: labels.dob, value: formatDate(student.dob, locale) },
        { label: labels.admissionDate, value: formatDate(student.admissionDate, locale) },
        { label: labels.gender, value: student.gender },
        { label: labels.motherTongue, value: student.motherTongue?.value ?? '—' },
        { label: labels.bloodGroup, value: student.bloodGroup?.value ?? '—' },
        { label: labels.category, value: student.admissionCategory?.value ?? '—' },
        { label: labels.status, value: student.status },
        { label: labels.aadhaarNumber, value: student.aadhaarNumber ?? '—' },
        { label: labels.satsId, value: student.satsId ?? '—' },
        {
          label: labels.satsTransferStatus,
          value: student.satsTransferStatus ?? '—',
        },
        { label: labels.statusReason, value: student.statusReason ?? '—' },
      ]);

      writePdfSectionTitle(doc, labels.sections.academic);
      writePdfKeyValueGrid(doc, [
        { label: labels.academicYear, value: enrollment?.academicYear?.value ?? '—' },
        { label: labels.standard, value: enrollment?.standard?.value ?? '—' },
        { label: labels.section, value: enrollment?.section?.value ?? '—' },
        { label: labels.rollNumber, value: enrollment?.rollNumber ?? '—' },
        { label: labels.previousSchool, value: enrollment?.previousSchool ?? '—' },
        {
          label: labels.previousSchoolAddress,
          value: enrollment?.previousSchoolAddress ?? '—',
        },
        { label: labels.lastClassStudied, value: enrollment?.lastClassStudied ?? '—' },
      ]);

      writePdfSectionTitle(doc, labels.sections.emergency);
      writePdfKeyValueGrid(doc, [
        { label: labels.name, value: emergency?.contactName ?? '—' },
        { label: labels.relationship, value: emergency?.relationship ?? '—' },
        { label: labels.phone, value: emergency?.phone ?? '—' },
      ]);

      if (socialDetails) {
        writePdfSectionTitle(doc, labels.sections.social);
        writePdfKeyValueGrid(doc, [
          { label: labels.religion, value: socialDetails.religion?.value ?? '—' },
          {
            label: labels.socialCategory,
            value: socialDetails.socialCategory?.value ?? '—',
          },
          { label: labels.caste, value: socialDetails.caste ?? '—' },
          { label: labels.subCaste, value: socialDetails.subCaste ?? '—' },
          { label: labels.rdNumber, value: socialDetails.rdNumber ?? '—' },
          {
            label: labels.rdNumberSecondary,
            value: socialDetails.rdNumberSecondary ?? '—',
          },
        ]);
      }

      if (familyDetails) {
        writePdfSectionTitle(doc, labels.sections.family);
        writePdfKeyValueGrid(doc, [
          { label: labels.father, value: familyDetails.fatherName ?? '—' },
          { label: labels.mother, value: familyDetails.motherName ?? '—' },
          { label: labels.guardian, value: familyDetails.guardianName ?? '—' },
          { label: labels.parentStatus, value: familyDetails.parentStatus },
          {
            label: labels.annualIncome,
            value:
              familyDetails.annualIncome != null ? `₹${familyDetails.annualIncome}` : '—',
          },
          { label: labels.primaryContact, value: familyDetails.primaryContact },
          { label: labels.houseDetails, value: familyDetails.houseDetails ?? '—' },
          { label: labels.villageTown, value: familyDetails.villageTown },
          { label: labels.talukMandal, value: familyDetails.talukMandal },
          { label: labels.district, value: familyDetails.district },
          { label: labels.state, value: familyDetails.state },
          { label: labels.pincode, value: familyDetails.pincode },
        ]);
      }

      writePdfSectionTitle(doc, labels.sections.health);
      writePdfKeyValueGrid(doc, [
        { label: labels.healthStatus, value: student.healthStatus ?? 'healthy' },
        { label: labels.medicalAlerts, value: student.medicalAlerts ?? '—' },
      ]);
    });

    sendPdfResponse(res, buffer, `student-${student.admissionNumber}.pdf`);
  },

  async remarksListPdf(
    tenantId: number,
    query: unknown,
    userId: string,
    res: import('express').Response,
    locale: PdfLocale = 'en',
  ) {
    const labels = pdfLabels(locale);
    const parsed = remarkListQuerySchema.parse({ ...(query as object), page: 1, limit: 100 });
    const { data } = await remarkService.list(tenantId, parsed, userId);

    const columns: PdfTableColumn[] = [
      { header: labels.date, width: 75 },
      { header: labels.student, width: 110 },
      { header: labels.type, width: 65 },
      { header: labels.title, width: 150 },
    ];

    const rows = data.map((remark) => [
      new Date(remark.createdAt).toLocaleDateString('en-IN'),
      formatStudentName(remark.student.firstName, remark.student.lastName),
      remark.remarkType.value,
      remark.title,
    ]);

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, { title: labels.remarks, locale });
      writePdfTable(doc, columns, rows);
    });

    sendPdfResponse(res, buffer, `remarks-${Date.now()}.pdf`);
  },
};
