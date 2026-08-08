/**
 * generateFundWithdrawalPdfFromTemplate.ts
 *
 * Fills the official Fund Withdrawal Request AcroForm PDF (/forms/VRFW.07.24.pdf) using pdf-lib.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';

function setTxt(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setText(value);
  } catch (e) {
    console.warn(`Text field "${name}" not found in FWR PDF`);
  }
}

function setCheck(form: PDFForm, name: string, checked: boolean) {
  try {
    const field = form.getCheckBox(name);
    if (checked) field.check();
    else field.uncheck();
  } catch (e) {
    console.warn(`Checkbox "${name}" not found in FWR PDF`);
  }
}

export async function generateFundWithdrawalPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/VRFW.07.24.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const form = pdfDoc.getForm();

  const policyNum = record.policy_number || record.client?.policy_number || '';
  const amountVal = record.amount ? Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';

  // Page 1 fields
  setTxt(form, '5', clientName);
  setTxt(form, '16', policyNum);
  setTxt(form, '14_1', amountVal);

  // Withdrawal Type checkboxes: 12_3 (Partial), 13_3 (Full)
  setCheck(form, '12_3', record.withdrawal_type === 'partial' || !record.withdrawal_type);
  setCheck(form, '13_3', record.withdrawal_type === 'full');

  // Page 2 fields (Bank & Payout details)
  setTxt(form, '23', record.bank_name);
  setTxt(form, '24', record.bank_branch);
  setTxt(form, '26', record.bank_account_number);
  setTxt(form, '24_1', record.bank_account_name || clientName);

  // Account Type checkboxes: 26_1 (Savings), 27_1 (Checking)
  setCheck(form, '26_1', record.account_type === 'savings' || !record.account_type);
  setCheck(form, '27_1', record.account_type === 'checking');

  // Payout Option checkboxes: 40 (Direct Credit), 41 (Check)
  setCheck(form, '40', record.payout_option === 'direct_credit' || !record.payout_option);
  setCheck(form, '41', record.payout_option === 'check');

  // Page 3 fields (Signatures & Printed Names)
  setTxt(form, '55', record.policy_owner_printed_name || clientName);
  setTxt(form, '59', record.place_of_signing);
  setTxt(form, '60', record.date_of_signing);

  form.flatten();

  return pdfDoc.save();
}
