import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = 'public/forms/SLOCPI_Advisor_Change_Request.pdf';
const loadingTask = pdfjs.getDocument(pdfPath);
const doc = await loadingTask.promise;

for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  console.log(`--- Page ${pageNum} ---`);
  const page = await doc.getPage(pageNum);
  const textContent = await page.getTextContent();
  for (const item of textContent.items) {
    if (item.str.trim()) {
      console.log(`Text: "${item.str}" at [x: ${item.transform[4].toFixed(1)}, y: ${item.transform[5].toFixed(1)}]`);
    }
  }
}
