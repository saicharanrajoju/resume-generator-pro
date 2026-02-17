import { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat } from "docx";

const FONT = "Calibri";
const FONT_SIZE = 22; // 11pt
const PARAGRAPH_SPACING = 200; // after spacing in DXA

/**
 * Parse markdown text into an array of TextRun objects.
 * Supports **bold** and *italic* markers.
 */
function parseMarkdownInline(text) {
  const runs = [];
  // Match **bold**, *italic*, or plain text
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      runs.push(new TextRun({ text: match[2], bold: true, font: FONT, size: FONT_SIZE }));
    } else if (match[3]) {
      // *italic*
      runs.push(new TextRun({ text: match[3], italics: true, font: FONT, size: FONT_SIZE }));
    } else if (match[4]) {
      // plain text
      runs.push(new TextRun({ text: match[4], font: FONT, size: FONT_SIZE }));
    }
  }

  return runs;
}

/**
 * Parse markdown body content into an array of Paragraph elements.
 * Handles paragraphs, bold, italic, and bullet lists.
 */
function parseMarkdownBody(markdown) {
  const paragraphs = [];
  // Split on double newlines for paragraphs
  const blocks = markdown.split(/\n\s*\n/).filter(b => b.trim());

  for (const block of blocks) {
    const trimmed = block.trim();

    // Skip markdown headers
    if (/^#{1,6}\s/.test(trimmed)) {
      const headerText = trimmed.replace(/^#{1,6}\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: parseMarkdownInline(headerText),
          spacing: { before: 0, after: PARAGRAPH_SPACING },
        })
      );
      continue;
    }

    // Check if block is a bullet list
    const lines = trimmed.split("\n");
    const isBulletList = lines.every(l => /^\s*[-*+]\s/.test(l.trim()));

    if (isBulletList) {
      for (const line of lines) {
        const bulletText = line.trim().replace(/^[-*+]\s+/, "");
        paragraphs.push(
          new Paragraph({
            children: parseMarkdownInline(bulletText),
            numbering: { reference: "cover-letter-bullets", level: 0 },
            spacing: { before: 0, after: 80 },
          })
        );
      }
    } else {
      // Regular paragraph — join lines with space
      const text = lines.map(l => l.trim()).join(" ");
      paragraphs.push(
        new Paragraph({
          children: parseMarkdownInline(text),
          spacing: { before: 0, after: PARAGRAPH_SPACING },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Format date as "Month Day, Year" (e.g., "February 17, 2026")
 */
function formatLetterDate(date) {
  const d = date || new Date();
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function emptyParagraph() {
  return new Paragraph({
    children: [new TextRun({ text: "", font: FONT, size: FONT_SIZE })],
    spacing: { before: 0, after: 0 },
  });
}

function textParagraph(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: FONT_SIZE,
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
    spacing: { before: 0, after: options.spacingAfter ?? 0 },
    alignment: options.alignment || AlignmentType.LEFT,
  });
}

/**
 * Generate a professional cover letter DOCX.
 *
 * @param {Object} params
 * @param {Object} params.sender - { name, address, city, state, zip, phone, email }
 * @param {Object} params.recipient - { name, title, company, address }
 * @param {string} params.body - Markdown formatted cover letter body
 * @param {string} [params.closing] - Closing phrase (default: "Sincerely,")
 * @param {Date} [params.date] - Letter date (default: today)
 */
export async function generateCoverLetter({ sender, recipient, body, closing = "Sincerely,", date }) {
  const children = [];

  // === SENDER HEADER BLOCK ===
  children.push(textParagraph(sender.name, { bold: true }));

  if (sender.address) {
    children.push(textParagraph(sender.address));
  }
  if (sender.city || sender.state || sender.zip) {
    const cityLine = [sender.city, sender.state].filter(Boolean).join(", ");
    const full = [cityLine, sender.zip].filter(Boolean).join(" ");
    children.push(textParagraph(full));
  }
  if (sender.phone) {
    children.push(textParagraph(sender.phone));
  }
  if (sender.email) {
    children.push(textParagraph(sender.email));
  }

  // === DATE ===
  children.push(textParagraph(formatLetterDate(date), { spacingAfter: PARAGRAPH_SPACING }));

  // === BLANK LINE ===
  children.push(emptyParagraph());

  // === RECIPIENT BLOCK ===
  const recipientName = recipient.name || "Hiring Manager";
  children.push(textParagraph(recipientName));
  if (recipient.title) {
    children.push(textParagraph(recipient.title));
  }
  if (recipient.company) {
    children.push(textParagraph(recipient.company));
  }
  if (recipient.address) {
    children.push(textParagraph(recipient.address));
  }

  // === BLANK LINE ===
  children.push(emptyParagraph());

  // === SALUTATION ===
  children.push(
    textParagraph(`Dear ${recipientName},`, { spacingAfter: PARAGRAPH_SPACING })
  );

  // === BODY (parsed from markdown) ===
  const bodyParagraphs = parseMarkdownBody(body);
  children.push(...bodyParagraphs);

  // === CLOSING ===
  children.push(textParagraph(closing, { spacingAfter: 0 }));

  // Signature space (3 blank lines)
  children.push(emptyParagraph());
  children.push(emptyParagraph());
  children.push(emptyParagraph());

  // === TYPED NAME ===
  children.push(textParagraph(sender.name));

  // === ENCLOSURE ===
  children.push(emptyParagraph());
  children.push(textParagraph("Enclosure", { italics: true }));

  // === BUILD DOCUMENT ===
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "cover-letter-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  // Generate blob and trigger download
  const blob = await Packer.toBlob(doc);
  const companyName = (recipient.company || "Company").replace(/[^a-zA-Z0-9]/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cover_Letter_${companyName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default { generateCoverLetter };
