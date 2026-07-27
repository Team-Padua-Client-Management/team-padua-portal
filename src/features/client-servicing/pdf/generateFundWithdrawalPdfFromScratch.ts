import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateFundWithdrawalPdfFromScratch(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 Size

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Draw Header Banner
  page.drawRectangle({
    x: 20,
    y: 770,
    width: 555,
    height: 50,
    color: rgb(0.92, 0.72, 0.16) // Gold color
  });

  page.drawText('Variable Life Insurance - Request for Fund Withdrawal', {
    x: 35,
    y: 788,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  // Section 1: General Information
  page.drawRectangle({
    x: 20,
    y: 742,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('1  General Information', {
    x: 30,
    y: 747,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  // Grid
  let y = 730;
  const drawRow = (label1: string, val1: string, label2: string, val2: string, height = 35) => {
    page.drawRectangle({
      x: 20,
      y: y - height,
      width: 555,
      height: height,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1
    });
    page.drawLine({
      start: { x: 300, y: y },
      end: { x: 300, y: y - height },
      color: rgb(0.8, 0.8, 0.8),
      thickness: 1
    });

    page.drawText(label1, { x: 25, y: y - 12, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(val1 || 'N/A', { x: 25, y: y - 26, size: 10, font, color: rgb(0, 0, 0) });

    page.drawText(label2, { x: 305, y: y - 12, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(val2 || 'N/A', { x: 305, y: y - 26, size: 10, font, color: rgb(0, 0, 0) });

    y -= height;
  };

  drawRow('Policy Owner (Last Name, First Name, M.I.)', clientName, 'Policy Number', record.client?.policy_number || 'N/A');
  drawRow('Citizenship', 'Filipino', 'Country/ies of Legal Residence', 'Philippines');
  drawRow('Date Submitted', record.date_submitted || 'N/A', 'Date of Birth', clientDob || 'N/A');
  drawRow('Comments / Remarks', record.comments || 'No comments', 'Status', record.status || 'Pending', 50);

  // Section 2: Request Details
  y -= 15;
  page.drawRectangle({
    x: 20,
    y: y - 20,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('2  Request Details', {
    x: 30,
    y: y - 15,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });
  y -= 20;

  // Request Details box
  page.drawRectangle({
    x: 20,
    y: y - 120,
    width: 555,
    height: 120,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  page.drawText('Currency of Withdrawal:', { x: 30, y: y - 25, size: 9, font: boldFont });
  page.drawRectangle({ x: 30, y: y - 45, width: 12, height: 12, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  page.drawText('Php (Philippine Peso)', { x: 48, y: y - 43, size: 9, font });

  // Draw check if it's Php
  page.drawText('X', { x: 32, y: y - 43, size: 9, font: boldFont });

  page.drawText('Withdrawal Amount:', { x: 30, y: y - 75, size: 9, font: boldFont });
  const formattedAmount = 'PHP ' + (record.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  page.drawText(formattedAmount, { x: 30, y: y - 95, size: 14, font: boldFont, color: rgb(0.12, 0.24, 0.48) });

  y -= 120;

  // Section 3: Acknowledgement and Agreement
  y -= 25;
  page.drawRectangle({
    x: 20,
    y: y - 20,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('3  Acknowledgement and Agreement', {
    x: 30,
    y: y - 15,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });
  y -= 20;

  page.drawRectangle({
    x: 20,
    y: y - 150,
    width: 555,
    height: 150,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  const agreementText = [
    '1. The information and details provided above are true, accurate and complete.',
    '2. I/We understand that any withdrawal from the fund value will reduce the account value and death benefits.',
    '3. This request is subject to the terms and conditions of the insurance contract/policy.',
    '4. Processing charges and transaction fees may apply and will be deducted from the fund value.',
  ];

  let textY = y - 25;
  for (const line of agreementText) {
    page.drawText(line, { x: 30, y: textY, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    textY -= 15;
  }

  // Signatures
  page.drawText('Signature of Policy Owner', { x: 30, y: y - 120, size: 8, font: boldFont });
  page.drawLine({ start: { x: 30, y: y - 105 }, end: { x: 220, y: y - 105 }, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('Signature of Witness', { x: 330, y: y - 120, size: 8, font: boldFont });
  page.drawLine({ start: { x: 330, y: y - 105 }, end: { x: 520, y: y - 105 }, color: rgb(0.5, 0.5, 0.5) });

  y -= 150;

  return pdfDoc.save();
}
