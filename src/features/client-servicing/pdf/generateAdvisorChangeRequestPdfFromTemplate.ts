console.log("🔥 generateAdvisorChangeRequestPdfFromTemplate CALLED");

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

// ────────────────────────────────────────────────────────────────────────/** Split "YYYY-MM-DD" or ISO date string into day / month / year parts. */
function parseISODate(
  iso: string | null | undefined
): {
  day: string;
  month: string;
  year: string;
} {
  if (!iso) {
    return {
      day: "",
      month: "",
      year: ""
    };
  }

  const clean = iso.split('T')[0].trim();
  const parts = clean.split("-");
  if (parts.length < 3) {
    return {
      day: "",
      month: "",
      year: ""
    };
  }

  const [year, month, day] = parts;

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  return {
    day: day ? day.padStart(2, '0') : "",
    month: months[Number(month) - 1] || "",
    year: year || "",
  };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DateBoxesConfig {
  day: Box[];
  month: Box[];
  year: Box[];
}

// Section A.1 Date of Birth boxes on Page 1
const DOB_BOXES: DateBoxesConfig = {
  day: [
    { x: 471.225, y: 504.82, w: 9.486, h: 12.523 },
    { x: 482.04, y: 504.82, w: 9.486, h: 12.523 },
  ],
  month: [
    { x: 497.503, y: 504.82, w: 9.486, h: 12.523 },
    { x: 508.317, y: 504.82, w: 9.487, h: 12.523 },
    { x: 519.132, y: 504.82, w: 9.487, h: 12.523 },
  ],
  year: [
    { x: 535.069, y: 504.642, w: 9.487, h: 12.523 },
    { x: 545.884, y: 504.642, w: 9.487, h: 12.523 },
    { x: 556.699, y: 504.642, w: 9.486, h: 12.523 },
    { x: 567.513, y: 504.642, w: 9.487, h: 12.523 },
  ],
};

// Section E.1 Date of Signing boxes on Page 2
const SIGNING_DATE_BOXES: DateBoxesConfig = {
  day: [
    { x: 451.0, y: 429.208, w: 11.365, h: 14.594 },
    { x: 463.956, y: 429.208, w: 11.364, h: 14.594 },
  ],
  month: [
    { x: 482.48, y: 429.208, w: 11.364, h: 14.594 },
    { x: 495.435, y: 429.208, w: 11.365, h: 14.594 },
    { x: 508.391, y: 429.208, w: 11.364, h: 14.594 },
  ],
  year: [
    { x: 527.483, y: 429.0, w: 11.365, h: 14.593 },
    { x: 540.439, y: 429.0, w: 11.364, h: 14.593 },
    { x: 553.395, y: 429.0, w: 11.364, h: 14.593 },
    { x: 566.35, y: 429.0, w: 11.365, h: 14.593 },
  ],
};

// Section G Date Received boxes on Page 2
const DATE_RECEIVED_BOXES: DateBoxesConfig = {
  day: [
    { x: 149.239, y: 58.698, w: 14.328, h: 18.495 },
    { x: 165.573, y: 58.698, w: 14.328, h: 18.495 },
  ],
  month: [
    { x: 188.928, y: 58.698, w: 14.329, h: 18.495 },
    { x: 205.263, y: 58.698, w: 14.328, h: 18.495 },
    { x: 221.597, y: 58.698, w: 14.328, h: 18.495 },
  ],
  year: [
    { x: 245.669, y: 58.434, w: 14.328, h: 18.494 },
    { x: 262.003, y: 58.434, w: 14.328, h: 18.494 },
    { x: 278.337, y: 58.434, w: 14.329, h: 18.494 },
    { x: 294.672, y: 58.434, w: 14.328, h: 18.494 },
  ],
};

/**
 * Render individual date characters centered inside each designated box.
 */
function drawDateInBoxes(
  page: PDFPage,
  dateObj: { day: string; month: string; year: string },
  config: DateBoxesConfig,
  font: PDFFont,
  size = 8.5,
  color = rgb(0, 0, 0),
): void {
  const renderChars = (chars: string, boxes: Box[]) => {
    const text = chars.toUpperCase();
    for (let i = 0; i < boxes.length; i++) {
      const char = text[i];
      if (!char) continue;
      const box = boxes[i];
      const charWidth = font.widthOfTextAtSize(char, size);
      const x = box.x + (box.w - charWidth) / 2;
      const y = box.y + (box.h - size * 0.75) / 2;
      page.drawText(char, { x, y, size, font, color });
    }
  };

  if (dateObj.day) renderChars(dateObj.day, config.day);
  if (dateObj.month) renderChars(dateObj.month, config.month);
  if (dateObj.year) renderChars(dateObj.year, config.year);
}

/** Draw plain uppercase text; silently no-ops on falsy value. */
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
  page.drawText(String(value).toUpperCase(), { x, y, size, font, color });
}

