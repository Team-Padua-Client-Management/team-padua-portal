/**
 * generateFundWithdrawalPdfFromTemplate.ts
 *
 * Fills the official Fund Withdrawal Request AcroForm PDF (/forms/VRFW.07.24.pdf) using pdfFormUtils.
 */

import { PDFDocument } from 'pdf-lib';
import {
  initializePdfForm,
  finalizePdfForm,
  setPdfTextField,
  setPdfCheckBox,
} from './pdfFormUtils';

export async function generateFundWithdrawalPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/VRFW.07.24.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  const policyNum = record.policy_number || record.client?.policy_number || '';
  const amountVal = record.amount ? Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';

  // Page 1 fields
  setPdfTextField(form, '5', clientName, { useDefaultFallback: false });
  setPdfTextField(form, '16', policyNum, { useDefaultFallback: false });
  setPdfTextField(form, '14_1', amountVal, { useDefaultFallback: false });

  // Withdrawal Type checkboxes: 12_3 (Partial), 13_3 (Full)
  setPdfCheckBox(form, '12_3', record.withdrawal_type === 'partial' || !record.withdrawal_type);
  setPdfCheckBox(form, '13_3', record.withdrawal_type === 'full');

  // Page 2 fields (Bank & Payout details)
  setPdfTextField(form, '23', record.bank_name, { useDefaultFallback: false });
  setPdfTextField(form, '24', record.bank_branch, { useDefaultFallback: false });
  setPdfTextField(form, '26', record.bank_account_number, { useDefaultFallback: false });
  setPdfTextField(form, '24_1', record.bank_account_name || clientName, { useDefaultFallback: false });

  // Account Type checkboxes: 26_1 (Savings), 27_1 (Checking)
  setPdfCheckBox(form, '26_1', record.account_type === 'savings' || !record.account_type);
  setPdfCheckBox(form, '27_1', record.account_type === 'checking');

  // Payout Option checkboxes: 40 (Direct Credit), 41 (Check)
  setPdfCheckBox(form, '40', record.payout_option === 'direct_credit' || !record.payout_option);
  setPdfCheckBox(form, '41', record.payout_option === 'check');

  // Page 3 fields (Signatures & Printed Names)
  setPdfTextField(form, '55', record.policy_owner_printed_name || clientName, { useDefaultFallback: false });
  setPdfTextField(form, '59', record.place_of_signing, { useDefaultFallback: false });
  setPdfTextField(form, '60', record.date_of_signing, { useDefaultFallback: false });

  finalizePdfForm(form, font);

  return pdfDoc.save();
}
