import { Document, Packer, Paragraph, TextRun, AlignmentType, ExternalHyperlink, BorderStyle } from "docx";

const FONT = "Times New Roman";
const FONT_SIZE = 22; // 11pt, standard business size
const HEADER_FONT_SIZE = 52; // 26pt, matches resume

/**
 * Parse markdown inline formatting into TextRun objects.
 * Supports **bold** and *italic*.
 */
function parseMarkdownInline(text) {
  if (!text) return [new TextRun({ text: "", font: FONT, size: FONT_SIZE })];
  
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) { // Bold
      runs.push(new TextRun({ text: match[2], bold: true, font: FONT, size: FONT_SIZE, color: "000000" }));
    } else if (match[3]) { // Italic
      runs.push(new TextRun({ text: match[3], italics: true, font: FONT, size: FONT_SIZE, color: "000000" }));
    } else if (match[4]) { // Plain text
      runs.push(new TextRun({ text: match[4], font: FONT, size: FONT_SIZE, color: "000000" }));
    }
  }

  return runs;
}

/**
 * Generate a cover letter DOCX from a structured JSON object.
 *
 * @param {Object} data - The parsed JSON data for the cover letter
 */
export async function generateCoverLetter(data, fileNameBase = 'Rajoju_Sai_Charan_Cover_Letter') {
  const sections = [];
  const personalInfo = data.personalInfo || {};
  const recipientInfo = data.recipientInfo || {};
  const letterDetails = data.letterDetails || {};

  // ============================================
  // 1. HEADER (Matches Resume Header Exactly)
  // ============================================
  const fullName = personalInfo.name || "Cover Letter";

  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          size: HEADER_FONT_SIZE,
          bold: true,
          font: FONT,
          color: "000000",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  );

  const contactChildren = [];

  const addSep = () => {
    if (contactChildren.length > 0) {
      contactChildren.push(
        new TextRun({ text: " | ", size: FONT_SIZE, font: FONT, color: "000000" })
      );
    }
  };

  if (personalInfo.location) {
    contactChildren.push(
      new TextRun({ text: personalInfo.location, size: FONT_SIZE, font: FONT, color: "000000" })
    );
  }

  if (personalInfo.phone) {
    addSep();
    contactChildren.push(
      new TextRun({ text: personalInfo.phone, size: FONT_SIZE, font: FONT, color: "000000" })
    );
  }

  if (personalInfo.email) {
    addSep();
    contactChildren.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: personalInfo.email,
            size: FONT_SIZE,
            font: FONT,
            style: "Hyperlink",
          }),
        ],
        link: `mailto:${personalInfo.email}`,
      })
    );
  }

  const addLink = (url, display) => {
    if (!url) return;
    addSep();
    const cleanDisplay = display || url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    const cleanLink = url.startsWith("http") ? url : `https://${url}`;

    contactChildren.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: cleanDisplay,
            size: FONT_SIZE,
            font: FONT,
            style: "Hyperlink",
          }),
        ],
        link: cleanLink,
      })
    );
  };

  addLink(personalInfo.linkedin);
  addLink(personalInfo.github);
  addLink(personalInfo.website);

  sections.push(
    new Paragraph({
      children: contactChildren,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Bottom Border (optional, makes it look cleaner like the resume sections)
  sections.push(
    new Paragraph({
      children: [],
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 4,
        },
      },
      spacing: { after: 360 }, // Extra space before the actual letter starts
    })
  );

  // ============================================
  // 2. LETTER BODY (Standard Business Letter)
  // ============================================

  // Date
  if (letterDetails.date) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: letterDetails.date, font: FONT, size: FONT_SIZE, color: "000000" })],
        spacing: { after: 240 }, // Space before recipient info
      })
    );
  }

  // Recipient Info
  if (recipientInfo.contactPerson) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: recipientInfo.contactPerson, font: FONT, size: FONT_SIZE, color: "000000" })],
      })
    );
  }
  if (recipientInfo.role) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: recipientInfo.role, font: FONT, size: FONT_SIZE, color: "000000" })],
      })
    );
  }
  if (recipientInfo.company) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: recipientInfo.company, font: FONT, size: FONT_SIZE, color: "000000", bold: true })],
      })
    );
  }
  if (recipientInfo.address) {
    const addressLines = recipientInfo.address.split("\n");
    addressLines.forEach(line => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: FONT, size: FONT_SIZE, color: "000000" })],
        })
      );
    });
  }
  
  // Add space after recipient block
  if (recipientInfo.contactPerson || recipientInfo.company || recipientInfo.address) {
    sections.push(new Paragraph({ text: "", spacing: { after: 240 } }));
  }

  // Salutation
  if (letterDetails.salutation) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: letterDetails.salutation, font: FONT, size: FONT_SIZE, color: "000000" })],
        spacing: { after: 240 },
      })
    );
  }

  // Body Paragraphs
  if (Array.isArray(letterDetails.bodyParagraphs)) {
    letterDetails.bodyParagraphs.forEach((paragraph, idx) => {
      const isLast = idx === letterDetails.bodyParagraphs.length - 1;
      sections.push(
        new Paragraph({
          children: parseMarkdownInline(paragraph),
          spacing: { after: isLast ? 240 : 200, line: 276 }, // 1.15 line spacing (276 / 240 = 1.15)
        })
      );
    });
  }

  // Sign Off
  if (letterDetails.signOff) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: letterDetails.signOff, font: FONT, size: FONT_SIZE, color: "000000" })],
        spacing: { after: 480 }, // Large space for signature
      })
    );
  }

  // Signature
  if (letterDetails.signature) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: letterDetails.signature, font: FONT, size: FONT_SIZE, color: "000000", bold: true })],
      })
    );
  }

  // ============================================
  // 3. DOCUMENT GENERATION
  // ============================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // Standard US Letter
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1-inch margins
          },
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  a.download = `${fileNameBase}_Cover_Letter.docx`;
  
  a.click();
  URL.revokeObjectURL(url);
}

export default { generateCoverLetter };
