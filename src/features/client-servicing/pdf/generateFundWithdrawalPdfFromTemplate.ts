/**
 * generateFundWithdrawalPdfFromTemplate.ts
 *
 * Fills the official Sun Life Variable Life Fund Withdrawal Request AcroForm PDF
 * (/forms/VRFW.07.24.pdf / SLOCPI_Fund Withdrawal.indd) using pdfFormUtils.
 * Enforces Month - Day - Year date formatting (MM-DD-YYYY) and image signature embedding.
 */

import { PDFDocument } from 'pdf-lib';
import {
  initializePdfForm,
  finalizePdfForm,
  setPdfTextField,
  setPdfCheckBox,
  formatDateMonthDayYear,
  embedPdfSignature,
  SMALL_PDF_FONT_SIZE,
} from './pdfFormUtils';

export async function generateFundWithdrawalPdfFromTemplate(
  record: any,
  clientName?: string,
  clientDob?: string
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/VRFW.07.24.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  const ownerName = record.policy_owner || record.client_name || clientName || record.client?.client_name || '';
  const policyNum = record.policy_number || record.client?.policy_number || '';
  const amountVal = record.amount ? Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';
  const formattedFigures = amountVal ? `${record.currency || 'PHP'} ${amountVal}` : '';

  // Helper options: preserve natural case and don't fallback to N/A
  const opts = { uppercase: false, useDefaultFallback: false };

  // ─── Section 1: General Information (Page 1) ────────────────────────────────
  setPdfTextField(form, '5', ownerName, opts); // Policy Owner
  setPdfTextField(form, '16', policyNum, opts); // Policy Number
  setPdfTextField(form, '6', record.citizenship, opts); // Citizenship
  setPdfTextField(form, '17', record.residence_countries, opts); // Country/ies of Legal Residence
  setPdfTextField(form, '7', record.owner_address || record.client?.address, opts); // Present Residence Address
  setPdfTextField(form, '8', record.permanent_address, opts); // Permanent Residence Address
  setPdfTextField(form, '9', record.work_address, opts); // Work Address
  setPdfTextField(form, '10', record.home_phone, opts); // Home Phone (Col 1)
  setPdfTextField(form, '18', record.work_phone, opts); // Work Phone (Col 2)
  setPdfTextField(form, '19', record.contact_number || record.mobile_phone || record.client?.mobile_number, opts); // Mobile Phone (Col 3)
  setPdfTextField(form, '20', record.email_address || record.client?.email, opts); // Email Address (Col 4)
  setPdfTextField(form, '11', record.policy_insured, opts); // Life Insured if different

  // ─── Section 2: Request Details (Page 1) ────────────────────────────────────
  setPdfCheckBox(form, '12_3', record.currency === 'USD');
  setPdfCheckBox(form, '13_3', record.currency !== 'USD'); // Default to PHP
  setPdfTextField(form, '14_1', record.amount_in_words, { fontSize: SMALL_PDF_FONT_SIZE, uppercase: false, useDefaultFallback: false });
  setPdfTextField(form, '21_1', formattedFigures, { fontSize: SMALL_PDF_FONT_SIZE, uppercase: false, useDefaultFallback: false });
  setPdfTextField(form, '14_5', record.special_instructions || record.comments, opts);

  // ─── Section 3: Table 1 Primary Signatures (Page 2) ─────────────────────────
  setPdfTextField(form, '23', record.policy_owner_printed_name || ownerName, opts);
  setPdfTextField(form, '26', record.witness_printed_name, opts);
  setPdfTextField(form, '24_1', record.witness_address, opts);
  setPdfTextField(form, '25_1', record.place_of_signing, opts);
  setPdfTextField(form, '28_1', formatDateMonthDayYear(record.date_of_signing || record.date_submitted), opts);

  // ─── Section 3: Table 2 Additional Signatures (Page 2) ──────────────────────
  setPdfTextField(form, '34', record.assignee_printed_name, opts);
  setPdfTextField(form, '27', formatDateMonthDayYear(record.assignee_date_of_signing), opts);

  setPdfTextField(form, '35', record.beneficiary1_printed_name, opts);
  setPdfTextField(form, '29', formatDateMonthDayYear(record.beneficiary1_date_of_signing), opts);

  setPdfTextField(form, '37', record.beneficiary2_printed_name, opts);
  setPdfTextField(form, '30', formatDateMonthDayYear(record.beneficiary2_date_of_signing), opts);

  setPdfTextField(form, '36', record.witness2_printed_name, opts);
  setPdfTextField(form, '31', formatDateMonthDayYear(record.witness2_date_of_signing), opts);

  setPdfTextField(form, '24', record.witness2_address, opts);
  setPdfTextField(form, '25', record.place_of_signing_2, opts);
  setPdfTextField(form, '28', formatDateMonthDayYear(record.date_of_signing_2), opts);

  // ─── Section 4: Notarization (Page 2 Bottom) ────────────────────────────────
  setPdfTextField(form, '58', record.notary_city, opts);

  // ─── Signature Canvas Embeddings (Page 2) ────────────────────────────────────
  const pages = pdfDoc.getPages();
  const page2 = pages.length > 1 ? pages[1] : pages[0];

  // Table 1 Signature Overlays
  if (record.signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.signature_base64, 20, 577, 380, 45);
  }
  if (record.specimen1_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.specimen1_signature_base64, 20, 550, 380, 45);
  }
  if (record.specimen2_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.specimen2_signature_base64, 290, 550, 380, 45);
  }
  if (record.witness_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.witness_signature_base64, 20, 523, 380, 45);
  }

  // Table 2 Signature Overlays
  if (record.assignee_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.assignee_signature_base64, 45, 432, 180, 20);
  }
  if (record.beneficiary1_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.beneficiary1_signature_base64, 45, 400, 180, 20);
  }
  if (record.beneficiary2_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.beneficiary2_signature_base64, 45, 368, 180, 20);
  }
  if (record.witness2_signature_base64) {
    await embedPdfSignature(pdfDoc, page2, record.witness2_signature_base64, 45, 336, 180, 20);
  }

  // ─── Section 5: Special Instruction & Banking Details (Page 3) ──────────────
  const payout = record.payout_method || record.payout_option || 'check';
  setPdfCheckBox(form, '40', payout === 'check');
  setPdfCheckBox(form, '41', payout === 'demand_draft');
  setPdfTextField(form, '43', record.encashment_branch, opts);

  setPdfCheckBox(form, '42', payout === 'telegraphic_transfer');
  setPdfCheckBox(form, '44', record.transfer_option === 'A');
  setPdfCheckBox(form, '45', record.transfer_option === 'B');
  setPdfCheckBox(form, '46', record.converted_currency === 'USD');
  setPdfCheckBox(form, '47', record.converted_currency === 'CAD');
  setPdfTextField(form, '48', record.converted_currency_other, opts);

  // Correct Page 3 Banking Fields (55 to 60)
  setPdfTextField(form, '55', record.bank_account_name || ownerName, opts);
  setPdfTextField(form, '56', record.bank_account_number, opts);
  setPdfTextField(form, '57', record.bank_name, opts);
  setPdfTextField(form, '58', record.bank_address || record.bank_branch, opts);
  setPdfTextField(form, '59', record.routing_number, opts);
  setPdfTextField(form, '60', record.swift_code, opts);

  // Proof of Bank Account checkboxes
  if (Array.isArray(record.bank_proof_types)) {
    setPdfCheckBox(form, '50', record.bank_proof_types.includes('statement'));
    setPdfCheckBox(form, '51', record.bank_proof_types.includes('passbook'));
    setPdfCheckBox(form, '52', record.bank_proof_types.includes('deposit_cert'));
    setPdfCheckBox(form, '53', record.bank_proof_types.includes('check'));
    setPdfCheckBox(form, '54', record.bank_proof_types.includes('atm_card'));
  }

  finalizePdfForm(form, font);
  return pdfDoc.save();
}

