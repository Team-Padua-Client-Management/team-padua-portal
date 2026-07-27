import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateAdaPdfFromTemplate(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  const isBdo = record.bank_type === 'BDO';
  const templatePath = isBdo ? '/forms/ADA_BDO.pdf' : '/forms/ADA_BPI.pdf';

  const templatePdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (!page1) return pdfDoc.save();

  if (isBdo) {
    // BDO Approximate Coordinates
    // Account name
    page1.drawText(clientName || '', { x: 50, y: 672, size: 10, font });
    // Enrolled Debit Account No
    page1.drawText(record.bank_account_number || '', { x: 670, y: 440, size: 10, font });
    
  } else {
    // BPI Approximate Coordinates
    // Customer's Name
    page1.drawText(clientName || '', { x: 120, y: 742, size: 10, font });
    // Account Number (Boxes)
    if (record.bank_account_number) {
      const acct = record.bank_account_number.padEnd(10, ' ').substring(0, 10);
      for (let i = 0; i < acct.length; i++) {
        page1.drawText(acct[i], { x: 140 + (i * 20), y: 712, size: 10, font }); // Approx boxed spacing
      }
    }
  }

  return pdfDoc.save();
}
