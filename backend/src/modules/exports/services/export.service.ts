import { studentService } from '../../students/services/student.service';
import { studentListQuerySchema } from '../../students/schemas/student.schemas';
import { remarkService } from '../../remarks/services/remark.service';
import { remarkListQuerySchema } from '../../remarks/schemas/remark.schemas';
import {
  createPdfBuffer,
  sendPdfResponse,
  writePdfHeader,
  writePdfKeyValues,
  writePdfTable,
  type PdfTableColumn,
} from '../pdf/pdfBuilder';
import { pdfLabels, type PdfLocale } from '../pdf/pdfLabels';

function formatStudentName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
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
      { header: labels.admissionNumber, width: 80 },
      { header: labels.name, width: 140 },
      { header: labels.standard, width: 60 },
      { header: labels.status, width: 70 },
    ];

    const rows = data.map((student) => [
      student.admissionNumber,
      formatStudentName(student.firstName, student.lastName),
      student.currentEnrollment?.standard?.value ?? '—',
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

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, {
        title: labels.studentProfile,
        subtitle: student.admissionNumber,
        locale,
      });
      writePdfKeyValues(doc, [
        { label: labels.name, value: formatStudentName(student.firstName, student.lastName) },
        { label: labels.gender, value: student.gender },
        { label: labels.dob, value: student.dob },
        { label: labels.status, value: student.status },
        { label: labels.standard, value: enrollment?.standard?.value ?? '—' },
        { label: labels.section, value: enrollment?.section?.value ?? '—' },
        { label: labels.rollNumber, value: enrollment?.rollNumber ?? '—' },
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
