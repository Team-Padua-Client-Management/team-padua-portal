const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    const form = doc.getForm();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const page2 = pages[1];

    // 1. Set AcroForm fields
    const f23 = form.getTextField('23');
    const f26 = form.getTextField('26');
    f23.setText('JUAN DELA CRUZ');
    f26.setText('MARIA SANTOS');

    // 2. Dual-guarantee drawText fallback
    page2.drawText('JUAN DELA CRUZ', {
      x: 310,
      y: 590,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    page2.drawText('MARIA SANTOS', {
      x: 310,
      y: 536,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });

    form.updateFieldAppearances(font);
    form.flatten();

    const outputBytes = await doc.save();
    fs.writeFileSync('./scratch/test_out.pdf', outputBytes);
    console.log('Saved test_out.pdf successfully!');
  } catch (err) {
    console.error(err);
  }
})();
