const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function main() {
  const existingPdfBytes = fs.readFileSync('public/templates/SLOCPI_Advisor_Change_Request.pdf');
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    console.log(`Page ${index + 1}: width = ${width}, height = ${height}`);
  });
}

main().catch(console.error);
