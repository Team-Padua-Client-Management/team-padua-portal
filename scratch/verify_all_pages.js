const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    const form = doc.getForm();
    const fields = form.getFields();

    console.log('=== COMPLETE FIELD & PAGE MAP ===');
    fields.forEach((f, idx) => {
      const name = f.getName();
      const type = f.constructor.name;
      const widgets = f.acroField.getWidgets();
      widgets.forEach((w) => {
        const rect = w.getRectangle();
        const pRef = w.P();
        let pageNum = 'unknown';
        doc.getPages().forEach((pg, pIdx) => {
          if (pg.ref === pRef) pageNum = pIdx + 1;
        });
        console.log(`Index: ${idx + 1} | Field: "${name}" | Type: ${type} | Page: ${pageNum} | Rect: x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)}, w=${rect.width.toFixed(1)}, h=${rect.height.toFixed(1)}`);
      });
    });
  } catch (err) {
    console.error(err);
  }
})();
