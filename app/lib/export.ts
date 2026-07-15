import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPDFOptions {
  title: string;
  description?: string;
  headers: string[];
  rows: any[][];
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  stats?: { label: string; value: string | number }[];
}

export function exportToPDF({
  title,
  description,
  headers,
  rows,
  filename = 'export.pdf',
  orientation = 'landscape',
  stats
}: ExportPDFOptions) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Sun Life Yellow Accent Bar
  doc.setFillColor(255, 199, 44); // Sun Life Gold (#FFC72C)
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Title - Clean and Premium
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Charcoal (#111827)
  doc.text(title.toUpperCase(), 14, 15);

  // Description
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99); // Slate-600
  const descText = description || "Sun Life Financial - Official record ledger of active policies, advisor clients, and request visibility logs.";
  doc.text(descText, 14, 20);

  // Subtitle / Date Generated
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175); // Gray-400
  const generatedText = `Report generated on ${new Date().toLocaleString()} | Team Padua System Terminal`;
  doc.text(generatedText, 14, 24);

  // Divider Line
  doc.setDrawColor(243, 244, 246); // border gray-100
  doc.setLineWidth(0.3);
  doc.line(14, 27, pageWidth - 14, 27);

  let currentY = 30;

  // Render Stats Cards (Summary widgets) inside PDF
  if (stats && stats.length > 0) {
    const cardWidth = 55;
    const cardHeight = 15;
    const gap = 5;
    
    stats.forEach((s, idx) => {
      const x = 14 + idx * (cardWidth + gap);
      // Card Box background
      doc.setFillColor(250, 250, 250); // Gray-50
      doc.setDrawColor(229, 231, 235); // Gray-200
      // Draw rounded card borders
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      
      // Draw Sun Life Yellow left border indicator
      doc.setFillColor(255, 199, 44);
      doc.rect(x, currentY, 2, cardHeight, 'F');
      
      // Draw Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text(s.label.toUpperCase(), x + 4, currentY + 5.5);
      
      // Draw Value
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39); // Charcoal
      doc.text(String(s.value), x + 4, currentY + 11.5);
    });

    currentY += 21; // Advance Y past stats grid
  }

  // Generate Table using jspdf-autotable
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [255, 199, 44], // Sun Life Yellow (#FFC72C)
      textColor: [17, 24, 39], // Dark text
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [55, 65, 81] // Gray-700
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250] // Gray-50
    },
    margin: { left: 14, right: 14, top: 30, bottom: 15 },
    didDrawPage: (data) => {
      // Add Page Numbers in Footer
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // gray-400
      
      const pageText = `Page ${data.pageNumber}`;
      doc.text(pageText, pageWidth - 14 - doc.getTextWidth(pageText), pageHeight - 8);
      doc.text("CONFIDENTIAL RECORD - TEAM PADUA SYSTEM TERMINAL", 14, pageHeight - 8);
    }
  });

  doc.save(filename);
}

export function exportToDOCS(title: string, headers: string[], rows: any[][], filename: string = 'export.doc') {
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><meta charset="utf-8"><title>${title}</title>`;
  html += `<style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #333333; margin: 20px; }
    h1 { color: #111827; font-size: 18pt; margin-bottom: 5px; border-bottom: 3.5px solid #FFC72C; padding-bottom: 5px; }
    .desc { font-size: 10pt; color: #666666; margin-bottom: 20px; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background-color: #FFC72C; color: #111827; font-weight: bold; border: 1px solid #DDDDDD; padding: 8px; text-align: left; font-size: 10pt; }
    td { border: 1px solid #DDDDDD; padding: 8px; font-size: 9.5pt; }
    tr:nth-child(even) { background-color: #F9FAFB; }
    .footer { font-size: 9pt; color: #999999; margin-top: 30px; text-align: center; }
  </style></head><body>`;
  
  html += `<h1>${title.toUpperCase()}</h1>`;
  html += `<p class="desc">Report generated on ${new Date().toLocaleString()} | Team Padua System Terminal</p>`;
  
  html += `<table><thead><tr>`;
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += `</tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>`;
    row.forEach(val => {
      html += `<td>${val === null || val === undefined ? '' : String(val)}</td>`;
    });
    html += `</tr>`;
  });
  
  html += `</tbody></table>`;
  html += `<p class="footer">Confidential Record - Team Padua System Terminal</p>`;
  html += `</body></html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
