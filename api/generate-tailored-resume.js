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

        const prompt = `You are an elite ATS optimization specialist. Goal: 97%+ ATS match while maintaining 100% authenticity.

MASTER RESUME:
${masterResumeText}

PARSED DATA:
${JSON.stringify(parsedData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

CRITICAL OPTIMIZATION RULES:

1. KEYWORD OPTIMIZATION (Ultra-Aggressive)
   - Extract ALL keywords from job description
   - Repeat each critical keyword 2-4x naturally across resume
   - Use EXACT terminology from JD (e.g., if JD says "Python programming", use "Python programming")
   - Mirror the JD's language style and phrasing

2. QUANTIFIABLE METRICS (Make it Believable)
   - Add specific numbers to EVERY bullet point where possible
   - Based on 2-3 years experience level, use realistic metrics:
     * Data processed: 10M-200M records
     * Time saved: 30%-70% improvement
     * Business value: $500K-$15M range
     * Team size: 3-8 people collaborated with
     * Accuracy: 85%-99.8%
   - Format: "Action verb + task + using technology + quantifiable result"
   - Every metric MUST be defensible in an interview

3. STRONG ACTION VERBS (Power Words)
   - START every bullet with impactful verbs
   - Use: Developed, Built, Implemented, Designed, Executed, Optimized, Created, Engineered
   - AVOID: Performed, Did, Worked on, Helped with, Assisted
   - Match verb strength to 2-3 years experience level

4. BULLET DENSITY (Concise & Scannable)
   - Maximum 2 lines per bullet
   - One clear idea per bullet
   - Remove filler words ("in order to", "by utilizing", "by means of")
   - Direct format: "Built X using Y, achieving Z result"

5. INTEGRATED TECHNOLOGIES (Natural Flow)
   - Weave tech terms INTO sentences naturally
   - ✅ Good: "Developed automated pipelines using Python/PySpark to process 50M+ records"
   - ❌ Bad: "Developed automated pipelines. Technologies used: Python, PySpark"
   - Don't always put technologies at the end

6. CONSISTENT TENSE
   - Past jobs: 100% past tense (Developed, Built, Executed)
   - Current job: Present tense (Develop, Build, Execute)
   - No mixing tenses within same job

7. EXPERIENCE CALIBRATION (2-3 Years Level)
   - Use appropriate responsibility level
   - ✅ GOOD: "Developed", "Built", "Implemented", "Supported", "Collaborated", "Executed"
   - ❌ TOO SENIOR: "Architected", "Led team of 10+", "Managed department", "Defined company strategy"
   - Show impact without claiming leadership roles

8. COMPREHENSIVE INCLUSION
   - Include ALL work experience from master resume
   - Include ALL relevant projects
   - Reframe everything to match JD terminology
   - Don't leave anything out unless truly irrelevant

9. SECTION STRUCTURE (EXACT ORDER)
   - Summary: 3-4 sentences, keyword-rich, mirror JD requirements
   - Technical Skills: Categorized (Programming, Cloud, Tools), JD keywords first
   - Professional Experience: Most recent first, reframe all bullets for JD
   - Projects: Include if relevant, focus on those matching JD
   - Certifications: List all
   - Education: Full degree names with field (e.g., "Master of Science in Data Science")

10. TRUTH & DEFENSIBILITY
    - All claims must be 100% truthful
    - Every metric must be defensible in interview
    - Reframe existing experience, NEVER fabricate
    - When quantifying, use conservative estimates

11. CONTACT & EDUCATION DETAILS
    - Include full address with zipcode if available
    - Add "Expected [Month Year]" for ongoing degrees
    - Include degree field (e.g., "in Data Science", "in Mechanical Engineering")
    - Add job locations if available (Remote/City, State)

12. ATS SCORE CALCULATION (MUST BE ACCURATE - NO FAKE SCORES)
    
    CRITICAL: You MUST calculate the REAL score. Do NOT just return 97.
    
    Scoring Process:
    
    Step 1 - Extract ALL keywords from JD:
    - Technologies (Python, AWS, SQL, Docker, Kubernetes, etc.)
    - Skills (Data Engineering, Machine Learning, Analytics, etc.)
    - Tools (Git, Jira, Tableau, etc.)
    - Requirements (2+ years, Bachelor's degree, etc.)
    - Methodologies (Agile, Scrum, CI/CD, etc.)
    
    Step 2 - Check each keyword in resume:
    - Count exact matches
    - Count partial matches (e.g., "Python" matches "Python programming")
    - Track frequency of each keyword
    
    Step 3 - Calculate score honestly:
    atsScore = (keywords matched in resume / total JD keywords) × 100
    
    Step 4 - Be HONEST about the score:
    - If you achieved 94%, say 94%
    - If you achieved 89%, say 89%
    - If you achieved 99%, say 99%
    - NEVER fake the score as 97%
    
    Step 5 - List missing keywords:
    - Show which JD keywords couldn't be naturally included
    - Explain why they couldn't fit

OUTPUT FORMAT (JSON):
{
  "resume": {
    "summary": "Keyword-optimized 3-4 sentence summary mirroring JD requirements",
    "skills": {
      "Category Name": ["skill1", "skill2", "skill3"],
      "Another Category": ["skill4", "skill5"]
    },
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "period": "Month Year - Month Year",
        "location": "Remote OR City, State (use from master resume if available)",
        "achievements": [
          "Strong verb + quantifiable task + technology + metric/result",
          "Each bullet max 2 lines, densely packed with JD keywords"
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "date": "Month Year - Month Year (use from master if available)",
        "description": "Concise description with metrics and technologies integrated naturally",
        "technologies": ["Tech1", "Tech2", "Tech3"]
      }
    ],
    "certifications": [
      {
        "name": "Certification Full Name",
        "date": "Year"
      }
    ],
    "education": [
      {
        "school": "University Name",
        "degree": "Degree Type (e.g., Master of Science, Bachelor of Engineering)",
        "field": "Field of Study (e.g., Data Science, Mechanical Engineering)",
        "year": "Expected Month Year OR Month Year (add 'Expected' if ongoing)",
        "gpa": "X.X/4.0 (only if 3.5+)",
        "relevantCoursework": "Course1, Course2, Course3 (only if very relevant to JD)"
      }
    ]
  },
  "atsScore": <REAL_CALCULATED_NUMBER_0_TO_100>,
  "keywordAnalysis": {
    "totalJDKeywords": <number>,
    "matchedInResume": <number>,
    "matchRate": "<percentage>%"
  },
  "matchedKeywords": [
    "keyword1 (appears 3x)",
    "keyword2 (appears 5x)",
    "keyword3 (appears 2x)"
  ],
  "missingKeywords": [
    "keyword from JD not in resume",
    "another missing keyword"
  ],
  "optimizationStrategy": "Detailed explanation of actual optimizations made and honest assessment of why the score is what it is. If score is below 95%, explain what prevented higher score."
}

IMPORTANT REMINDERS:
- The atsScore MUST be CALCULATED, not assumed
- Show your work in keywordAnalysis
- Be truthful about what score was actually achieved
- List ALL missing keywords that couldn't naturally fit
- If you couldn't fit all keywords naturally, explain why in optimizationStrategy

Generate the optimized resume now with TRUE ATS scoring.`;

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

        // Clean and parse JSON response
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleanText);

        // Attach usage data if available
        if (data.usage) {
            result.usage = data.usage;
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}