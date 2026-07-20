/**
 * generateAdvisorChangeRequestPdfFromTemplate.ts
 *
 * Overlays dynamic FormRecord data onto the ACTUAL Sun Life blank form:
 *   /public/forms/SLOCPI_Advisor_Change_Request.pdf
 *
 * The template is embedded as a full-page background on each page of a new
 * PDFDocument; all values are then drawn on top at measured coordinates.
 *
 * COORDINATE FACTS (verified via pdfplumber on the real file):
 *   - Page size  : US Letter  612 × 792 pt  (NOT A4)
 *   - Pages      : 2
 *   - Origin     : (0, 0) = bottom-left corner; Y increases upward
 *
 * HOW TO FINE-TUNE:
 *   Search for  "// COORD"  to jump to any individual field position.
 *   Increase y → moves text UP;  decrease y → moves text DOWN.
 *   Increase x → moves text RIGHT; decrease x → moves text LEFT.
 *
 * IMPORTANT:
 *   Do NOT modify or delete generateAdvisorChangeRequestPdf.ts — that file
 *   is kept as a fallback / reference implementation.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { FormRecord } from '@/app/(admin)/admin/(ClientServicing)/acr/page';

// ─────────────────────────────────────────────────────────────────────────────
// Tiny, self-contained helpers (no external deps beyond pdf-lib)
// ─────────────────────────────────────────────────────────────────────────────

/** Split "YYYY-MM-DD" (from <input type="date">) into day / month / year parts. */
function parseISODate(iso: string | null | undefined): { day: string; month: string; year: string } {
  if (!iso) return { day: '', month: '', year: '' };
  const [year, month, day] = iso.split('-');
  return {
    day:   day   ?? '',
    month: month ?? '',
    year:  year  ?? '',
  };
}

/** Draw plain text; silently no-ops on falsy value. */
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

/**
 * Draw a word-wrapped block of text.
 * Returns the Y coordinate immediately below the last line drawn.
 */
