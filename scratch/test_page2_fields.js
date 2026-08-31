const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    const form = doc.getForm();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // List of Page 2 fields to test
    const page2FieldNames = ['23', '24_1', '25_1', '26', '28_1', '27', '29', '30', '31', '34', '35', '36', '37', '24', '25', '28'];

    page2FieldNames.forEach((name) => {
      try {
        const field = form.getTextField(name);
        try { field.setFontSize(8); } catch(e){}
        field.setText(`[FIELD ${name}]`);
      } catch (e) {
        console.warn(`Field ${name} not found`);
      }
    });

    form.updateFieldAppearances(font);
    form.flatten();

    const outputBytes = await doc.save();
    fs.writeFileSync('./scratch/page2_field_test.pdf', outputBytes);
    console.log('Saved page2_field_test.pdf successfully!');
  } catch (err) {
    console.error(err);
  }
})();
