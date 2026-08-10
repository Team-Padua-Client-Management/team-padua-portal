/**
 * generateAcicrPdfFromTemplate.ts
 *
 * Fills the official ACICR (Address and Contact Information Change Request) AcroForm PDF
 * template using pdf-lib, with uppercase text normalization, N/A empty field handling,
 * DD-MMM-YYYY date formatting, and image signature embedding.
 */

import { PDFDocument, PDFForm, PDFPage, StandardFonts } from 'pdf-lib';

function pdfValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string' && value.trim() === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'YES' : 'NO';
  return String(value).trim().toUpperCase();
}

function formatDateStandard(isoDate: string | null | undefined): string {
  if (!isoDate || typeof isoDate !== 'string' || isoDate.trim() === '') return 'N/A';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate.toUpperCase();
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parts[2];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return isoDate.toUpperCase();
  return `${day.padStart(2, '0')}-${months[monthNum - 1]}-${year}`;
}

function setTxt(form: PDFForm, name: string, value: string | null | undefined, fontSize?: number) {
  const formatted = pdfValue(value);
  try {
    const field = form.getTextField(name);
    if (fontSize) {
      try {
        field.setFontSize(fontSize);
      } catch { }
    }
    field.setText(formatted);
  } catch (e) {
    console.warn(`Text field "${name}" not found in ACICR PDF`);
  }
}

function setCheck(form: PDFForm, name: string, checked: boolean) {
  try {
    const field = form.getCheckBox(name);
    if (checked) field.check();
    else field.uncheck();
  } catch (e) {
    console.warn(`Checkbox "${name}" not found in ACICR PDF`);
  }
}

async function embedSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  base64: string | null | undefined,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number
): Promise<void> {
  if (!base64 || typeof base64 !== 'string') return;
  try {
    const parts = base64.split(',');
    if (parts.length < 2) return;
    const header = parts[0];
    const data = parts[1];
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const image = header.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
    const { width: w, height: h } = image.scaleToFit(areaW, areaH);
    page.drawImage(image, {
      x: areaX + (areaW - w) / 2,
      y: areaY + (areaH - h) / 2,
      width: w,
      height: h,
    });
  } catch {
    // Silently ignore invalid or unsupported image data
  }
}

