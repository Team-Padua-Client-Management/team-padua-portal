/**
 * pdfFormUtils.ts
 *
 * Shared PDF form utility module for pdf-lib AcroForm template rendering.
 * Provides uniform font configuration, explicit per-field font sizing,
 * N/A empty field normalization, and appearance updating across all PDF generators.
 */

import { PDFDocument, PDFForm, PDFFont, StandardFonts, PDFPage } from 'pdf-lib';

export const DEFAULT_PDF_FONT_SIZE = 9;
export const SMALL_PDF_FONT_SIZE = 8;
export const TINY_PDF_FONT_SIZE = 7.5;

export interface SetPdfTextFieldOptions {
  fontSize?: number;
  useDefaultFallback?: boolean;
  uppercase?: boolean;
}

/**
 * Normalizes field value:
 * - null / undefined / whitespace string -> 'N/A' (if useDefaultFallback is true)
 * - booleans -> 'YES' / 'NO'
 * - strings -> UPPERCASE (if uppercase is true)
 */
export function pdfValue(value: unknown, useDefaultFallback = true, uppercase = true): string {
  if (value === null || value === undefined) {
    return useDefaultFallback ? 'N/A' : '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return useDefaultFallback ? 'N/A' : '';
    return uppercase ? trimmed.toUpperCase() : trimmed;
  }
  if (typeof value === 'boolean') {
    return value ? 'YES' : 'NO';
  }
  const str = String(value).trim();
  return uppercase ? str.toUpperCase() : str;
}

/**
 * Initializes a PDFDocument form with an embedded Helvetica font.
 */
export async function initializePdfForm(pdfDoc: PDFDocument): Promise<{ form: PDFForm; font: PDFFont }> {
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return { form, font };
}

/**
 * Sets a text field value and explicitly applies its font size BEFORE setting text.
 * Prevents pdf-lib auto-fontSize scaling (0 Tf dynamic stretching).
 */
export function setPdfTextField(
  form: PDFForm,
  name: string,
  value: unknown,
  options: SetPdfTextFieldOptions = {}
): void {
  const {
    fontSize = DEFAULT_PDF_FONT_SIZE,
    useDefaultFallback = true,
    uppercase = true,
  } = options;

  const formatted = pdfValue(value, useDefaultFallback, uppercase);

  try {
    const field = form.getTextField(name);
    try {
      field.setFontSize(fontSize);
    } catch {
      // ignore if setting font size fails on specific field
    }
    field.setText(formatted);
  } catch (e) {
    // Field not present in this template - ignore silently
  }
}

/**
 * Safely checks or unchecks a PDF CheckBox field.
 */
export function setPdfCheckBox(form: PDFForm, name: string, checked: boolean): void {
  try {
    const field = form.getCheckBox(name);
    if (checked) {
      field.check();
    } else {
      field.uncheck();
    }
  } catch (e) {
    // Checkbox not present in this template - ignore silently
  }
}

/**
 * Splits string value into individual character boxes.
 */
export function setPdfCharBoxes(
  form: PDFForm,
  names: string[],
  value: string | null | undefined,
  fontSize: number = DEFAULT_PDF_FONT_SIZE
): void {
  if (!value) return;
  const chars = value.toUpperCase().split('');
  for (let i = 0; i < Math.min(chars.length, names.length); i++) {
    try {
      const field = form.getTextField(names[i]);
      try {
        field.setFontSize(fontSize);
      } catch { }
      field.setText(chars[i]);
    } catch {
      // ignore missing char box
    }
  }
}

/**
 * Formats ISO date (YYYY-MM-DD) to DD-MMM-YYYY (e.g. 10-AUG-2026).
 */
export function formatDateStandard(isoDate: string | null | undefined): string {
  if (!isoDate || typeof isoDate !== 'string' || !isoDate.trim()) return 'N/A';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate.toUpperCase();
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parts[2];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return isoDate.toUpperCase();
  return `${day.padStart(2, '0')}-${months[monthNum - 1]}-${year}`;
}

/**
 * Formats ISO date (YYYY-MM-DD) to DDMMMYYYY (e.g. 10AUG2026).
 */
export function formatDateAcro(isoDate: string | null | undefined): string {
  if (!isoDate || typeof isoDate !== 'string' || !isoDate.trim()) return 'N/A';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate.toUpperCase();
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parts[2];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return isoDate.toUpperCase();
  return `${day.padStart(2, '0')}${months[monthNum - 1]}${year}`;
}

/**
 * Shared signature image embedding for base64 PNG/JPG upload.
 */
export async function embedPdfSignature(
  pdfDoc: PDFDocument,
  pageIndexOrPage: number | PDFPage,
  base64: string | null | undefined,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number
): Promise<void> {
  if (!base64 || typeof base64 !== 'string') return;
  try {
    const page =
      typeof pageIndexOrPage === 'number'
        ? pdfDoc.getPages()[pageIndexOrPage]
        : pageIndexOrPage;
    if (!page) return;

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
  } catch (e) {
    console.warn('Failed to embed signature image:', e);
  }
}

/**
 * Regenerates field appearances using embedded Helvetica and flattens the form.
 */
export function finalizePdfForm(form: PDFForm, font: PDFFont): void {
  try {
    form.updateFieldAppearances(font);
  } catch (e) {
    console.warn('Could not update field appearances:', e);
  }
  form.flatten();
}
