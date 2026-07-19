import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { FormRecord } from '@/app/(admin)/admin/(ClientServicing)/acr/page';

const GAP_AFTER_HEADER = 10;
const GAP_LABEL_TO_INPUT = 6;
const GAP_ROW = 12;
const GAP_SECTION = 14;
const CELL_PADDING = 5;

export async function generateAdvisorChangeRequestPdf(
  record: FormRecord,
  clientNameParts: { last: string; first: string; middle: string },
  clientDob: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const page2 = pdfDoc.addPage([595.28, 841.89]);

  const marginX = 40;
  const contentWidth = page1.getWidth() - marginX * 2;
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const borderColor = rgb(0.6, 0.6, 0.6);
  const sunlifeGold = rgb(0.95, 0.69, 0.09);
  const dateFieldBg = rgb(1, 1, 1);
  const dateFieldBorder = rgb(0.6, 0.6, 0.6);

  const measureWrappedLines = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
    if (!text) return [];
    const paragraphs = text.split(/\r\n|\r|\n/);
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        lines.push('');
        continue;
      }
      const words = trimmed.split(' ').filter(w => w.length > 0);
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + ' ' + word, size);
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  const drawWrappedText = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
    lineHeight: number,
    color = black
  ) => {
    const lines = measureWrappedLines(text, maxWidth, font, size);
    let currentY = y;
    for (const line of lines) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
    }
    return currentY;
  };

  const drawMixedText = (
    page: PDFPage,
    segments: { text: string; bold: boolean }[],
    x: number,
    y: number,
    maxWidth: number,
    sizeRegular: number,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    lineHeight: number
  ) => {
    let currentY = y;
    type Token = { word: string; font: PDFFont; size: number };
    const tokens: Token[] = [];
    for (const seg of segments) {
      const cleanText = seg.text.replace(/\r\n|\r|\n/g, ' ');
      const words = cleanText.split(' ');
      for (let w = 0; w < words.length; w++) {
        if (w < words.length - 1 || cleanText.endsWith(' ')) {
          tokens.push({ word: words[w] + ' ', font: seg.bold ? fontBold : fontRegular, size: sizeRegular });
        } else {
          tokens.push({ word: words[w], font: seg.bold ? fontBold : fontRegular, size: sizeRegular });
        }
      }
    }

    let lineTokens: Token[] = [];
    let lineWidth = 0;

    const drawLine = () => {
      let dx = x;
      for (const t of lineTokens) {
        page.drawText(t.word, { x: dx, y: currentY, size: t.size, font: t.font, color: black });
        dx += t.font.widthOfTextAtSize(t.word, t.size);
      }
      currentY -= lineHeight;
      lineTokens = [];
      lineWidth = 0;
    };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.word === '') continue;
      const wordW = t.font.widthOfTextAtSize(t.word, t.size);

      if (lineWidth + wordW > maxWidth && lineTokens.length > 0) {
        drawLine();
      }
      lineTokens.push(t);
      lineWidth += wordW;
    }
    if (lineTokens.length > 0) {
      drawLine();
    }
    return currentY;
  };

  const drawBorderedBox = (
    page: PDFPage,
    x: number,
    y: number,
    width: number,
    height: number | 'auto',
    label: string,
    value: string
  ) => {
    const labelSize = 7;
    const valueSize = 9;
    const lineHeight = 11;

    const lines = measureWrappedLines(value || '', width - 8, helveticaFont, valueSize);

    let boxHeight = typeof height === 'number' ? height : 0;
    if (height === 'auto') {
      boxHeight = 16 + lines.length * lineHeight + 4;
    }

    page.drawRectangle({
      x,
      y: y - boxHeight,
      width,
      height: boxHeight,
      borderColor: borderColor,
      borderWidth: 0.75,
    });

    if (label) {
      drawWrappedText(page, label, x + 4, y - 10, width - 8, helveticaFont, labelSize, 8);
    }

    if (value) {
      if (height !== 'auto') {
        let displayVal = value || '';
        if (helveticaFont.widthOfTextAtSize(displayVal, valueSize) > width - 8) {
          while (displayVal.length > 0 && helveticaFont.widthOfTextAtSize(displayVal + '...', valueSize) > width - 8) {
            displayVal = displayVal.slice(0, -1);
          }
          displayVal += '...';
        }
        page.drawText(displayVal, { x: x + 4, y: y - boxHeight + 6, size: valueSize, font: helveticaFont, color: black });
      } else {
        drawWrappedText(page, value, x + 4, y - 22, width - 8, helveticaFont, valueSize, lineHeight);
      }
    }

    return y - boxHeight;
  };

  const drawPlainBox = (
    page: PDFPage,
    x: number,
    y: number,
    width: number,
    height: number,
    value: string
  ) => {
    const valueSize = 9;
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      borderColor: borderColor,
      borderWidth: 0.75,
    });
    if (value) {
      page.drawText(value, { x: x + 4, y: y - height / 2 - 3, size: valueSize, font: helveticaFont, color: black });
    }
    return y - height;
  };

  const drawSectionHeader = (page: PDFPage, letter: string, title: string, y: number) => {
    const height = 18;
    page.drawRectangle({
      x: marginX,
      y: y - height,
      width: contentWidth,
      height,
      color: black,
    });

    page.drawText(`[${letter}]`, { x: marginX + 6, y: y - height + 5, size: 11, font: helveticaBold, color: white });
    page.drawText(title, { x: marginX + 30, y: y - height + 5, size: 10, font: helveticaBold, color: white });
    return y - height;
  };

  const drawCheckbox = (page: PDFPage, checked: boolean, x: number, y: number) => {
    const size = 7;
    const fillColor = rgb(0.99, 0.93, 0.72);
    page.drawRectangle({
      x, y: y - size, width: size, height: size,
      color: fillColor,
      borderColor: rgb(0.55, 0.45, 0.15),
      borderWidth: 0.6,
    });
    if (checked) {
      const markSize = 6;
      page.drawText('X', {
        x: x + (size - markSize * 0.6) / 2,
        y: y - size + (size - markSize) / 2 + 0.5,
        size: markSize,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    return y - size;
  };

  const drawNameDateTable = (
    page: PDFPage,
    x: number,
    y: number,
    width: number,
    parts: { last: string; first: string; middle: string },
    dateLabel: string,
    dateStr: string,
    isDob: boolean,
    height: number = 35
  ) => {
    const colW = width / 4;

    page.drawRectangle({ x, y: y - height, width, height, borderColor, borderWidth: 0.75 });

    for (let i = 1; i <= 3; i++) {
      page.drawLine({ start: { x: x + colW * i, y: y }, end: { x: x + colW * i, y: y - height }, thickness: 0.75, color: borderColor });
    }

    if (isDob) {
      page.drawText('For Individual Account only', { x: x + width - 110, y: y + 2, size: 7, font: helveticaBold, color: black });
    }

    page.drawText('Last Name', { x: x + 4, y: y - 10, size: 7, font: helveticaFont, color: black });
    page.drawText('First Name', { x: x + colW + 4, y: y - 10, size: 7, font: helveticaFont, color: black });
    page.drawText('Middle Name', { x: x + colW * 2 + 4, y: y - 10, size: 7, font: helveticaFont, color: black });
    page.drawText(dateLabel, { x: x + colW * 3 + 4, y: y - 10, size: 7, font: helveticaFont, color: black });

    const subY = y - height + 3;
    const subY2 = y - height + 13;
    page.drawRectangle({ x: x + colW * 3 + 10, y: subY2 - 2, width: 20, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });
    page.drawRectangle({ x: x + colW * 3 + 40, y: subY2 - 2, width: 30, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });
    page.drawRectangle({ x: x + colW * 3 + 80, y: subY2 - 2, width: 35, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });

    page.drawText('Day', { x: x + colW * 3 + 12, y: subY, size: 6, font: helveticaFont, color: black });
    page.drawText('Month', { x: x + colW * 3 + 42, y: subY, size: 6, font: helveticaFont, color: black });
    page.drawText('Year', { x: x + colW * 3 + 82, y: subY, size: 6, font: helveticaFont, color: black });

    page.drawText(parts.last || '', { x: x + 4, y: y - 22, size: 9, font: helveticaFont, color: black });
    page.drawText(parts.first || '', { x: x + colW + 4, y: y - 22, size: 9, font: helveticaFont, color: black });
    page.drawText(parts.middle || '', { x: x + colW * 2 + 4, y: y - 22, size: 9, font: helveticaFont, color: black });

    if (dateStr) {
      const dParts = dateStr.split('-');
      if (dParts.length === 3) {
        page.drawText(dParts[0], { x: x + colW * 3 + 12, y: subY2, size: 9, font: helveticaFont, color: black });
        page.drawText(dParts[1], { x: x + colW * 3 + 42, y: subY2, size: 9, font: helveticaFont, color: black });
        page.drawText(dParts[2], { x: x + colW * 3 + 82, y: subY2, size: 9, font: helveticaFont, color: black });
      }
    }

    return y - height;
  };

  const drawDateBox = (
    page: PDFPage,
    x: number,
    y: number,
    width: number,
    label: string,
    dateStr: string,
    height: number = 28
  ) => {
    page.drawRectangle({ x, y: y - height, width, height, borderColor, borderWidth: 0.75 });
    page.drawText(label, { x: x + 4, y: y - 10, size: 7, font: helveticaFont, color: black });

    const subY = y - height + 3;
    const subY2 = y - height + 13;
    page.drawRectangle({ x: x + 10, y: subY2 - 2, width: 20, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });
    page.drawRectangle({ x: x + 40, y: subY2 - 2, width: 30, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });
    page.drawRectangle({ x: x + 80, y: subY2 - 2, width: 35, height: 12, color: dateFieldBg, borderColor: dateFieldBorder, borderWidth: 0.5 });

    page.drawText('Day', { x: x + 12, y: subY, size: 6, font: helveticaFont, color: black });
    page.drawText('Month', { x: x + 42, y: subY, size: 6, font: helveticaFont, color: black });
    page.drawText('Year', { x: x + 82, y: subY, size: 6, font: helveticaFont, color: black });

    if (dateStr) {
      const dParts = dateStr.split('-');
      if (dParts.length === 3) {
        page.drawText(dParts[0], { x: x + 12, y: subY2, size: 9, font: helveticaFont, color: black });
        page.drawText(dParts[1], { x: x + 42, y: subY2, size: 9, font: helveticaFont, color: black });
        page.drawText(dParts[2], { x: x + 82, y: subY2, size: 9, font: helveticaFont, color: black });
      }
    }

    return y - height;
  };

  const embedSignature = async (page: PDFPage, base64Str: string, x: number, y: number, maxW: number, maxH: number) => {
    if (!base64Str) return;
    try {
      const parts = base64Str.split(',');
      if (parts.length !== 2) return;
      const imgBytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
      let image;
      if (parts[0].includes('png')) {
        image = await pdfDoc.embedPng(imgBytes);
      } else if (parts[0].includes('jpeg') || parts[0].includes('jpg')) {
        image = await pdfDoc.embedJpg(imgBytes);
      } else return;
      const scaled = image.scaleToFit(maxW, maxH);
      page.drawImage(image, {
        x: x + (maxW - scaled.width) / 2,
        y: y + (maxH - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } catch (e) { }
  };

  let cursorY = page1.getHeight();

  const bannerHeight = 60;
  page1.drawRectangle({ x: 0, y: cursorY - bannerHeight, width: page1.getWidth(), height: bannerHeight, color: sunlifeGold });
  page1.drawText('Advisor Change Request', { x: marginX, y: cursorY - 35, size: 20, font: helveticaBold, color: black });

  try {
    const logoUrl = '/images/sunlife-logo.png';
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const scaled = logoImage.scaleToFit(120, 40);
      page1.drawImage(logoImage, {
        x: page1.getWidth() - marginX - scaled.width,
        y: cursorY - 50 + (40 - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } else {
      throw new Error('logo fetch failed');
    }
  } catch (e) {
    page1.drawText('Sun Life', { x: page1.getWidth() - marginX - 80, y: cursorY - 35, size: 20, font: helveticaBold, color: black });
  }

  cursorY -= bannerHeight + GAP_ROW;

  const introText = 'In this form "you" and "your" refer to the policy owner/plan holder/investor/company\'s authorized representative accomplishing this form, while we, us, our, and the Company refer to Sun Life of Canada (Philippines), Inc., Sun Life Financial Plans, Inc., or Sun Life Asset Management Co., Inc., which are members of the Sun Life group of companies.';
  cursorY = drawWrappedText(page1, introText, marginX, cursorY, contentWidth, helveticaFont, 8, 10);
  cursorY -= GAP_ROW;

  page1.drawText('IMPORTANT NOTES:', { x: marginX, y: cursorY, size: 8, font: helveticaBold, color: black });
  cursorY -= GAP_LABEL_TO_INPUT;

  const notesLine1 = 'You must accomplish and submit the completed form with your valid ID to any of the following:';
  cursorY = drawWrappedText(page1, notesLine1, marginX, cursorY, contentWidth, helveticaFont, 7, 9);
  cursorY -= GAP_LABEL_TO_INPUT;

  const colWidth = contentWidth * 0.48;
  const colRightX = marginX + contentWidth * 0.52;

  const item1Y = drawWrappedText(
    page1,
    "1. Sun Life of Canada (Philippines), Inc.\n   Client Support Services\n   5th Ave. cor Rizal Drive, Bonifacio Global City\n   Taguig City, Philippines, 1634",
    marginX, cursorY, colWidth, helveticaFont, 7, 9
  );

  let rightY = drawWrappedText(
    page1,
    "2. Any Financial Store or Client Service Center. Our address and business number are available online at www.sunlife.com.ph. Kindly find one nearest you. Click 'About Us', and hover to 'Where to find us'.",
    colRightX, cursorY, colWidth, helveticaFont, 7, 9
  );
  rightY -= 4;
  rightY = drawWrappedText(page1, '3. Email us at sunlink@sunlife.com', colRightX, rightY, colWidth, helveticaFont, 7, 9);

  cursorY = Math.min(item1Y, rightY) - GAP_ROW;

  const instructionText = 'Write legibly using capital letters. Write N/A if question is not applicable. Mark the box(es) with an "X" to indicate your choice(s) then sign the form only when completely filled out.';
  cursorY = drawWrappedText(page1, instructionText, marginX, cursorY, contentWidth, helveticaOblique, 8, 10);
  cursorY -= GAP_SECTION;

  cursorY = drawSectionHeader(page1, 'A', 'General Information', cursorY);
  cursorY -= GAP_AFTER_HEADER;

  page1.drawText('A.1 Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor', { x: marginX, y: cursorY, size: 8, font: helveticaBold, color: black });
  cursorY -= GAP_LABEL_TO_INPUT;

  let dobStr = '';
  if (clientDob) {
    const parts = clientDob.split('-');
    if (parts.length === 3) dobStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  cursorY = drawNameDateTable(page1, marginX, cursorY, contentWidth, clientNameParts, 'Date of Birth [e.g. 01-JAN-2020]', dobStr, true);
  cursorY -= GAP_ROW;

  page1.drawText('A2. Company Name', { x: marginX, y: cursorY, size: 8, font: helveticaBold, color: black });
  page1.drawText('Designation', { x: marginX + contentWidth / 2, y: cursorY, size: 8, font: helveticaBold, color: black });
  cursorY -= GAP_LABEL_TO_INPUT;
  drawPlainBox(page1, marginX, cursorY, contentWidth / 2 - 6, 26, record.company_name);
  cursorY = drawPlainBox(page1, marginX + contentWidth / 2, cursorY, contentWidth / 2, 26, record.designation);
  cursorY -= GAP_SECTION;

  cursorY = drawSectionHeader(page1, 'B', 'Request Details (choose one below)', cursorY);
  cursorY -= GAP_AFTER_HEADER;

  cursorY = drawWrappedText(page1, 'B.1 Request a particular policy/plan/account number(s) only.', marginX, cursorY, contentWidth, helveticaBold, 9, 11);
  cursorY = drawWrappedText(
    page1,
    'Specify below the policy/plan/account number(s) to be transferred (incorrect policy/plan/account number(s) will not be processed):',
    marginX + 15, cursorY, contentWidth - 15, helveticaFont, 8, 10
  );
  cursorY -= GAP_LABEL_TO_INPUT;

  if (record.request_type === 'specific_policy' && record.policy_numbers) {
    cursorY = drawBorderedBox(page1, marginX + 15, cursorY, contentWidth - 15, 'auto', '', record.policy_numbers);
  } else {
    cursorY = drawBorderedBox(page1, marginX + 15, cursorY, contentWidth - 15, 30, '', '');
  }
  cursorY -= GAP_SECTION;

  cursorY = drawWrappedText(
    page1,
    "B.2 Request will apply to ALL existing client's account as of date of request (select the applicable type of account to be transferred):",
    marginX, cursorY, contentWidth, helveticaBold, 9, 11
  );
  cursorY -= GAP_LABEL_TO_INPUT;

  const isAll = record.request_type === 'all_accounts';

  drawCheckbox(page1, isAll && !!record.account_individual_life, marginX + 15, cursorY);
  page1.drawText('All Individual Life Insurance Policies', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= GAP_ROW;

  drawCheckbox(page1, isAll && !!record.account_group_life, marginX + 15, cursorY);
  page1.drawText('All Group Life Insurance Contracts (for Policyholder of Group Insurance)', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= GAP_ROW;

  drawCheckbox(page1, isAll && !!record.account_mutual_fund, marginX + 15, cursorY);
  page1.drawText('All Mutual Fund Accounts', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= GAP_ROW;

  drawCheckbox(page1, isAll && !!record.account_pre_need, marginX + 15, cursorY);
  page1.drawText('All Pre-Need Plans', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= (GAP_ROW + 10);

  cursorY = drawWrappedText(page1, 'For our reference, specify at least one policy/plan/account number:', marginX + 15, cursorY, contentWidth - 15, helveticaFont, 9, 11);
  const underlineStartX = marginX + 280;
  page1.drawLine({ start: { x: underlineStartX, y: cursorY + 9 }, end: { x: underlineStartX + 200, y: cursorY + 9 }, thickness: 0.75, color: black });
  if (isAll && record.reference_policy_number) {
    page1.drawText(record.reference_policy_number, { x: underlineStartX + 5, y: cursorY + 11, size: 9, font: helveticaFont, color: black });
  }
  cursorY -= GAP_SECTION;

  cursorY = drawSectionHeader(page1, 'C', 'Reason for Change', cursorY);
  cursorY -= GAP_AFTER_HEADER;

  drawCheckbox(page1, record.reason_type === 'no_advisor', marginX + 15, cursorY);
  page1.drawText('You have no Advisor', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= GAP_ROW;

  drawCheckbox(page1, record.reason_type === 'prefer_another', marginX + 15, cursorY);
  page1.drawText('You prefer another Advisor (provide reason below)', { x: marginX + 28, y: cursorY - 7, size: 9, font: helveticaFont, color: black });
  cursorY -= (GAP_ROW + 6);

  if (record.reason_type === 'prefer_another' && record.reason_details) {
    cursorY = drawBorderedBox(page1, marginX + 15, cursorY, contentWidth - 15, 'auto', '', record.reason_details);
  } else {
    cursorY = drawBorderedBox(page1, marginX + 15, cursorY, contentWidth - 15, 30, '', '');
  }

  let cursorY2 = page2.getHeight() - 30;

  cursorY2 = drawSectionHeader(page2, 'D', 'New Advisor Information', cursorY2);
  cursorY2 -= 8;

  page2.drawText("New Advisor's Full Name", { x: marginX, y: cursorY2, size: 8, font: helveticaBold, color: black });
  cursorY2 -= 5;

  const colW3 = contentWidth / 3;
  drawBorderedBox(page2, marginX, cursorY2, colW3, 24, 'Last Name', record.new_advisor_last_name);
  drawBorderedBox(page2, marginX + colW3, cursorY2, colW3, 24, 'First Name', record.new_advisor_first_name);
  cursorY2 = drawBorderedBox(page2, marginX + colW3 * 2, cursorY2, colW3, 24, 'Middle Name', record.new_advisor_middle_name);
  cursorY2 -= 10;

  cursorY2 = drawSectionHeader(page2, 'E', 'Signatures', cursorY2);
  cursorY2 -= 8;

  cursorY2 = drawWrappedText(page2, 'By signing below, you confirm your understanding and agreement to the following:', marginX, cursorY2, contentWidth, helveticaBold, 7.5, 9);
  cursorY2 -= 4;

  const disclaimers = [
    'a. All services relating to your account(s) as indicated in this form shall be coursed through your new servicing advisor.',
    'b. You will inform us within 30 calendar days of any change in your circumstances, including but not limited to citizenship, and submit the applicable document accordingly.',
    "c. You acknowledge the Company's statutory responsibility to provide your information, including but not limited to local or foreign tax status, to the appropriate authority.",
    'd. You acknowledge that the Company, its employees, duly authorized representatives, related companies, third party service providers and vendors, shall process and share your and insured\'s information, with any person or organization to (i) service this account, (ii) process claims and enforce the contract, and (iii) pursue its legitimate and lawful rights and interests and other purposes allowed under privacy laws and regulations.',
    "e. Your personal data shall be retained throughout the existence of your account(s) and/or until expiration of the retention limit set by laws and regulations from account closure and the period set for destruction or disposal of records. You certify that you have read, understood and agree with the declarations and authorizations above, including Sun Life's privacy policy found in https://online.sunlife.com.ph/privacy.",
    'f. Your rights include the right to be informed, access your data, rectify errors, object to processing, and file a complaint. For more information about your rights and how we protect your data, you may access our privacy policy at https://online.sunlife.com.ph/privacy. Should you have any concerns in relation to your rights or the processing of your personal data, you may get in touch with our Data Protection Officer at privacyconcern@sunlife.com.',
  ];

  disclaimers.forEach(d => {
    cursorY2 = drawWrappedText(page2, d, marginX + 12, cursorY2, contentWidth - 12, helveticaFont, 6.5, 8);
    cursorY2 -= 3;
  });

  cursorY2 -= 5;
  cursorY2 = drawWrappedText(
    page2,
    'E.1 Complete Name of Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor',
    marginX, cursorY2, contentWidth, helveticaBold, 7.5, 9
  );
  cursorY2 -= 5;

  let sigDateStr = '';
  if (record.date_of_signing) {
    const parts = record.date_of_signing.split('-');
    if (parts.length === 3) sigDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  cursorY2 = drawNameDateTable(page2, marginX, cursorY2, contentWidth, clientNameParts, 'Date of Signing [e.g. 01-JAN-2019]', sigDateStr, false, 32);
  cursorY2 -= 8;

  cursorY2 = drawBorderedBox(page2, marginX, cursorY2, contentWidth, 24, 'Place of Signing', record.place_of_signing);
  cursorY2 -= 8;

  page2.drawText('E.2 Accepted:', { x: marginX, y: cursorY2, size: 8, font: helveticaBold, color: black });
  cursorY2 -= 5;

  const ownerSigHeight = 38;
  page2.drawRectangle({ x: marginX, y: cursorY2 - ownerSigHeight, width: contentWidth, height: ownerSigHeight, borderColor: borderColor, borderWidth: 0.75 });
  drawWrappedText(page2, 'Signature of Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor', marginX + 4, cursorY2 - 9, contentWidth - 8, helveticaFont, 6.5, 8);
  await embedSignature(page2, record.policy_owner_signature, marginX, cursorY2 - ownerSigHeight, contentWidth, ownerSigHeight - 14);
  cursorY2 -= ownerSigHeight;
  cursorY2 -= 4;

  const sigBoxHeight = 32;
  const newAdvSigW = contentWidth * 0.5;
  const codeNboW = contentWidth * 0.25;

  page2.drawRectangle({ x: marginX, y: cursorY2 - sigBoxHeight, width: newAdvSigW, height: sigBoxHeight, borderColor, borderWidth: 0.75 });
  drawWrappedText(page2, 'Signature of New Advisor', marginX + 4, cursorY2 - 9, newAdvSigW - 8, helveticaFont, 6.5, 8);
  await embedSignature(page2, record.new_advisor_signature, marginX, cursorY2 - sigBoxHeight, newAdvSigW, sigBoxHeight - 12);

  drawBorderedBox(page2, marginX + newAdvSigW, cursorY2, codeNboW, sigBoxHeight, 'Code Number', record.code_number);
  cursorY2 = drawBorderedBox(page2, marginX + newAdvSigW + codeNboW, cursorY2, codeNboW, sigBoxHeight, 'NBO/ISO', record.nbo_iso);

  cursorY2 -= 10;
  const lbHeight = 16;
  page2.drawRectangle({
    x: marginX,
    y: cursorY2 - lbHeight,
    width: contentWidth,
    height: lbHeight,
    color: black,
  });

  drawWrappedText(
    page2,
    'Let us serve you better! Updating made easier. You may now update your contact information via the Client Portal or Mobile App.',
    marginX + 6, cursorY2 - 10, contentWidth - 12, helveticaBold, 7.5, 9, white
  );

  cursorY2 -= lbHeight;

  const tableY = cursorY2;
  const col1W = contentWidth / 2;
  const col2W = contentWidth / 2;
  const r1pad = CELL_PADDING;

  let r1LeftY = tableY - r1pad - 7;
  r1LeftY = drawMixedText(
    page2,
    [
      { text: 'Option 1: Via ', bold: false },
      { text: 'Client Portal', bold: true },
      { text: ' (www.sunlife.com.ph)', bold: false },
    ],
    marginX + r1pad, r1LeftY, col1W - r1pad * 2, 7.5, helveticaFont, helveticaBold, 9
  );

  let r1RightY = tableY - r1pad - 7;
  r1RightY = drawMixedText(
    page2,
    [
      { text: 'Option 2: Via ', bold: false },
      { text: 'Mobile App', bold: true },
    ],
    marginX + col1W + r1pad, r1RightY, col2W - r1pad * 2 - 40, 7.5, helveticaFont, helveticaBold, 9
  );

  const qrSize = 34;
  try {
    const qrRes = await fetch('/images/sunlife-qr-code.png');
    if (qrRes.ok) {
      const qrBytes = await qrRes.arrayBuffer();
      const qrImage = await pdfDoc.embedPng(qrBytes);
      page2.drawImage(qrImage, {
        x: marginX + col1W + col2W - r1pad - qrSize,
        y: tableY - r1pad - qrSize,
        width: qrSize,
        height: qrSize,
      });
    }
  } catch (e) { }

  r1RightY -= 6;
  r1RightY = drawMixedText(
    page2,
    [
      { text: 'Download the ', bold: false },
      { text: 'Sun Life PH App', bold: true },
      { text: ' at App/Play Store or Scan the QR code ->', bold: false },
    ],
    marginX + col1W + r1pad, r1RightY, col2W - r1pad * 2 - 40, 7.5, helveticaFont, helveticaBold, 9
  );

  const row1Bottom = Math.min(r1LeftY, r1RightY - 6) - r1pad;
  const row1Height = tableY - row1Bottom;

  const drawNumbered = (page: PDFPage, num: string, segments: { text: string; bold: boolean }[], x: number, y: number, w: number) => {
    page.drawText(num, { x, y, size: 7.5, font: helveticaFont, color: black });
    return drawMixedText(page, segments, x + 11, y, w - 11, 7.5, helveticaFont, helveticaBold, 9);
  };

  let r2LeftY = row1Bottom - r1pad - 7;
  r2LeftY = drawNumbered(page2, '1.', [
    { text: 'Visit ', bold: false }, { text: 'sunlife.com.ph', bold: true }, { text: ' and click on the ', bold: false }, { text: 'Sign In', bold: true }, { text: ' button.', bold: false },
  ], marginX + r1pad, r2LeftY, col1W - r1pad * 2);

  r2LeftY -= 4;
  r2LeftY = drawNumbered(page2, '2.', [
    { text: 'Click ', bold: false }, { text: 'Settings', bold: true }, { text: ' and select edit ', bold: false }, { text: 'Contract Details/Mailing Address', bold: true },
  ], marginX + r1pad, r2LeftY, col1W - r1pad * 2);

  r2LeftY -= 4;
  r2LeftY = drawNumbered(page2, '3.', [
    { text: 'Update relevant details then click ', bold: false }, { text: 'Save.', bold: true },
  ], marginX + r1pad, r2LeftY, col1W - r1pad * 2);

  let r2RightY = row1Bottom - r1pad - 7;
  r2RightY = drawNumbered(page2, '1.', [
    { text: 'Login to your ', bold: false }, { text: 'Sun Life PH', bold: true }, { text: ' Mobile App', bold: false },
  ], marginX + col1W + r1pad, r2RightY, col2W - r1pad * 2);

  r2RightY -= 4;
  r2RightY = drawNumbered(page2, '2.', [
    { text: 'Click ', bold: false }, { text: 'Service Request', bold: true }, { text: ' and click ', bold: false }, { text: 'Personal Details/Update Mailing Address', bold: true },
  ], marginX + col1W + r1pad, r2RightY, col2W - r1pad * 2);

  r2RightY -= 4;
  r2RightY = drawNumbered(page2, '3.', [
    { text: 'Click ', bold: false }, { text: 'Edit', bold: true }, { text: ' button on your Mobile, International, Home, Business No., or Email Address and/or on your Permanent, Present, or Business Address', bold: false },
  ], marginX + col1W + r1pad, r2RightY, col2W - r1pad * 2);

  r2RightY -= 4;
  r2RightY = drawNumbered(page2, '4.', [
    { text: 'Update then click ', bold: false }, { text: 'Save.', bold: true },
  ], marginX + col1W + r1pad, r2RightY, col2W - r1pad * 2);

  const row2Bottom = Math.min(r2LeftY, r2RightY) - r1pad;
  const row2Height = row1Bottom - row2Bottom;

  page2.drawRectangle({ x: marginX, y: row2Bottom, width: contentWidth, height: row1Height + row2Height, borderColor: black, borderWidth: 0.75 });
  page2.drawLine({ start: { x: marginX + col1W, y: tableY }, end: { x: marginX + col1W, y: row2Bottom }, thickness: 0.75, color: black });
  page2.drawLine({ start: { x: marginX, y: row1Bottom }, end: { x: marginX + contentWidth, y: row1Bottom }, thickness: 0.75, color: black });

  cursorY2 = row2Bottom - 12;

  const f2Text = 'F.2 Would you like to receive personalized communication and product offers from Sun Life of Canada (Philippines), Inc. (SLOCPI); Sun Life Financial Plans, Inc. (SLFPI); Sun Life Asset Management Company, Inc. (SLAMCI); and other members of the Sun Life group that may help with your financial needs?';
  cursorY2 = drawWrappedText(page2, f2Text, marginX, cursorY2, contentWidth - 60, helveticaFont, 7.5, 9);

  drawCheckbox(page2, record.wants_communication === true, marginX + contentWidth - 50, cursorY2 + 10);
  page2.drawText('Yes', { x: marginX + contentWidth - 40, y: cursorY2 + 3, size: 9, font: helveticaFont, color: black });

  drawCheckbox(page2, record.wants_communication === false, marginX + contentWidth - 20, cursorY2 + 10);
  page2.drawText('No', { x: marginX + contentWidth - 10, y: cursorY2 + 3, size: 9, font: helveticaFont, color: black });

  cursorY2 -= 16;

  cursorY2 = drawSectionHeader(page2, 'G', 'For Office Use Only', cursorY2);
  cursorY2 -= 8;

  page2.drawText('Requirements received by', { x: marginX, y: cursorY2, size: 8, font: helveticaBold, color: black });
  cursorY2 -= 5;

  drawBorderedBox(page2, marginX, cursorY2, contentWidth / 2, 24, 'Complete Name of Staff', record.received_by_staff);
  cursorY2 = drawBorderedBox(page2, marginX + contentWidth / 2, cursorY2, contentWidth / 2, 24, 'Receiving Department/Office', record.receiving_department);
  cursorY2 -= 8;

  let recDateStr = '';
  if (record.date_received) {
    const parts = record.date_received.split('-');
    if (parts.length === 3) recDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  drawDateBox(page2, marginX, cursorY2, contentWidth / 2, 'Date Received [e.g. 01-JAN-2019]', recDateStr, 24);
  drawBorderedBox(page2, marginX + contentWidth / 2, cursorY2, contentWidth / 2, 24, 'Time Received', record.time_received);

  const allPages = pdfDoc.getPages();
  allPages.forEach((p, idx) => {
    p.drawText('SACR.04.24', { x: marginX, y: 20, size: 8, font: helveticaFont, color: black });
    p.drawText(`Page ${idx + 1} of ${allPages.length}`, { x: marginX + contentWidth - 50, y: 20, size: 8, font: helveticaFont, color: black });
  });

  return await pdfDoc.save();
}