/**
 * Draw a word-wrapped block of uppercase text.
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
  const uppercaseText = String(text).toUpperCase();
  const paragraphs = uppercaseText.split(/\r\n|\r|\n/);
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
  console.log('🔥 [ACR PDF Generator Executed]', {
    clientNameParts,
    clientDob,
    record
  });

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
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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
  txt(pg1, clientNameParts.last, 35, 518, regular, VS); // COORD A.1 Last Name
  txt(pg1, clientNameParts.first, 176, 518, regular, VS); // COORD A.1 First Name
  txt(pg1, clientNameParts.middle, 310, 518, regular, VS); // COORD A.1 Middle Name

  // ── A.1  Date of Birth ────────────────────────────────────────────────────
  const dob = parseISODate(clientDob);
  drawDateInBoxes(pg1, dob, DOB_BOXES, regular, VS);

  // ── A.2  Company Name ─────────────────────────────────────────────────────
  // Label at x=45 y=495.7;  value at y≈465
  txt(pg1, record.company_name, 45, 465, regular, VS); // COORD A.2 Company Name

  // ── A.2  Designation ─────────────────────────────────────────────────────
  // Label at x=456 y=495.7;  value at y≈465
  txt(pg1, record.designation, 472, 465, regular, VS); // COORD A.2 Designation

  // ── B.1  Specific-policy checkbox ────────────────────────────────────────
  // The B.1 radio checkbox square is printed on the template at approx x=47, y=435.
  // Label: "B.1 Request a particular policy/plan/account number(s) only."
  checkMark(pg1, record.request_type === 'specific_policy', 47, 435, bold, 9); // COORD B.1 checkbox

  // ── B.1  Policy number(s) text area ──────────────────────────────────────
  // "Specify below..." label ends y=408.9; text area starts y≈380
  if (record.request_type === 'specific_policy' && record.policy_numbers) {
    wrappedTxt(pg1, record.policy_numbers, 55, 380, 500, regular, VS); // COORD B.1 policy numbers
  }

  // ── B.2  All-accounts checkbox ───────────────────────────────────────────
  // The B.2 radio checkbox square is printed on the template at approx x=47, y=350.
  // Label: "B.2 Request change of servicing Advisor for all my policies/plans/accounts."
  checkMark(pg1, record.request_type === 'all_accounts', 47, 350, bold, 9); // COORD B.2 checkbox

  // ── B.2  Account-type sub-checkboxes ─────────────────────────────────────
  // Labels measured at specific y values; checkboxes drawn at x≈47, same y.
  const isAll = record.request_type === 'all_accounts';
  checkMark(pg1, isAll && !!record.account_individual_life, 47, 274.5, bold, 9); // COORD B.2 Individual Life
  checkMark(pg1, isAll && !!record.account_group_life, 47, 261.8, bold, 9); // COORD B.2 Group Life
  checkMark(pg1, isAll && !!record.account_mutual_fund, 47, 249.8, bold, 9); // COORD B.2 Mutual Fund
  checkMark(pg1, isAll && !!record.account_pre_need, 47, 236.8, bold, 9); // COORD B.2 Pre-Need Plans

  // ── B.2  Reference policy number (inline underline) ──────────────────────
  // "number:" ends at x=326.9 y=231.8; value starts x≈330, y≈226
  if (isAll && record.reference_policy_number) {
    txt(pg1, record.reference_policy_number, 330, 226, regular, VS); // COORD B.2 ref policy number
  }

  // ── C.  Reason for Change checkboxes ─────────────────────────────────────
  checkMark(pg1, record.reason_type === 'no_advisor', 47, 183.2, bold, 9); // COORD C "no advisor"
  checkMark(pg1, record.reason_type === 'prefer_another', 47, 171, bold, 9); // COORD C "prefer another"

  // ── C.  Reason details text (multi-line) ─────────────────────────────────
  // Below the two C options; approximate y≈153
  if (record.reason_type === 'prefer_another' && record.reason_details) {
    wrappedTxt(pg1, record.reason_details, 70, 153, 500, regular, VS); // COORD C reason details
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2  (612 × 792 pt)
  // ══════════════════════════════════════════════════════════════════════════

  // ── D.  New Advisor Name ─────────────────────────────────────────────────
  // Labels at y=721.8;  values at y≈705  (label_y − 15)
  txt(pg2, record.new_advisor_last_name, 35, 705, regular, VS); // COORD D Last Name
  txt(pg2, record.new_advisor_first_name, 218, 705, regular, VS); // COORD D First Name
  txt(pg2, record.new_advisor_middle_name, 401, 705, regular, VS); // COORD D Middle Name

  // ── E.1  Complete Name of Policy Owner ───────────────────────────────────
  // Labels at y=482.1;  values at y≈467
  txt(pg2, clientNameParts.last, 35, 467, regular, VS); // COORD E.1 Last Name
  txt(pg2, clientNameParts.first, 218, 467, regular, VS); // COORD E.1 First Name
  txt(pg2, clientNameParts.middle, 401, 467, regular, VS); // COORD E.1 Middle Name

  // ── E.1  Place of Signing ────────────────────────────────────────────────
  // Label at x=35 y=448.9;  value at y≈434
  txt(pg2, record.place_of_signing, 35, 434, regular, VS); // COORD E.1 Place of Signing

  // ── E.1  Date of Signing ─────────────────────────────────────────────────
  const sigDate = parseISODate(record.date_of_signing);
  drawDateInBoxes(pg2, sigDate, SIGNING_DATE_BOXES, regular, VS);

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
  // Code Number label x=218.2 y=369.3; value just below at y≈352
  txt(pg2, record.code_number, 218, 352, regular, VS); // COORD E.2 Code Number

  // ── E.2  NBO / ISO ────────────────────────────────────────────────────────
  // NBO/ISO label x=401.4 y=369.3; value at y≈352
  txt(pg2, record.nbo_iso, 401, 352, regular, VS); // COORD E.2 NBO/ISO

  // ── F.2  Wants Communication — Yes / No checkboxes ───────────────────────
  // "Yes" label x=142.4 y=167.8 → checkbox just left: x≈131.2, y≈161.5
  // "No"  label x=174.4 y=167.8 → checkbox just left: x≈163.2, y≈161.5
  checkMark(pg2, record.wants_communication === true, 131.2, 161.5, bold, 9); // COORD F.2 Yes
  checkMark(pg2, record.wants_communication === false, 163.2, 161.5, bold, 9); // COORD F.2 No

  // ── G.  For Office Use Only ───────────────────────────────────────────────

  // Complete Name of Staff — label x=153.5 y=117.2; value at y≈100
  txt(pg2, record.received_by_staff, 153.5, 100, regular, VS); // COORD G Staff Name

  // Receiving Department/Office — label x=367 y=117.2; value at y≈100
  txt(pg2, record.receiving_department, 367.7, 100, regular, VS); // COORD G Department

  // Date Received — character boxes
  const recDate = parseISODate(record.date_received);
  drawDateInBoxes(pg2, recDate, DATE_RECEIVED_BOXES, regular, VS);

  // Time Received — label x=327 y=77.6; value at y≈62
  txt(pg2, record.time_received, 327, 62, regular, VS); // COORD G Time Received

  // ── Serialise and return ──────────────────────────────────────────────────
  return pdfDoc.save();
}



