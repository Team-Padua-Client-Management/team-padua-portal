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

function checkMark(
  page: PDFPage,
  checked: boolean,
  x: number,
  y: number,
  boldFont: PDFFont,
  size = 10,
): void {
  if (!checked) return;
  page.drawText('X', { x, y, size, font: boldFont, color: rgb(0, 0, 0) });
}

export async function generateAcicrPdfFromTemplate(
  record: any,
  clientNameParts: { last: string; first: string; middle: string },
): Promise<Uint8Array> {
  const res = await fetch('/forms/SACR.08.24.pdf');
  if (!res.ok) {
    throw new Error(`Failed to load PDF template (HTTP ${res.status}). Ensure /public/forms/SACR.08.24.pdf exists.`);
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  
  // This form has 2 pages
  const [embedded1, embedded2] = await pdfDoc.embedPdf(templateBytes, [0, 1]);

  const pg1 = pdfDoc.addPage([embedded1.width, embedded1.height]);
  pg1.drawPage(embedded1, { x: 0, y: 0, width: embedded1.width, height: embedded1.height });

  const pg2 = pdfDoc.addPage([embedded2.width, embedded2.height]);
  pg2.drawPage(embedded2, { x: 0, y: 0, width: embedded2.width, height: embedded2.height });

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const VS = 8.5; // Value size

  // --- PAGE 1 Coordinates (Approximated based on SACR structure) ---
  
  // 1. Policy / Group Contract
  txt(pg1, record.policy_number, 50, 680, regular, VS);
  
  // A. Individual Policy Owner
  txt(pg1, clientNameParts.last, 50, 630, regular, VS);
  txt(pg1, clientNameParts.first, 250, 630, regular, VS);
  txt(pg1, clientNameParts.middle, 500, 630, regular, VS);

  // A. Company / Business Name
  txt(pg1, record.company_name, 50, 580, regular, VS);

  // B. Address Details
  // 2. Permanent Home Address
  txt(pg1, record.permanent_address, 50, 510, regular, VS);
  txt(pg1, record.permanent_zip_code, 470, 510, regular, VS);

  // 4. Present Home Address
  checkMark(pg1, record.same_as_permanent, 50, 480, bold, 10);
  txt(pg1, record.present_address, 50, 460, regular, VS);
  txt(pg1, record.present_zip_code, 470, 460, regular, VS);

  // 6. Work Address
  txt(pg1, record.work_address, 50, 410, regular, VS);
  txt(pg1, record.work_zip_code, 470, 410, regular, VS);

  // 8. Other Address
  txt(pg1, record.other_address, 50, 360, regular, VS);
  txt(pg1, record.other_zip_code, 470, 360, regular, VS);

  // 10. Preferred Mailing Address
  checkMark(pg1, record.preferred_mailing_address === 'Permanent Home Address', 55, 305, bold, 10);
  checkMark(pg1, record.preferred_mailing_address === 'Present Home Address', 55, 292, bold, 10);
  checkMark(pg1, record.preferred_mailing_address === 'Work Address', 165, 305, bold, 10);
  checkMark(pg1, record.preferred_mailing_address === 'Other Address', 165, 292, bold, 10);

  // 11. Update on all policies?
  checkMark(pg1, record.update_all_policies === 'Yes', 345, 292, bold, 10);
  checkMark(pg1, record.update_all_policies === 'No', 390, 292, bold, 10);

  // Contact Information Change To:
  checkMark(pg1, record.contact_change_policy, 50, 248, bold, 10);
  checkMark(pg1, record.contact_change_group, 120, 248, bold, 10);
  checkMark(pg1, record.contact_change_plan, 220, 248, bold, 10);
  checkMark(pg1, record.contact_change_mutual_fund, 300, 248, bold, 10);
  checkMark(pg1, record.contact_change_all, 450, 248, bold, 10);

  // 12. Mobile Phone, 13. Home Phone
  txt(pg1, record.mobile_phone, 60, 210, regular, VS);
  txt(pg1, record.home_phone, 300, 210, regular, VS);

  // 14. Work Phone
  txt(pg1, record.work_phone, 60, 175, regular, VS);

  // --- PAGE 2 Coordinates ---
  
  // 15. Email Address
  txt(pg2, record.email_address, 50, 740, regular, VS);

  // 16. Notifications (Billing)
  checkMark(pg2, record.billing_preference === 'SMS + Electronic Copy', 55, 685, bold, 10);
  checkMark(pg2, record.billing_preference === 'SMS + Printed Copy', 255, 685, bold, 10);
  checkMark(pg2, record.billing_preference === 'Printed Copy only', 455, 685, bold, 10);

  // 17. Regulatory Compliance
  checkMark(pg2, record.citizenship_change === 'Resident', 55, 610, bold, 10);
  txt(pg2, record.citizenship_country, 280, 610, regular, VS);
  checkMark(pg2, record.citizenship_change === 'Non-Resident', 55, 595, bold, 10);
  txt(pg2, record.citizenship_country, 200, 595, regular, VS); // Citizen of
  txt(pg2, record.residence_country, 350, 595, regular, VS);   // Reside in
  checkMark(pg2, record.citizenship_change === 'None', 55, 580, bold, 10);

  // Signatures Area
  txt(pg2, clientNameParts.first + ' ' + clientNameParts.last, 280, 290, regular, VS); // Printed Name
  
  // 28. Receive communication
  checkMark(pg2, record.receive_offers === 'Yes', 225, 140, bold, 10);
  checkMark(pg2, record.receive_offers === 'No', 270, 140, bold, 10);

  return pdfDoc.save();
}
