const pdfParse = require('pdf-parse');

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBuffer } = req.body;

        if (!fileBuffer) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(fileBuffer, 'base64');

        // Extract text from PDF
        const data = await pdfParse(buffer);

        return res.status(200).json({
            text: data.text,
            pages: data.numpages,
            info: data.info
        });

    } catch (error) {
        console.error('PDF extraction error:', error);
        return res.status(500).json({
            error: 'Failed to extract text from PDF',
            details: error.message
        });
    }
}
