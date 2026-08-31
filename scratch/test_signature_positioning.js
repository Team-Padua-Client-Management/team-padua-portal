const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    const page2 = pages[1];

    // Create a dummy transparent PNG or draw rectangles to see exact positioning
    // Test Y = 590 for Policy Owner (Row 1)
    page2.drawRectangle({
      x: 55,
      y: 590,
      width: 220,
      height: 25,
      borderColor: rgb(1, 0, 0),
      borderWidth: 1,
    });

    // Test Y = 536 for Witness (Row 3)
    page2.drawRectangle({
      x: 55,
      y: 536,
      width: 220,
      height: 25,
      borderColor: rgb(1, 0, 0),
      borderWidth: 1,
    });

    const outputBytes = await doc.save();
    fs.writeFileSync('./scratch/signature_position_test.pdf', outputBytes);
    console.log('Saved signature_position_test.pdf successfully!');
  } catch (err) {
    console.error(err);
  }
})();
