export const config = {
  maxDuration: 60, // Set timeout to 60 seconds
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.length < 100) {
      return res.status(400).json({ error: 'Resume text too short' });
    }

    // Call Claude to create semantic understanding
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a resume analysis expert. Read this resume and create a comprehensive semantic understanding.

RESUME TEXT:
${resumeText}

Create a semantic understanding that captures the essence of this person's background. Output as JSON:

{
  "understanding": {
    "profile": "Brief 2-3 sentence overview of who they are",
    "coreStrengths": [
      "Strength 1 with specific context and metrics",
      "Strength 2 with specific context and metrics",
      "Strength 3 with specific context and metrics"
    ],
    "technicalDepth": {
      "PrimarySkill1": "Proficiency level and context (e.g., Expert - 2 years professional use in ML pipelines)",
      "PrimarySkill2": "Proficiency level and context",
      "Domain1": "Depth of experience (e.g., Strong - Built production systems at Fortune 500)"
    },
    "trajectory": "Career progression summary in one sentence",
    "uniqueValue": "What makes this person stand out in one sentence"
  },
  "structured": {
    "personalInfo": {
      "name": "Full name",
      "email": "email",
      "phone": "phone",
      "location": "city, state",
      "linkedin": "linkedin url if present",
      "github": "github url if present"
    },
    "education": [
      {
        "school": "University name",
        "degree": "Degree type and field",
        "year": "Graduation date",
        "gpa": "GPA if present",
        "coursework": "Relevant coursework if present"
      }
    ],
    "experience": [
      {
        "company": "Company name",
        "position": "Job title",
        "period": "Start - End dates",
        "location": "Location",
        "keyAchievements": ["Achievement 1", "Achievement 2"],
        "skills": ["Skill used", "Skill used"]
      }
    ],
    "projects": [
      {
        "name": "Project name",
        "description": "Brief description",
        "technologies": ["Tech1", "Tech2"],
        "achievements": ["Achievement 1"]
      }
    ],
    "skills": {
      "Category1": ["skill1", "skill2"],
      "Category2": ["skill3", "skill4"]
    },
    "certifications": [
      {"name": "Cert name", "date": "Year"}
    ]
  }
}

Be thorough and accurate. Extract ALL information from the resume.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON from Claude's response
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json({
      success: true,
      understanding: parsed.understanding,
      structured: parsed.structured
    });

  } catch (error) {
    console.error('Resume processing error:', error);
    return res.status(500).json({
      error: 'Failed to process resume',
      details: error.message
    });
  }
}
