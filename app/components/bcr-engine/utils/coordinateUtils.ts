/**
 * Utility function to convert PDF Point Coordinates (origin bottom-left, width 612, height 792)
 * into Canvas CSS Pixel Coordinates (origin top-left, scaled) for 1:1 overlay alignment.
 */
export function pdfPointToCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth: number = 612,
  pageHeight: number = 792,
  scale: number = 1.0
) {
  // Convert PDF Y coordinate (bottom-left origin) to Canvas Y coordinate (top-left origin)
  const left = x * scale;
  const top = (pageHeight - (y + height)) * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return {
    left,
    top,
    width: scaledWidth,
    height: scaledHeight,
  };
}
