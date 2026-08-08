/**
 * generateAdaPdfFromTemplate.ts
 *
 * Overlays Auto Debit Arrangement (ADA) form data onto the official templates:
 * - /forms/ADA_BDO.pdf
 * - /forms/ADA_BPI.pdf
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

export async function generateAdaPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const isBdo = record.bank_type === 'BDO';
  const templatePath = isBdo ? '/forms/ADA_BDO.pdf' : '/forms/ADA_BPI.pdf';

  const templatePdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (!page1) return pdfDoc.save();

  const policyNum = record.policy_number || record.client?.policy_number || '';
  const dateSubmitted = record.date_submitted || '';
  const dateSigning = record.date_of_signing || dateSubmitted;
  const accountHolder = record.account_name || clientName;
  const mobilePhone = record.mobile_phone || '';
  const placeSigning = record.place_of_signing || '';

  if (isBdo) {
    // BDO Layout
    txt(page1, accountHolder, 50, 672, font, 10);
    txt(page1, policyNum, 50, 640, font, 10);
    txt(page1, record.bank_account_number, 670, 440, font, 10);
    txt(page1, dateSubmitted, 50, 610, font, 10);
    txt(page1, mobilePhone, 50, 580, font, 10);
    txt(page1, placeSigning, 300, 580, font, 10);
  } else {
    // BPI Layout
    txt(page1, accountHolder, 120, 742, font, 10);
    txt(page1, policyNum, 120, 680, font, 10);
    txt(page1, dateSigning, 400, 742, font, 10);
    txt(page1, mobilePhone, 400, 680, font, 10);

    // Boxed Account Number
    if (record.bank_account_number) {
      const acct = record.bank_account_number.padEnd(10, ' ').substring(0, 10);
      for (let i = 0; i < acct.length; i++) {
        txt(page1, acct[i], 140 + (i * 20), 712, font, 10);
      }
    }
  }

  return pdfDoc.save();
}
