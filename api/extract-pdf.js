import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBuffer } = req.body;

        if (!fileBuffer) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Convert base64 to Uint8Array
        const binaryString = Buffer.from(fileBuffer, 'base64');
        const bytes = new Uint8Array(binaryString);

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return res.status(200).json({
            text: fullText.trim(),
            pages: pdf.numPages
        });

    } catch (error) {
        console.error('PDF extraction error:', error);
        return res.status(500).json({
            error: 'Failed to extract text from PDF',
            details: error.message
        });
    }
}
