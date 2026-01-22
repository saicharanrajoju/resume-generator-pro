export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    console.log('PDF extract endpoint called');
    console.log('Method:', req.method);

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
        console.log('FileBuffer received:', !!fileBuffer);

        if (!fileBuffer) {
            console.log('No file buffer provided');
            return res.status(400).json({ error: 'No file provided' });
        }

        // Try importing pdf-parse
        let pdfParse;
        try {
            pdfParse = require('pdf-parse');
            console.log('pdf-parse loaded successfully');
        } catch (importError) {
            console.error('Failed to import pdf-parse:', importError);
            return res.status(500).json({
                error: 'PDF library not available',
                details: 'Please install pdf-parse dependency'
            });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(fileBuffer, 'base64');
        console.log('Buffer created, size:', buffer.length);

        // Extract text from PDF
        const data = await pdfParse(buffer);
        console.log('PDF parsed successfully, text length:', data.text?.length);

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
