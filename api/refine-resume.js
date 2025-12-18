export default async function handler(req, res) {
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
        const { currentResume, refinementRequest, jobDescription, masterResume } = req.body;

        const prompt = `You are a resume refinement specialist. The user has a resume and wants to make a specific change.

CURRENT RESUME (JSON):
${JSON.stringify(currentResume.resume, null, 2)}

CURRENT ATS SCORE: ${currentResume.atsScore}%

JOB DESCRIPTION:
${jobDescription}

USER'S REFINEMENT REQUEST:
"${refinementRequest}"

INSTRUCTIONS:
1. Make ONLY the changes the user requested
2. Keep everything else exactly the same
3. Maintain the same structure and format
4. Recalculate the ATS score honestly after changes
5. If the request would lower quality, politely suggest alternatives in optimizationStrategy

OUTPUT (JSON):
{
  "resume": {
    "summary": "...",
    "skills": {...},
    "experience": [...],
    "projects": [...],
    "certifications": [...],
    "education": [...]
  },
  "atsScore": <REAL_CALCULATED_SCORE>,
  "keywordAnalysis": {...},
  "matchedKeywords": [...],
  "missingKeywords": [...],
  "optimizationStrategy": "Explain what was changed and why"
}

Make the requested change now:`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(500).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const text = data.content[0].text;
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleanText);

        return res.status(200).json(result);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}