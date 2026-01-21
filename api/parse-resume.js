const { IncomingForm } = require('formidable');
const fs = require('fs');
const mammoth = require('mammoth');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let resumeText;

        // Handle JSON request (Paste Text)
        if (req.headers['content-type']?.includes('application/json')) {
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const body = JSON.parse(data);
            resumeText = body.resumeText;

            if (!resumeText) {
                return res.status(400).json({ error: 'No resume text provided' });
            }
        }
        // Handle File Upload (Multipart)
        else {
            // Parse form data with correct formidable syntax
            const form = new IncomingForm();

            const parsePromise = new Promise((resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) reject(err);
                    else resolve({ fields, files });
                });
            });

            const { fields, files } = await parsePromise;

            const uploadedFile = files.file;
            if (!uploadedFile) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Handle both single file and array
            const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
            const filePath = file.filepath;
            const mimeType = file.mimetype;

            // Only support DOCX for now (PDF parsing has issues in serverless)
            if (
                mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimeType === 'application/msword'
            ) {
                const result = await mammoth.extractRawText({ path: filePath });
                resumeText = result.value;
            } else if (mimeType === 'application/pdf') {
                // For PDF, ask user to convert to DOCX or use text paste
                return res.status(400).json({
                    error: 'PDF support is limited. Please upload DOCX instead, or use the "Paste Text" option.'
                });
            } else {
                return res.status(400).json({
                    error: 'Unsupported file type. Please upload DOCX file.'
                });
            }

            // Clean up uploaded file
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.log('Cleanup error:', e);
            }
        }

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({
                error: 'Could not extract enough text from file. Please make sure your resume contains text (not just images).'
            });
        }

        // Parse with Claude
        const prompt = `You are an expert resume parser. Extract ALL information from this resume into structured JSON.

RESUME TEXT:
${resumeText}

CRITICAL INSTRUCTIONS:
1. Extract EVERYTHING - don't skip any details
2. Return ONLY valid JSON (no markdown, no code blocks, no explanations)
3. Use the EXACT structure below
4. If a field is not found, use empty string "" or empty array []
5. Preserve all metrics, numbers, and technical terms exactly as written

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "email@example.com",
    "phone": "+1-XXX-XXX-XXXX",
    "address": {
      "city": "City",
      "state": "State",
      "zipCode": ""
    }
  },
  "onlinePresence": {
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username",
    "portfolio": ""
  },
  "summary": "Professional summary or objective statement (2-3 sentences)",
  "skills": {
    "LLM & GenAI": ["LangChain", "CrewAI", "RAG", "FAISS", "Weaviate"],
    "Programming & ML Frameworks": ["Python", "SQL", "PyTorch", "TensorFlow"],
    "Cloud & Big Data": ["AWS", "GCP", "Azure", "Databricks"],
    "Production & MLOps": ["Docker", "Kubernetes", "FastAPI", "Redis"],
    "ML & NLP": ["Classification", "Deep Learning", "NLP", "BERT"],
    "Data & Visualization": ["Tableau", "Power BI", "Looker"]
  },
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "period": "Month YYYY – Month YYYY",
      "location": "City, State or Client: Company Name",
      "achievements": [
        "Achievement with metrics (e.g., Improved X by 25%)",
        "Another achievement"
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Python", "AWS", "Docker"],
      "date": "YYYY or YYYY-YYYY",
      "bullets": [
        "What you built and the impact",
        "Technical details and results"
      ]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Master of Science in Data Science",
      "field": "Data Science",
      "year": "May YYYY",
      "gpa": "4.0/4.0",
      "relevantCoursework": "Course 1, Course 2, Course 3"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Machine Learning – Associate",
      "date": "YYYY"
    }
  ]
}

IMPORTANT NOTES:
- For "skills", categorize them intelligently based on the resume content
- If you can't determine categories, put everything in "Programming & ML Frameworks"
- For "experience", extract ALL bullet points as "achievements"
- For "projects", extract project names, technologies used, and accomplishments
- Preserve ALL numbers and metrics exactly as written
- Extract the professional summary if present

Extract the information now:`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(500).json({
                error: 'AI parsing failed. Please try again.'
            });
        }

        const data = await response.json();
        const parsedProfile = parseResponse(data.content[0].text);

        return res.status(200).json(parsedProfile);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Disable body parser for file uploads
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

function parseResponse(text) {
    try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Failed to parse response:', error);
        throw new Error('Failed to parse AI response');
    }
}