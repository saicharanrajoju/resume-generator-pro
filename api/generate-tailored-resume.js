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
        const { jobDescription, masterResumeText, parsedData } = req.body;

        if (!jobDescription || !masterResumeText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const prompt = `You are an elite ATS optimization specialist. Goal: 97%+ ATS match while maintaining authenticity.

MASTER RESUME:
${masterResumeText}

PARSED DATA:
${JSON.stringify(parsedData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

OPTIMIZATION RULES:

1. KEYWORD DENSITY: Extract ALL JD keywords. Each appears 2-4x naturally. Use exact JD phrases + acronyms.

2. ALL EXPERIENCE: Include EVERY work experience. Reframe each with JD keywords. Add relevant context.

3. SENIORITY (2-3 years):
   ✅ Use: "Developed", "Built", "Implemented", "Supported", "Collaborated", "Executed"
   ❌ Avoid: "Architected", "Led team of", "Managed", "Defined strategy"
   
4. BULLET OPTIMIZATION:
   - Action verb (matching JD) + JD keywords + metrics + impact
   - Example: "Developed Python pipelines processing 5M+ records, improving efficiency 30%"

5. SKILLS: Group by JD categories. List ALL relevant skills. Repeat critical ones in experience.

6. REFRAMING (NOT LYING):
   ✅ "Worked with data" → "Performed data analysis on 10M+ records using Python/SQL"
   ✅ "Made reports" → "Built Tableau dashboards delivering insights to stakeholders"
   ❌ Don't invent roles, skills, projects, or metrics

7. SUMMARY: Mirror JD title. Include top 5 requirements. Mention 2+ years experience. Pack keywords.

8. FORMAT: Headers - SUMMARY, TECHNICAL SKILLS, PROFESSIONAL EXPERIENCE, PROJECTS, CERTIFICATIONS, EDUCATION

9. QUANTIFY: Every bullet needs metrics (%, $, time, scale)

10. ATS: 80%+ JD keywords in resume. Exact phrasing. Natural flow.

OUTPUT (JSON only):
{
  "resume": {
    "summary": "string",
    "skills": {"Category": ["skill1", "skill2"]},
    "experience": [{"company": "str", "position": "str", "period": "str", "location": "str", "achievements": ["str"]}],
    "projects": [{"name": "str", "description": "str", "technologies": ["str"]}],
    "certifications": [{"name": "str", "issuer": "str", "date": "str"}],
    "education": [{"school": "str", "degree": "str", "field": "str", "year": "str", "gpa": "str"}]
  },
  "atsScore": 97,
  "matchedKeywords": ["array"],
  "optimizationStrategy": "string"
}

Generate now. Be aggressive with keywords while staying truthful.`;

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