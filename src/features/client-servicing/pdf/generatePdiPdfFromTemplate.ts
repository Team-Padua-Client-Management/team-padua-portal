/**
 * generatePdiPdfFromTemplate.ts
 *
 * Fills the official Reinstatement PDI AcroForm PDF (/forms/PDI.pdf) using pdf-lib.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';

function setTxt(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setText(value);
  } catch (e) {
    console.warn(`Text field "${name}" not found in PDI PDF`);
  }
}

function setCheck(form: PDFForm, name: string, checked: boolean) {
  try {
    const field = form.getCheckBox(name);
    if (checked) field.check();
    else field.uncheck();
  } catch (e) {
    console.warn(`Checkbox "${name}" not found in PDI PDF`);
  }
}

export async function generatePdiPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/PDI.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const form = pdfDoc.getForm();

  const planholderName = record.planholder_name || clientName;
  const policyNum = record.policy_number || record.client?.policy_number || '';

  // Header & General Info
  setTxt(form, 'ApplicationDeclaration by Name of Planholderperson being insured', planholderName);
  setTxt(form, 'under Plan No', policyNum);
  setTxt(form, 'Name of PlanholderPerson being insured Last First Middle', planholderName);
  setTxt(form, 'Birthdate daymonthyear', record.birthdate || clientDob);
  setTxt(form, 'Age', record.age ? String(record.age) : '');

  // Addresses & Contact Info
  setTxt(form, 'Residence Address no street municipality cityprovince', record.residence_address);
  setTxt(form, 'Mailing Address no street municipality cityprovince', record.mailing_address);
  setTxt(form, 'Home Phone No', record.home_phone);
  setTxt(form, 'Business Phone No', record.work_phone);
  setTxt(form, 'Cell Phone No', record.mobile_phone);
  setTxt(form, 'EMail Address', record.email_address);

  // Signing Details
  setTxt(form, 'Printed Name', planholderName);
  setTxt(form, 'Place of Signing', record.place_of_signing);
  setTxt(form, 'Date of Signing daymonthyear', record.date_of_signing);

  form.flatten();

  return pdfDoc.save();
}