function wrappedTxt(
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

/**
 * Draw an "X" mark at (x, y) when `checked` is true.
 * The checkbox square itself is already printed on the template — we only add the mark.
 */
function checkMark(
  page: PDFPage,
  checked: boolean,
  x: number,
  y: number,
  boldFont: PDFFont,
  size = 8,
): void {
  if (!checked) return;
  page.drawText('X', { x, y, size, font: boldFont, color: rgb(0, 0, 0) });
}

/**
 * Embed a base64 PNG or JPEG signature into the given rectangular area,
 * scaled to fit while preserving aspect ratio and centred.
 */
async function embedSignature(
  pdfDoc: PDFDocument,
  page: PDFPage,
  base64: string | null | undefined,
  areaX: number,
  areaY: number,     // bottom-left Y of the area
  areaW: number,
  areaH: number,
): Promise<void> {
  if (!base64) return;
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
 * Generates an Advisor Change Request PDF by loading the real Sun Life
 * blank template as a background and overlaying filled-in values on top.
 *
 * Same call signature as the original `generateAdvisorChangeRequestPdf`.
 *
 * @param record          FormRecord with all field values
 * @param clientNameParts Parsed name: { last, first, middle }
 * @param clientDob       ISO date "YYYY-MM-DD" (from <input type="date">)
 * @returns               Raw PDF bytes (Uint8Array) ready for download
 */
export async function generateAdvisorChangeRequestPdfFromTemplate(
  record: FormRecord,
  clientNameParts: { last: string; first: string; middle: string },
  clientDob: string,
): Promise<Uint8Array> {

  // ── 1. Fetch the blank template ──────────────────────────────────────────
  const res = await fetch('/forms/SLOCPI_Advisor_Change_Request.pdf');
  if (!res.ok) {
    throw new Error(
      `Failed to load PDF template (HTTP ${res.status}). ` +
      'Ensure /public/forms/SLOCPI_Advisor_Change_Request.pdf exists.',
    );
  }
  const templateBytes = await res.arrayBuffer();

  // ── 2. Create a new output document and embed the template pages ─────────
  const pdfDoc = await PDFDocument.create();

  // embedPdf returns one EmbeddedPdfPage per page of the source document
  const [embedded1, embedded2] = await pdfDoc.embedPdf(templateBytes, [0, 1]);

  // ── 3. Add output pages, drawing each embedded template as full background ─
  // We read the ACTUAL dimensions from the embedded page objects (US Letter:
  // 612 × 792 pt) rather than hardcoding A4 or any other size.
  const pg1 = pdfDoc.addPage([embedded1.width, embedded1.height]);
  pg1.drawPage(embedded1, { x: 0, y: 0, width: embedded1.width, height: embedded1.height });

  const pg2 = pdfDoc.addPage([embedded2.width, embedded2.height]);
  pg2.drawPage(embedded2, { x: 0, y: 0, width: embedded2.width, height: embedded2.height });

  // ── 4. Embed fonts ────────────────────────────────────────────────────────
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Standard value size for filled fields (adjust globally here if needed)
  const VS = 8.5; // value size in pt

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1  (612 × 792 pt)
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Label positions are from pdfplumber; values are placed 15 pt below the
  // label baseline (i.e. label_y − 15) unless noted otherwise.
  //
  // ══════════════════════════════════════════════════════════════════════════

  // ── A.1  Policy Owner Name ────────────────────────────────────────────────
  // Labels at y=533.3;  values sit at y≈518  (label_y − 15)
  txt(pg1, clientNameParts.last,   35,  518, regular, VS); // COORD A.1 Last Name
  txt(pg1, clientNameParts.first,  176, 518, regular, VS); // COORD A.1 First Name
  txt(pg1, clientNameParts.middle, 310, 518, regular, VS); // COORD A.1 Middle Name

  // ── A.1  Date of Birth ────────────────────────────────────────────────────
  // Sub-header labels at y=524;  values just below at y≈513
  const dob = parseISODate(clientDob);
  txt(pg1, dob.day,   475, 513, regular, VS); // COORD A.1 DOB Day
  txt(pg1, dob.month, 502, 513, regular, VS); // COORD A.1 DOB Month
  txt(pg1, dob.year,  549, 513, regular, VS); // COORD A.1 DOB Year

  // ── A.2  Company Name ─────────────────────────────────────────────────────
  // Label at x=45 y=495.7;  value at y≈480
  txt(pg1, record.company_name, 45, 480, regular, VS); // COORD A.2 Company Name

  // ── A.2  Designation ─────────────────────────────────────────────────────
  // Label at x=456 y=495.7;  value at y≈480
  txt(pg1, record.designation, 310, 480, regular, VS); // COORD A.2 Designation

  // ── B.1  Specific-policy checkbox ────────────────────────────────────────
  // The B.1 radio checkbox square is printed on the template at approx x=51.
  // Label: "B.1 Request a particular policy/plan/account number(s) only."
  // We place the X at y that aligns with B.1 header — tune as needed.
  checkMark(pg1, record.request_type === 'specific_policy', 51, 435, bold, 9); // COORD B.1 checkbox

  // ── B.1  Policy number(s) text area ──────────────────────────────────────
  // "Specify below..." label ends y=408.9; text area starts y≈395
  if (record.request_type === 'specific_policy' && record.policy_numbers) {
    wrappedTxt(pg1, record.policy_numbers, 55, 395, 500, regular, VS); // COORD B.1 policy numbers
  }

  // ── B.2  All-accounts checkbox ───────────────────────────────────────────
  checkMark(pg1, record.request_type === 'all_accounts', 51, 350, bold, 9); // COORD B.2 checkbox

  // ── B.2  Account-type sub-checkboxes ─────────────────────────────────────
  // Labels measured at specific y values; checkboxes drawn at x≈51, same y.
  const isAll = record.request_type === 'all_accounts';
  checkMark(pg1, isAll && !!record.account_individual_life, 51, 279.8, bold, 9); // COORD B.2 Individual Life
  checkMark(pg1, isAll && !!record.account_group_life,      51, 267.8, bold, 9); // COORD B.2 Group Life
  checkMark(pg1, isAll && !!record.account_mutual_fund,     51, 255.8, bold, 9); // COORD B.2 Mutual Fund
  checkMark(pg1, isAll && !!record.account_pre_need,        51, 243.8, bold, 9); // COORD B.2 Pre-Need Plans

  // ── B.2  Reference policy number (inline underline) ──────────────────────
  // "number:" ends at x=326.9 y=231.8; value starts x≈330, y≈233
  if (isAll && record.reference_policy_number) {
    txt(pg1, record.reference_policy_number, 330, 233, regular, VS); // COORD B.2 ref policy number
  }

  // ── C.  Reason for Change checkboxes ─────────────────────────────────────
  checkMark(pg1, record.reason_type === 'no_advisor',      51, 188.9, bold, 9); // COORD C "no advisor"
  checkMark(pg1, record.reason_type === 'prefer_another',  51, 176.9, bold, 9); // COORD C "prefer another"

  // ── C.  Reason details text (multi-line) ─────────────────────────────────
  // Below the two C options; approximate y≈158
  if (record.reason_type === 'prefer_another' && record.reason_details) {
    wrappedTxt(pg1, record.reason_details, 55, 158, 500, regular, VS); // COORD C reason details
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2  (612 × 792 pt)
  // ══════════════════════════════════════════════════════════════════════════

  // ── D.  New Advisor Name ─────────────────────────────────────────────────
  // Labels at y=721.8;  values at y≈707  (label_y − 15)
  txt(pg2, record.new_advisor_last_name,   35,  707, regular, VS); // COORD D Last Name
  txt(pg2, record.new_advisor_first_name,  218, 707, regular, VS); // COORD D First Name
  txt(pg2, record.new_advisor_middle_name, 401, 707, regular, VS); // COORD D Middle Name

  // ── E.1  Complete Name of Policy Owner ───────────────────────────────────
  // Labels at y=482.1;  values at y≈467
  txt(pg2, clientNameParts.last,   35,  467, regular, VS); // COORD E.1 Last Name
  txt(pg2, clientNameParts.first,  218, 467, regular, VS); // COORD E.1 First Name
  txt(pg2, clientNameParts.middle, 401, 467, regular, VS); // COORD E.1 Middle Name

  // ── E.1  Place of Signing ────────────────────────────────────────────────
  // Label at x=35 y=448.9;  value at y≈434
  txt(pg2, record.place_of_signing, 35, 434, regular, VS); // COORD E.1 Place of Signing

  // ── E.1  Date of Signing ─────────────────────────────────────────────────
  // Sub-header labels at y=451.1;  values at y≈441
  const sigDate = parseISODate(record.date_of_signing);
  txt(pg2, sigDate.day,   457, 441, regular, VS); // COORD E.1 Signing Day
  txt(pg2, sigDate.month, 490, 441, regular, VS); // COORD E.1 Signing Month
  txt(pg2, sigDate.year,  545, 441, regular, VS); // COORD E.1 Signing Year

  // ── E.2  Policy Owner Signature ──────────────────────────────────────────
  // Signature box: roughly x=35–575, y=358–398 (height ~40)
  // Label y=402.3; image area bottom-left y=358, height=40
  await embedSignature(
    pdfDoc, pg2,
    record.policy_owner_signature,
    35, 358,    // COORD E.2 owner sig area — bottom-left x, y
    540, 40,    // COORD E.2 owner sig area — width, height
  );

  // ── E.2  New Advisor Signature ────────────────────────────────────────────
  // Labels at y=369.3; advisor sig on the left (x=35), code/NBO to the right
  await embedSignature(
    pdfDoc, pg2,
    record.new_advisor_signature,
    35, 330,    // COORD E.2 advisor sig area — bottom-left x, y
    175, 35,    // COORD E.2 advisor sig area — width, height
  );

  // ── E.2  Code Number ──────────────────────────────────────────────────────
  // Code Number label x=218.2 y=369.3; value just below at y≈355
  txt(pg2, record.code_number, 218, 355, regular, VS); // COORD E.2 Code Number

  // ── E.2  NBO / ISO ────────────────────────────────────────────────────────
  // NBO/ISO label x=401.4 y=369.3; value at y≈355
  txt(pg2, record.nbo_iso, 401, 355, regular, VS); // COORD E.2 NBO/ISO

  // ── F.2  Wants Communication — Yes / No checkboxes ───────────────────────
  // "Yes" label x=142.4 y=167.8 → checkbox just left: x≈130, y≈167
  // "No"  label x=174.4 y=167.8 → checkbox just left: x≈162, y≈167
  checkMark(pg2, record.wants_communication === true,  130, 167, bold, 9); // COORD F.2 Yes
  checkMark(pg2, record.wants_communication === false, 162, 167, bold, 9); // COORD F.2 No

  // ── G.  For Office Use Only ───────────────────────────────────────────────

  // Complete Name of Staff — label x=153.5 y=117.2; value at y≈102
  txt(pg2, record.received_by_staff, 55, 102, regular, VS); // COORD G Staff Name

  // Receiving Department/Office — label x=367 y=117.2; value at y≈102
  txt(pg2, record.receiving_department, 320, 102, regular, VS); // COORD G Department

  // Date Received — sub-headers at y=85.6; values at y≈74
  const recDate = parseISODate(record.date_received);
  txt(pg2, recDate.day,   158, 74, regular, VS); // COORD G Date Received Day
  txt(pg2, recDate.month, 201, 74, regular, VS); // COORD G Date Received Month
  txt(pg2, recDate.year,  270, 74, regular, VS); // COORD G Date Received Year

  // Time Received — label x=327 y=77.6; value at y≈62
  txt(pg2, record.time_received, 327, 62, regular, VS); // COORD G Time Received

  // ── Serialise and return ──────────────────────────────────────────────────
  return pdfDoc.save();
}
