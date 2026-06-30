import PDFDocument from 'pdfkit';
import type { Response } from 'express';

export type PdfTableColumn = {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
};

export type PdfDocumentMeta = {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  tenantName?: string;
};

export type PdfTableRow = string[];

const PAGE_MARGIN = 48;
const ROW_HEIGHT = 20;
const HEADER_BG = '#f3f4f6';

export function createPdfBuffer(
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

export function writePdfHeader(doc: PDFKit.PDFDocument, meta: PdfDocumentMeta) {
  doc.fontSize(18).font('Helvetica-Bold').text(meta.title, { align: 'left' });
  if (meta.subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').fillColor('#4b5563').text(meta.subtitle);
  }
  const generated = meta.generatedAt ?? new Date();
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .fillColor('#6b7280')
    .text(`Generated: ${generated.toLocaleString('en-IN')}`, { align: 'left' });
  if (meta.tenantName) {
    doc.text(meta.tenantName, { align: 'left' });
  }
  doc.moveDown(1);
  doc.fillColor('#000000');
}

export function writePdfTable(
  doc: PDFKit.PDFDocument,
  columns: PdfTableColumn[],
  rows: PdfTableRow[],
) {
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const startX = doc.page.margins.left;
  let y = doc.y;

  const drawHeader = () => {
    let x = startX;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.rect(startX, y, tableWidth, ROW_HEIGHT).fill(HEADER_BG);
    doc.fillColor('#111827');
    for (const col of columns) {
      doc.text(col.header, x + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
      });
      x += col.width;
    }
    y += ROW_HEIGHT;
    doc.fillColor('#000000');
  };

  drawHeader();

  doc.font('Helvetica').fontSize(9);
  for (const row of rows) {
    if (y + ROW_HEIGHT > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    let x = startX;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const cell = row[i] ?? '';
      doc.text(cell, x + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
      });
      x += col.width;
    }
    y += ROW_HEIGHT;
    doc
      .moveTo(startX, y)
      .lineTo(startX + tableWidth, y)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();
  }

  doc.y = y + 8;
}

export function writePdfKeyValues(
  doc: PDFKit.PDFDocument,
  pairs: Array<{ label: string; value: string }>,
) {
  doc.fontSize(10).font('Helvetica-Bold');
  for (const pair of pairs) {
    doc.font('Helvetica-Bold').text(`${pair.label}: `, { continued: true });
    doc.font('Helvetica').text(pair.value || '—');
  }
  doc.moveDown(0.5);
}

export function sendPdfResponse(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