export async function generateAcicrPdfFromTemplate(
  record: any,
  clientNameParts: { last: string; first: string; middle: string }
): Promise<Uint8Array> {
  const res = await fetch('/forms/ACICR.pdf');
  if (!res.ok) {
    throw new Error(`Failed to load ACICR PDF template. Ensure /public/forms/ACICR.pdf exists.`);
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  const pg2 = pages.length > 1 ? pages[1] : pages[0];

  // Embed uniform font (Helvetica)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ─── PAGE 1: Section A & Section B ──────────────────────────────────────────

  // Policy / Group Contract
  setTxt(form, 'a', record.policy_number, 9);

  // Individual Planholder Name
  const lastName = record.last_name || clientNameParts.last || '';
  const firstName = record.first_name || clientNameParts.first || '';
  const mi = record.middle_initial || (clientNameParts.middle ? clientNameParts.middle.charAt(0) : '');

  setTxt(form, 'a1', lastName, 9);
  setTxt(form, 'a2', firstName, 9);
  setTxt(form, 'a3', mi, 9);

  // Addresses (Address fields can hold long strings or N/A; use 8.5pt font size)
  setTxt(form, 'a5', record.permanent_address, 8.5);
  setTxt(form, 'a9', record.permanent_zip_code, 8.5);

  const presentAddr = record.same_as_permanent ? record.permanent_address : record.present_address;
  const presentZip = record.same_as_permanent ? record.permanent_zip_code : record.present_zip_code;
  setTxt(form, 'a6', presentAddr, 8.5);
  setTxt(form, 'a10', presentZip, 8.5);

  setTxt(form, 'a7', record.work_address, 8.5);
  setTxt(form, 'a11', record.work_zip_code, 8.5);

  setTxt(form, 'a8', record.other_address, 8.5);
  setTxt(form, 'a12', record.other_zip_code, 8.5);

  // Preferred Mailing Address Checkboxes
  setCheck(form, 'Check Box6', record.preferred_mailing_permanent === true);
  setCheck(form, 'Check Box61', record.preferred_mailing_present === true);
  setCheck(form, 'Check Box62', record.preferred_mailing_work === true);
  setCheck(form, 'Check Box63', record.preferred_mailing_other === true);

  // Update All Existing Accounts?
  const updateAccounts = record.update_existing_accounts || (record.update_all_policies === 'Yes' ? 'yes' : 'no');
  setCheck(form, 'Check Box64', updateAccounts === 'yes');
  setCheck(form, 'Check Box65', updateAccounts === 'no');

  // Contact Information Change To
  setCheck(form, 'Check Box66', Boolean(record.change_policy || record.contact_change_policy));
  setCheck(form, 'Check Box67', Boolean(record.change_group_contract || record.contact_change_group));
  setCheck(form, 'Check Box68', Boolean(record.change_plan || record.contact_change_plan));
  setCheck(form, 'Check Box69', Boolean(record.change_mutual_fund || record.contact_change_mutual_fund));
  setCheck(form, 'Check Box610', Boolean(record.change_all || record.contact_change_all));

  // Phone Numbers
  setTxt(form, 'a13', record.mobile_phone);
  setTxt(form, 'a14', record.home_phone);
  setTxt(form, 'a15', record.work_phone);

  // ─── PAGE 2: Section B Continuation, Section C & Section D ─────────────────

  // Email Address
  setTxt(form, 'a16', record.email_address, 8.5);

  // Billing Statement Delivery
  const billingVal = record.billing_statement_delivery ||
    (record.billing_preference === 'SMS + Electronic Copy' ? 'sms_electronic' :
      record.billing_preference === 'SMS + Printed Copy' ? 'sms_printed' :
        record.billing_preference === 'Printed Copy only' ? 'printed_only' : '');

  setCheck(form, 'Check Box611', billingVal === 'sms_electronic');
  setCheck(form, 'Check Box612', billingVal === 'sms_printed');
  setCheck(form, 'Check Box613', billingVal === 'printed_only');

  // Regulatory Compliance (Citizenship / Residence) -> mapped to field 'a4' in ACICR.pdf
  const citChange = record.citizenship_change;
  setCheck(form, 'Check Box614', citChange === 'resident_citizen' || citChange === 'Resident');
  setCheck(form, 'Check Box615', citChange === 'non_resident_citizen' || citChange === 'Non-Resident');
  setCheck(form, 'Check Box616', citChange === 'none' || citChange === 'None');

  const citCountry = record.citizenship_country || '';
  const resCountry = record.legal_residence_country || record.residence_country || '';
  const citResText = citChange === 'non_resident_citizen'
    ? [citCountry, resCountry].filter(Boolean).join(' / ')
    : citCountry || resCountry;

  // Actual field name in ACICR.pdf for Question 17 text is 'a4'
  setTxt(form, 'a4', citResText, 8.5);

  // Printed Names (Section D Official ACICR fields)
  const ownerPrintedName = record.policy_owner_printed_name || `${firstName} ${lastName}`.trim();
  setTxt(form, 'a17', ownerPrintedName, 8.5);
  setTxt(form, 'a18', record.authorized_signatory_1_name, 8.5);
  setTxt(form, 'a19', record.authorized_signatory_2_name, 8.5);
  setTxt(form, 'a20', record.witness_name || record.primary_witness_name, 8.5);
  setTxt(form, 'a21', record.place_of_signing, 8.5);

  // Field 27: Date of Signing (filled into character boxes q, w, e, r, t, y, u, i, o in ACICR.pdf)
  if (record.date_of_signing) {
    const parts = record.date_of_signing.split('-');
    if (parts.length === 3) {
      const dDate = `${parts[2]}${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][parseInt(parts[1], 10) - 1] || ''}${parts[0]}`;
      const chars = dDate.split('');
      const dateFields = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o'];
      for (let i = 0; i < Math.min(chars.length, dateFields.length); i++) {
        setTxt(form, dateFields[i], chars[i], 8.5);
      }
    }
  }

  // Field 28: Marketing Consent
  const mConsent = record.marketing_consent || (record.receive_offers === 'Yes' ? 'yes' : 'no');
  setCheck(form, 'Check Box617', mConsent === 'yes');
  setCheck(form, 'Check Box618', mConsent === 'no');

  // Enforce UNIFORM 8.5pt font size across all AcroForm text fields
  const fields = form.getFields();
  for (const f of fields) {
    if ('setFontSize' in f && typeof (f as any).setFontSize === 'function') {
      try {
        (f as any).setFontSize(8.5);
      } catch {
        // ignore
      }
    }
  }

  // Update font appearances using embedded Helvetica
  try {
    form.updateFieldAppearances(font);
  } catch (e) {
    console.warn('Could not update font appearances:', e);
  }

  // Embed uploaded signatures onto Page 2 per official ACICR table structure:
  // Field 18: Signature of Policy Owner/Planholder/Investor -> y ~ 305
  // Field 20: Signature of Authorized Signatory #1 -> y ~ 230
  // Field 22: Signature of Authorized Signatory #2 -> y ~ 160
  // Field 24: Signature of Witness -> y ~ 100
  if (pg2) {
    await embedSignature(pdfDoc, pg2, record.policy_owner_signature, 50, 305, 180, 35);
    await embedSignature(pdfDoc, pg2, record.authorized_signatory_1_signature, 50, 230, 180, 35);
    await embedSignature(pdfDoc, pg2, record.authorized_signatory_2_signature, 50, 160, 180, 35);
    await embedSignature(pdfDoc, pg2, record.witness_signature || record.primary_witness_signature, 50, 100, 180, 35);
  }

  // Flatten the AcroForm controls into final PDF graphics
  form.flatten();

  return pdfDoc.save();
}
