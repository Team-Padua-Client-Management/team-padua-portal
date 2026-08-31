const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    
    // Print page counts and dimensions
    const pages = doc.getPages();
    console.log('Total Pages:', pages.length);
    pages.forEach((p, idx) => {
      const { width, height } = p.getSize();
      console.log(`Page ${idx+1}: width=${width}, height=${height}`);
    });
  } catch (err) {
    console.error(err);
  }
})();
