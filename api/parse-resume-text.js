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
        const { resumeText } = req.body;

        if (!resumeText || resumeText.trim().length < 100) {
            return res.status(400).json({ error: 'Please provide more resume text (at least 100 characters)' });
        }

        const prompt = buildParsePrompt(resumeText);

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
            console.error('Claude API error');
            return res.status(500).json({ error: 'AI parsing failed' });
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

function buildParsePrompt(resumeText) {
    return `You are an expert at parsing resumes. Extract ALL structured information from this resume text into a comprehensive JSON format.

RESUME TEXT:
${resumeText}

TASK:
Parse this resume thoroughly and extract ALL information. Include every detail you find.

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks) in this EXACT structure:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "address": {
      "city": "",
      "state": "",
      "country": ""
    }
  },
  "onlinePresence": {
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "website": ""
  },
  "professionalSummary": "",
  "workExperience": [
    {
      "company": "",
      "position": "",
      "employmentType": "Full-time",
      "location": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": false,
      "achievements": [""]
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "gpa": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "location": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": []
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "startDate": "",
      "endDate": "",
      "current": false,
      "githubLink": "",
      "liveLink": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuingOrganization": "",
      "issueDate": "",
      "expiryDate": "",
      "credentialId": "",
      "credentialUrl": ""
    }
  ],
  "awards": [
    {
      "title": "",
      "issuer": "",
      "date": "",
      "description": ""
    }
  ],
  "publications": [],
  "volunteerExperience": [
    {
      "organization": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "description": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": "Intermediate"
    }
  ],
  "memberships": [],
  "interests": []
}

Extract ALL information. Leave arrays empty [] if no data found. Be thorough!`;
}

function parseResponse(text) {
    try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Failed to parse response:', error);
        throw new Error('Failed to parse AI response');
    }
}