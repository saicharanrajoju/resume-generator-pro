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
        const { jobDescription, masterResumeText, parsedData } = req.body;

        if (!jobDescription || !masterResumeText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const prompt = buildUltraATSPrompt(jobDescription, masterResumeText, parsedData);

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
                error: 'Claude API error'
            });
        }

        const data = await response.json();
        const result = parseResponse(data.content[0].text);

        return res.status(200).json(result);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

function buildUltraATSPrompt(jobDescription, masterResumeText, parsedData) {
    return `You are an elite ATS optimization specialist and resume writer. Your goal is to achieve a 97%+ ATS match rate while maintaining authenticity. You have the candidate's complete master resume and must create a version that will DOMINATE applicant tracking systems.

==========================================
MASTER RESUME (Complete Background):
${masterResumeText}

PARSED STRUCTURED DATA:
${JSON.stringify(parsedData, null, 2)}

==========================================
TARGET JOB DESCRIPTION:
${jobDescription}

==========================================
CRITICAL ATS OPTIMIZATION RULES:

1. KEYWORD DENSITY (PRIORITY #1):
   - Extract EVERY important keyword/phrase from job description
   - Each critical keyword must appear 2-4 times naturally across resume
   - Use exact phrases from JD, not synonyms
   - Include both acronyms AND full terms (AWS and Amazon Web Services)
   - Mirror JD language patterns and terminology exactly

2. INCLUDE ALL EXPERIENCE:
   - Use EVERY work experience from master resume
   - Reframe each role to emphasize skills mentioned in JD
   - Add relevant keywords to existing bullet points
   - If experience doesn't match perfectly, reframe responsibilities to highlight transferable skills that align with JD requirements

3. AGGRESSIVE BULLET POINT OPTIMIZATION:
   - Start with action verbs that match JD language
   - Inject JD keywords naturally into every bullet point
   - Reframe technical accomplishments using JD terminology
   - Add context that connects experience to JD requirements
   - Example transformation:
     * Basic: "Analyzed data using Python"
     * Optimized: "Executed advanced data analysis using Python (Pandas, NumPy, scikit-learn) to process 5M+ records, delivering actionable insights that improved operational efficiency by 30%"

4. EXPERIENCE LEVEL CALIBRATION:
   Candidate has 2-3 years of professional experience.
   
   ✅ APPROPRIATE LANGUAGE:
   - "Developed", "Built", "Implemented", "Executed", "Performed"
   - "Supported", "Contributed to", "Collaborated with"
   - "Analyzed", "Processed", "Automated", "Optimized"
   - Individual contributor scope (not managing teams)
   - Working WITH senior people, not LEADING them
   
   ❌ AVOID (Too Senior):
   - "Architected enterprise-wide..."
   - "Led team of X engineers..."
   - "Defined organizational strategy..."
   - "Managed stakeholders..."
   - Scope too large for 2-3 years experience
   
   RULE: Every bullet must be believable for someone with 2-3 years experience.

5. TECHNICAL SKILLS OPTIMIZATION:
   - List EVERY skill from master resume that matches JD
   - Group skills by category matching JD structure
   - Repeat critical skills in Skills section AND experience bullets
   - If JD mentions "Python" 5 times, ensure Python appears 5+ times
   - Include skill variations (ML, Machine Learning, ML models, ML algorithms)

6. INTELLIGENT REFRAMING (NOT LYING):
   ✅ ALLOWED:
   - "Worked with data" → "Developed data pipelines and performed analysis on 10M+ records"
   - "Created reports" → "Built business intelligence dashboards using Tableau"
   - "Used Python" → "Leveraged Python (Pandas, NumPy) for data processing and automation"
   - "Team member" → "Collaborated with cross-functional engineering and product teams"
   
   ❌ NOT ALLOWED:
   - Inventing roles, companies, or dates
   - Claiming skills never used
   - Fabricating projects or certifications
   - Creating false metrics

7. PROFESSIONAL SUMMARY OPTIMIZATION:
   - Mirror job title from JD
   - Include top 5 required qualifications from JD
   - Mention years of experience: "Data Scientist with 2+ years expertise in..."
   - Pack with keywords naturally

8. ATS FORMATTING:
   - Headers: SUMMARY, TECHNICAL SKILLS, PROFESSIONAL EXPERIENCE, PROJECTS, CERTIFICATIONS, EDUCATION
   - No tables, columns, or graphics
   - Simple bullet points (•)
   - One column layout

9. QUANTIFICATION STRATEGY:
   - Every bullet: Action verb + Keyword + Metric + Impact
   - Example: "Developed Python-based ETL pipelines processing 120M+ records, improving data quality by 40% and reducing processing time by 8 hours weekly"

10. KEYWORD PLACEMENT:
    - Most critical JD keywords in Summary
    - Repeat in Technical Skills
    - Weave into experience bullets
    - Include in project descriptions

==========================================
ATS SCORING TARGET: 97%+

To achieve:
- Map every major JD requirement to resume content
- Ensure 80%+ of JD keywords appear in resume
- Use exact phrasing from JD
- Maintain natural reading flow

==========================================
OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no backticks):

{
  "resume": {
    "summary": "Keyword-rich 2-3 sentence summary",
    "skills": {
      "Category from JD": ["skill1", "skill2"],
      "Another Category": ["skill3", "skill4"]
    },
    "experience": [
      {
        "company": "Company Name",
        "position": "Position",
        "period": "MM/YYYY - Present",
        "location": "City, State",
        "achievements": [
          "Keyword-optimized bullet with metrics",
          "Another optimized bullet",
          "Third bullet with JD terminology"
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "description": "Description with JD keywords",
        "technologies": ["Tech1", "Tech2"]
      }
    ],
    "certifications": [
      {
        "name": "Cert Name",
        "issuer": "Issuer",
        "date": "YYYY"
      }
    ],
    "education": [
      {
        "school": "University",
        "degree": "Degree",
        "field": "Field",
        "year": "YYYY",
        "gpa": "X.X/4.0"
      }
    ]
  },
  "atsScore": 97,
  "matchedKeywords": ["comprehensive", "list", "of", "keywords"],
  "optimizationStrategy": "Brief explanation of tailoring strategy"
}

==========================================
EXAMPLE OPTIMIZATION:

MASTER RESUME: "Analyzed customer data using Python"

JD KEYWORDS: "Python, data analysis, machine learning, SQL, business intelligence"

OPTIMIZED: "Performed comprehensive data analysis using Python (Pandas, NumPy) and SQL to process 5M+ customer records, developed machine learning models for predictive insights, and delivered business intelligence reports that improved customer retention by 25%"

WHY: ✅ All JD keywords included ✅ Quantified ✅ Believable for 2-3 years ✅ Natural flow

==========================================
BEGIN ULTRA-ATS OPTIMIZATION NOW.
Target: 97%+ match rate.
Include ALL experiences.
Calibrate for 2-3 years experience level.
Maximize keyword density naturally.`;
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