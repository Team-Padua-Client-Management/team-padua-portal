/**
 * generateFundSwitchingPdf.ts
 *
 * Overlays dynamic FundSwitchingRecord data onto the ACTUAL Sun Life blank form:
 *   /public/forms/SLOCPI_Fund Switching.PDF
 *
 * The template is embedded as a full-page background on each output page;
 * all values are drawn on top at the coordinates defined in:
 *   app/lib/pdf/templates/fundSwitchingTemplate.ts
 *
 * HOW TO FINE-TUNE:
 *   Do NOT change coordinates here.  Open fundSwitchingTemplate.ts and adjust
 *   any x/y there.  Every field has a // COORD comment for quick navigation.
 *
 * IMPORTANT:
 *   Do NOT modify generateAdvisorChangeRequestPdf.ts or
 *   generateAdvisorChangeRequestPdfFromTemplate.ts — those files are the ACR
 *   implementation and must stay untouched.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { FundSwitchingRecord } from '@/app/(admin)/admin/(ClientServicing)/fund-switching/page';
import { S1, S2, S3, S4, S5, FieldCoord, CheckCoord } from './templates/fundSwitchingTemplate';

// ─────────────────────────────────────────────────────────────────────────────
// Shared low-level drawing helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Split "YYYY-MM-DD" (from <input type="date">) into day / month / year parts. */
function parseISODate(iso: string | null | undefined): { day: string; month: string; year: string } {
  if (!iso) return { day: '', month: '', year: '' };
  const [year, month, day] = iso.split('-');
  return { day: day ?? '', month: month ?? '', year: year ?? '' };
}

/** Draw plain text; silently no-ops on falsy value. */
function txt(
  pages: PDFPage[],
  coord: FieldCoord,
  value: string | null | undefined,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0),
): void {
  if (!value) return;
  const page = pages[coord.page - 1];
  if (!page) return;
  page.drawText(value, { x: coord.x, y: coord.y, size, font, color });
}

/** Draw plain text directly at explicit coordinates (for table rows). */
function txtAt(
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

/**
 * Draw a word-wrapped text block.
 * Returns the Y coordinate immediately below the last line drawn.
 */
function wrappedTxtAt(
  page: PDFPage,
  text: string | null | undefined,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  lineHeight = size * 1.35,
  color = rgb(0, 0, 0),
): number {
  if (!text) return y;
  const paragraphs = text.split(/\r\n|\r|\n/);
  let curY = y;
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { curY -= lineHeight; continue; }
    let line = '';
    for (const word of words) {
      const probe = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(probe, size) > maxWidth) {
        page.drawText(line, { x, y: curY, size, font, color });
        curY -= lineHeight;
        line = word;
      } else {
        line = probe;
      }
    }
    if (line) { page.drawText(line, { x, y: curY, size, font, color }); curY -= lineHeight; }
  }
  return curY;
}

/** Draw an "X" checkmark when checked is true. */
function checkMark(
  pages: PDFPage[],
  coord: CheckCoord,
  checked: boolean,
  boldFont: PDFFont,
): void {
  if (!checked) return;
  const page = pages[coord.page - 1];
  if (!page) return;
  page.drawText('X', { x: coord.x, y: coord.y, size: coord.size ?? 8, font: boldFont, color: rgb(0, 0, 0) });
}

/**
 * Embed a base64 PNG/JPEG signature into a rectangular area,
 * scaled to fit while preserving aspect ratio and centred.
 */
