export default async function handler(req, res) {
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
        const { jobDescription, userProfile } = req.body;

        if (!jobDescription || !userProfile) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Build prompt
        const prompt = buildResumePrompt(jobDescription, userProfile);

        // Call Claude API with your secure API key
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
            return res.status(response.status).json({
                error: 'Claude API error',
                details: errorText
            });
        }

        const data = await response.json();
        const result = parseResumeResponse(data.content[0].text);

        return res.status(200).json(result);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

function buildResumePrompt(jobDescription, profile) {
    return `You are an expert resume writer specializing in ATS-optimized resumes. 

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
Name: ${profile.fullName}
Email: ${profile.email}
Phone: ${profile.phone || 'N/A'}
LinkedIn: ${profile.linkedin || 'N/A'}
Location: ${profile.location || 'N/A'}

WORK EXPERIENCE:
${profile.experience.map((exp, i) => `
${i + 1}. ${exp.position} at ${exp.company}
   ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}
   Achievements:
   ${exp.achievements.map(ach => `   - ${ach}`).join('\n')}
`).join('\n')}

SKILLS:
Technical: ${profile.skills.technical.join(', ')}
Soft Skills: ${profile.skills.soft.join(', ')}

EDUCATION:
${profile.education.map(edu =>
        `${edu.degree} in ${edu.field}, ${edu.school} (${edu.graduationYear})`
    ).join('\n')}

TASK:
Create an ATS-optimized resume tailored to this job description. Follow these rules:

1. ATS COMPLIANCE (CRITICAL):
   - Use standard section headers: PROFESSIONAL SUMMARY, EXPERIENCE, SKILLS, EDUCATION
   - No tables, columns, text boxes, or graphics
   - Simple bullet points (•)
   - Standard fonts only
   - Keywords naturally integrated (not keyword stuffed)

2. CONTENT STRATEGY:
   - Write a compelling 2-3 sentence professional summary highlighting relevant experience
   - Select and prioritize experiences most relevant to this job
   - Rewrite achievement bullets to match job requirements
   - Use action verbs and quantify results where possible
   - Include relevant keywords from the job description naturally

3. OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "resume": {
    "summary": "professional summary here",
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "period": "MM/YYYY - MM/YYYY",
        "achievements": ["bullet point 1", "bullet point 2", "bullet point 3"]
      }
    ],
    "skills": ["skill1", "skill2", "skill3"],
    "education": [
      {
        "degree": "Degree",
        "field": "Field",
        "school": "School Name",
        "year": "Year"
      }
    ]
  },
  "email": "Professional email/cover letter here (3-4 paragraphs, reference specific JD requirements)",
  "atsScore": 85,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"]
}

Generate the resume now:`;
}

function parseResumeResponse(text) {
    try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Failed to parse response:', error);
        throw new Error('Failed to parse AI response');
    }
}