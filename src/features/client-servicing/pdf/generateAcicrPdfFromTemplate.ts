/**
 * generateAcicrPdfFromTemplate.ts
 *
 * Fills the official ACICR (Address and Contact Information Change Request) AcroForm PDF
 * template using pdf-lib.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';

function setTxt(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setText(value);
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

function formatAcroDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthStr = months[parseInt(m, 10) - 1] || '';
  return `${d}${monthStr}${y}`;
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

  // ─── PAGE 1: Section A & Section B ──────────────────────────────────────────

  // Policy / Group Contract
  setTxt(form, 'a', record.policy_number);

  // Individual Planholder Name
  const lastName = record.last_name || clientNameParts.last || '';
  const firstName = record.first_name || clientNameParts.first || '';
  const mi = record.middle_initial || (clientNameParts.middle ? clientNameParts.middle.charAt(0) : '');

  setTxt(form, 'a1', lastName);
  setTxt(form, 'a2', firstName);
  setTxt(form, 'a3', mi);

  // Company Name
  setTxt(form, 'a4', record.company_name);

  // Addresses
  setTxt(form, 'a5', record.permanent_address);
  setTxt(form, 'a9', record.permanent_zip_code);

  const presentAddr = record.same_as_permanent ? record.permanent_address : record.present_address;
  const presentZip = record.same_as_permanent ? record.permanent_zip_code : record.present_zip_code;
  setTxt(form, 'a6', presentAddr);
  setTxt(form, 'a10', presentZip);

  setTxt(form, 'a7', record.work_address);
  setTxt(form, 'a11', record.work_zip_code);

  setTxt(form, 'a8', record.other_address);
  setTxt(form, 'a12', record.other_zip_code);

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
  setTxt(form, 'a16', record.email_address);

  // Billing Statement Delivery
  const billingVal = record.billing_statement_delivery ||
    (record.billing_preference === 'SMS + Electronic Copy' ? 'sms_electronic' :
     record.billing_preference === 'SMS + Printed Copy' ? 'sms_printed' :
     record.billing_preference === 'Printed Copy only' ? 'printed_only' : '');

  setCheck(form, 'Check Box611', billingVal === 'sms_electronic');
  setCheck(form, 'Check Box612', billingVal === 'sms_printed');
  setCheck(form, 'Check Box613', billingVal === 'printed_only');

  // Regulatory Compliance (Citizenship / Residence)
  const citChange = record.citizenship_change;
  setCheck(form, 'Check Box614', citChange === 'resident_citizen' || citChange === 'Resident');
  setCheck(form, 'Check Box615', citChange === 'non_resident_citizen' || citChange === 'Non-Resident');
  setCheck(form, 'Check Box616', citChange === 'none' || citChange === 'None');

  // Printed Names & Signatures
  const ownerPrintedName = record.policy_owner_printed_name || `${firstName} ${lastName}`.trim();
  setTxt(form, 'a17', ownerPrintedName);
  setTxt(form, 'a18', record.authorized_signatory_1_name);
  setTxt(form, 'a19', record.authorized_signatory_2_name);
  setTxt(form, 'a20', record.witness_name);
  setTxt(form, 'a21', record.place_of_signing);

  // Date of Signing (DDMMMYYYY)
  const dDate = formatAcroDate(record.date_of_signing);
  if (dDate) {
    const chars = dDate.split('');
    const dateFields = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o'];
    for (let i = 0; i < Math.min(chars.length, dateFields.length); i++) {
      setTxt(form, dateFields[i], chars[i]);
    }
  }

  // Marketing Consent
  const mConsent = record.marketing_consent || (record.receive_offers === 'Yes' ? 'yes' : 'no');
  setCheck(form, 'Check Box617', mConsent === 'yes');
  setCheck(form, 'Check Box618', mConsent === 'no');

  // Flatten the AcroForm controls into final PDF graphics
  form.flatten();

  return pdfDoc.save();
}