async function embedSignature(
  pdfDoc: PDFDocument,
  pages: PDFPage[],
  pageIndex: number,          // 0-based
  base64: string | null | undefined,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
): Promise<void> {
  if (!base64) return;
  const page = pages[pageIndex];
  if (!page) return;
  try {
    const [header, data] = base64.split(',');
    if (!data) return;
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
    // Silently ignore malformed / unsupported image data
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a Fund Switching PDF by loading the real Sun Life blank template
 * as backgrounds and overlaying filled-in values on top.
 *
 * @param record          FundSwitchingRecord with all field values
 * @param clientNameParts Parsed name: { last, first, middle }
 * @param clientDob       ISO date "YYYY-MM-DD"
 * @returns               Raw PDF bytes (Uint8Array) ready for download
 */
export async function generateFundSwitchingPdf(
  record: FundSwitchingRecord,
  clientNameParts: { last: string; first: string; middle: string },
  clientDob: string,
): Promise<Uint8Array> {

  // ── 1. Fetch the blank template ──────────────────────────────────────────
  const res = await fetch('/forms/SLOCPI_Fund Switching.PDF');
  if (!res.ok) {
    throw new Error(
      `Failed to load Fund Switching PDF template (HTTP ${res.status}). ` +
      'Ensure /public/forms/SLOCPI_Fund Switching.PDF exists.',
    );
  }
  const templateBytes = await res.arrayBuffer();

  // ── 2. Load the template to discover page count ──────────────────────────
  const srcDoc = await PDFDocument.load(templateBytes);
  const pageCount = srcDoc.getPageCount();

  // Build an array of page indices [0, 1, 2, ...]
  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);

  // ── 3. Create a new output document and embed all template pages ─────────
  const pdfDoc = await PDFDocument.create();
  const embeddedPages = await pdfDoc.embedPdf(templateBytes, pageIndices);

  // Add each page, using the embedded page's own dimensions as the canvas size
  const pages: PDFPage[] = embeddedPages.map(ep => {
    const pg = pdfDoc.addPage([ep.width, ep.height]);
    pg.drawPage(ep, { x: 0, y: 0, width: ep.width, height: ep.height });
    return pg;
  });

  // ── 4. Embed fonts ────────────────────────────────────────────────────────
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const VS = 8.5; // standard value font size (pt)

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — General Information (Page 1)
  // ══════════════════════════════════════════════════════════════════════════

  txt(pages, S1.policyOwnerLast,   clientNameParts.last,   regular, VS);
  txt(pages, S1.policyOwnerFirst,  clientNameParts.first,  regular, VS);
  txt(pages, S1.policyOwnerMiddle, clientNameParts.middle, regular, VS);

  txt(pages, S1.policyNumber,     record.policy_number,            regular, VS);
  txt(pages, S1.lifeInsured,      record.life_insured,             regular, VS);
  txt(pages, S1.citizenship,      record.citizenship,              regular, VS);
  txt(pages, S1.emailAddress,     record.email_address,            regular, VS);
  txt(pages, S1.mobilePhone,      record.mobile_phone,             regular, VS);
  txt(pages, S1.homePhone,        record.home_phone,               regular, VS);
  txt(pages, S1.workPhone,        record.work_phone,               regular, VS);

  // Address fields — word-wrapped to fit in the form box (~480 pt wide)
  if (record.present_address && pages[S1.presentAddress.page - 1]) {
    wrappedTxtAt(
      pages[S1.presentAddress.page - 1],
      record.present_address,
      S1.presentAddress.x, S1.presentAddress.y,
      480, regular, VS,
    );
  }
  if (record.permanent_address && pages[S1.permanentAddress.page - 1]) {
    wrappedTxtAt(
      pages[S1.permanentAddress.page - 1],
      record.permanent_address,
      S1.permanentAddress.x, S1.permanentAddress.y,
      480, regular, VS,
    );
  }
  if (record.work_address && pages[S1.workAddress.page - 1]) {
    wrappedTxtAt(
      pages[S1.workAddress.page - 1],
      record.work_address,
      S1.workAddress.x, S1.workAddress.y,
      480, regular, VS,
    );
  }

  txt(pages, S1.countryOfLegalRes, record.country_of_legal_residence, regular, VS);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Fund Switching Rows (Page 1, pre-printed table rows)
  // ══════════════════════════════════════════════════════════════════════════

  const switchRows = Array.isArray(record.fund_switch_rows) ? record.fund_switch_rows : [];
  const s2Page = pages[S2.tableStartPage - 1];
  if (s2Page) {
    switchRows.forEach((row, idx) => {
      const rowY = S2.rowStartY - idx * S2.rowHeight;
      if (rowY < 40) return; // don't write below the page bottom

      txtAt(s2Page, row.from_fund, S2.colFromFund,  rowY, regular, VS);
      txtAt(s2Page, row.to_fund,   S2.colToFund,    rowY, regular, VS);

      // Full / Partial checkmark
      if (row.switch_type === 'full') {
        txtAt(s2Page, 'X', S2.colFullCheck, rowY, bold, 9);
      } else if (row.switch_type === 'partial') {
        txtAt(s2Page, 'X', S2.colPartCheck, rowY, bold, 9);
      }

      // Amount or Percentage (only one should be filled for each row)
      if (row.amount) {
        txtAt(s2Page, String(row.amount), S2.colAmount,  rowY, regular, VS);
      }
      if (row.percentage) {
        txtAt(s2Page, String(row.percentage) + '%', S2.colPercent, rowY, regular, VS);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — Future Fund Allocation
  // ══════════════════════════════════════════════════════════════════════════

  // Peso funds
  const pesoAlloc = Array.isArray(record.future_peso_allocations) ? record.future_peso_allocations : [];
  const pesoPage = pages[S3.pesoTablePage - 1];
  if (pesoPage) {
    pesoAlloc.forEach((alloc, idx) => {
      const rowY = S3.pesoRowStartY - idx * S3.pesoRowHeight;
      if (rowY < 40) return;
      txtAt(pesoPage, alloc.fund_name,  S3.colPesoFundName, rowY, regular, VS);
      txtAt(pesoPage, alloc.percentage ? alloc.percentage + '%' : '', S3.colPesoPercent, rowY, regular, VS);
    });
  }

  // Dollar funds
  const dollarAlloc = Array.isArray(record.future_dollar_allocations) ? record.future_dollar_allocations : [];
  const dollarPage = pages[S3.dollarTablePage - 1];
  if (dollarPage) {
    dollarAlloc.forEach((alloc, idx) => {
      const rowY = S3.dollarRowStartY - idx * S3.dollarRowHeight;
      if (rowY < 40) return;
      txtAt(dollarPage, alloc.fund_name,  S3.colDollarFundName, rowY, regular, VS);
      txtAt(dollarPage, alloc.percentage ? alloc.percentage + '%' : '', S3.colDollarPercent, rowY, regular, VS);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — Excess Premium Changes
  // ══════════════════════════════════════════════════════════════════════════

  checkMark(pages, S4.checkAddPremium,    record.excess_premium_option === 'add',    bold);
  checkMark(pages, S4.checkChangePremium, record.excess_premium_option === 'change', bold);
  checkMark(pages, S4.checkCancelPremium, record.excess_premium_option === 'cancel', bold);

  checkMark(pages, S4.checkPHP, record.excess_currency === 'PHP', bold);
  checkMark(pages, S4.checkUSD, record.excess_currency === 'USD', bold);

  txt(pages, S4.amount, record.excess_amount, regular, VS);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — Acknowledgement & Signatures (Page 2)
  // ══════════════════════════════════════════════════════════════════════════

  txt(pages, S5.placeOfSigning, record.place_of_signing, regular, VS);

  const sigDate = parseISODate(record.date_of_signing);
  txt(pages, S5.sigDay,   sigDate.day,   regular, VS);
  txt(pages, S5.sigMonth, sigDate.month, regular, VS);
  txt(pages, S5.sigYear,  sigDate.year,  regular, VS);

  txt(pages, S5.witnessName,    record.witness_name,    regular, VS);
  txt(pages, S5.witnessAddress, record.witness_address, regular, VS);

  // Signatures — embedded as images into their rectangular areas
  await embedSignature(pdfDoc, pages, S5.ownerSigArea.page - 1,
    record.policy_owner_signature,
    S5.ownerSigArea.areaX, S5.ownerSigArea.areaY,
    S5.ownerSigArea.areaW, S5.ownerSigArea.areaH,
  );
  await embedSignature(pdfDoc, pages, S5.witnessSigArea.page - 1,
    record.witness_signature,
    S5.witnessSigArea.areaX, S5.witnessSigArea.areaY,
    S5.witnessSigArea.areaW, S5.witnessSigArea.areaH,
  );
  await embedSignature(pdfDoc, pages, S5.assigneeSigArea.page - 1,
    record.assignee_signature,
    S5.assigneeSigArea.areaX, S5.assigneeSigArea.areaY,
    S5.assigneeSigArea.areaW, S5.assigneeSigArea.areaH,
  );
  await embedSignature(pdfDoc, pages, S5.beneficiarySigArea.page - 1,
    record.beneficiary_signature,
    S5.beneficiarySigArea.areaX, S5.beneficiarySigArea.areaY,
    S5.beneficiarySigArea.areaW, S5.beneficiarySigArea.areaH,
  );

  // ── Serialise and return ──────────────────────────────────────────────────
  return pdfDoc.save();
}
