/**
 * generateAcaPdfFromTemplate.ts
 *
 * Overlays Auto Credit Arrangement (ACA) form data onto the official template /forms/SACA.04.24.pdf
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

function txt(
  page: PDFPage,
  value: string | null | undefined,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0),
): void {
  if (!value) return;
  page.drawText(value, { x, y, size, font, color });
}

export async function generateAcaPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/SACA.04.24.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (page1) {
    const policyNum = record.policy_number || record.client?.policy_number || '';
    const dateSubmitted = record.date_submitted || '';
    const comments = record.comments || '';
    const status = record.status || 'Pending';
    const bankName = record.bank_name || '';
    const accountNumber = record.account_number || '';

    txt(page1, policyNum, 58, 700, font, 10);
    txt(page1, clientName, 260, 700, font, 10);
    txt(page1, dateSubmitted, 58, 660, font, 10);
    txt(page1, status, 260, 660, font, 10);
    txt(page1, bankName, 58, 620, font, 10);
    txt(page1, accountNumber, 260, 620, font, 10);
    txt(page1, comments, 58, 580, font, 9);
  }

  return pdfDoc.save();
}
