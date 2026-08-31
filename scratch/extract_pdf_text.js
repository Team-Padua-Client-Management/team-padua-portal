const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFRawStream } = require('pdf-lib');

(async () => {
  try {
    const filePath = path.join(__dirname, '../public/forms/VRFW.07.24.pdf');
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes);
    
    doc.getPages().forEach((page, index) => {
      console.log(`\n=================== PAGE ${index + 1} ===================`);
      const { node } = page;
      const contentsObj = node.get(doc.context.obj('Contents'));
      // Let's print all streams
      doc.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
        if (obj instanceof PDFRawStream) {
          try {
            const data = obj.getContents();
            const text = Buffer.from(data).toString('latin1');
            const matches = text.match(/\((.*?)\)/g);
            if (matches && matches.length > 5) {
              const clean = matches.map(m => m.slice(1, -1)).filter(s => s.trim().length > 1);
              if (clean.length > 5) {
                console.log(`Stream ${ref.toString()}:`, clean.slice(0, 30).join(' '));
              }
            }
          } catch(e) {}
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
})();
