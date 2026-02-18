import { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat } from "docx";

const FONT = "Times New Roman";
const FONT_SIZE = 24; // 12pt
const PARAGRAPH_SPACING = 200; // after spacing in DXA

/**
 * Parse markdown inline formatting into TextRun objects.
 * Supports **bold** and *italic*.
 */
function parseMarkdownInline(text) {
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true, font: FONT, size: FONT_SIZE }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], italics: true, font: FONT, size: FONT_SIZE }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], font: FONT, size: FONT_SIZE }));
    }
  }

  return runs;
}

/**
 * Parse the full cover letter text into an array of Paragraph elements.
 *
 * Rules:
 * - Double newlines separate paragraphs (with spacing after)
 * - Single newlines within a block become separate lines (no extra spacing)
 * - Markdown **bold** and *italic* are supported
 * - Markdown bullet lines (- or * at start) become proper bullet paragraphs
 * - Markdown headers (# ) are stripped and rendered as plain text
 */
function parseFullLetterText(text) {
  const paragraphs = [];
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());

  for (const block of blocks) {
    const trimmed = block.trim();
    const lines = trimmed.split("\n");

    // Check if the entire block is a bullet list
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
      // Each single newline within the block becomes its own Paragraph (like address lines)
      for (let i = 0; i < lines.length; i++) {
        let lineText = lines[i].trim();
        if (!lineText) continue;

        // Strip markdown headers
        lineText = lineText.replace(/^#{1,6}\s+/, "");

        const isLastLineInBlock = i === lines.length - 1;
        paragraphs.push(
          new Paragraph({
            children: parseMarkdownInline(lineText),
            spacing: {
              before: 0,
              after: isLastLineInBlock ? PARAGRAPH_SPACING : 0,
            },
          })
        );
      }
    }
  }

  return paragraphs;
}

/**
 * Generate a cover letter DOCX from the full pasted text.
 *
 * @param {string} content - The complete cover letter text (header, body, closing — everything)
 */
export async function generateCoverLetter(content) {
  const children = parseFullLetterText(content);

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

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cover_Letter.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default { generateCoverLetter };
