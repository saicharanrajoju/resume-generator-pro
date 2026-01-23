

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
    const { jobDescription, masterResumeText, parsedData } = req.body;

    if (!jobDescription || !masterResumeText || !parsedData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ═══════════════════════════════════════════════════════════════
    // USE STORED UNDERSTANDING: No re-parsing needed
    // ═══════════════════════════════════════════════════════════════

    console.log('📦 Using stored resume structure');

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT TAILORING: Use clean parsed data directly
    // ═══════════════════════════════════════════════════════════════

    console.log('📦 Using parsed data from Firebase directly');

    // Use the clean, parsed data that Claude already created during upload
    const resumeStructure = {
      summary: parsedData.professionalSummary || parsedData.summary || '',
      skills: parsedData.skills || {},
      experience: parsedData.workExperience || parsedData.experience || [],
      projects: parsedData.projects || [],
      education: parsedData.education || [],
      certifications: parsedData.certifications || []
    };

    console.log('✅ Loaded from Firebase:', {
      experienceCount: resumeStructure.experience.length,
      projectsCount: resumeStructure.projects.length,
      skillCategories: Object.keys(resumeStructure.skills).length
    });

    // Skip validation - just use what we have
    const normalizedData = resumeStructure;

    // Use resumeStructure for the rest of the pipeline

    // ═══════════════════════════════════════════════════════════════
    // QUALITY GATE: Validate inputs before processing
    // ═══════════════════════════════════════════════════════════════

    if (jobDescription.length < 100) {
      return res.status(400).json({
        error: 'Job description too short (minimum 100 characters)'
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    // Claude API caller
    async function callClaude(prompt, maxTokens = 2500) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${await response.text()}`);
      }

      const data = await response.json();
      return data.content[0].text;
    }

    // JSON parser
    function parseJSON(text) {
      try {
        // First, try to parse directly (in case it's already pure JSON)
        return JSON.parse(text);
      } catch (e) {
        // If that fails, extract JSON from mixed content

        // Try extracting between ```json and ``` if present
        const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          return JSON.parse(jsonBlockMatch[1]);
        }

        // Try extracting between ``` and ``` 
        const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          return JSON.parse(codeBlockMatch[1]);
        }

        // Fall back to brace extraction
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
          console.error('Failed to parse JSON. Raw text:', text.substring(0, 500));
          throw new Error('No JSON found in Claude response');
        }

        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
      }
    }



    // Page estimation function (inline to avoid ES module issues)
    function estimateResumePages(resumeData) {
      let lines = 0;

      // FIXED HEADER SECTIONS
      lines += 4;  // Name + contact
      lines += 4;  // Summary

      // SKILLS
      const skillCount = Object.keys(resumeData.skills || {}).length;
      lines += 1;  // Header
      lines += Math.min(skillCount * 1.3, 8);

      // EXPERIENCE
      lines += 1;  // Header
      (resumeData.experience || []).forEach((job, idx) => {
        lines += 1.2;  // Job title
        const bullets = (job.achievements || job.bullets || []).length;
        lines += bullets * 1.2;
        if (idx < resumeData.experience.length - 1) {
          lines += 0.5;
        }
      });

      // PROJECTS
      if (resumeData.projects && resumeData.projects.length > 0) {
        lines += 1;  // Header
        resumeData.projects.forEach((proj, idx) => {
          lines += 1;  // Title
          if (proj.description) lines += 1.2;
          if (proj.technologies && proj.technologies.length > 0) lines += 1;
          if (idx < resumeData.projects.length - 1) {
            lines += 0.5;
          }
        });
      }

      // CERTIFICATIONS
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        lines += 1;  // Header
        lines += resumeData.certifications.length * 0.5;
      }

      // EDUCATION
      if (resumeData.education && resumeData.education.length > 0) {
        lines += 1;  // Header
        resumeData.education.forEach(edu => {
          lines += 1.2;
          if (edu.gpa) lines += 0.5;
          if (edu.relevantCoursework) lines += 1;
          lines += 0.3;
        });
      }

      const pages = lines / 52;

      return {
        estimatedLines: Math.round(lines),
        estimatedPages: Math.round(pages * 10) / 10,
        isOverTwoPages: pages > 2.15,
        recommendation: pages <= 2.1
          ? `✅ ${Math.round(pages * 10) / 10} pages - Fits well!`
          : `⚠️ ${Math.round(pages * 10) / 10} pages - Consider trimming`
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // INTELLIGENT TAILORING: Single holistic optimization by Claude
    // ═══════════════════════════════════════════════════════════════

    console.log('🧠 Starting intelligent resume tailoring...');

    const tailoringPrompt = `You are an expert resume consultant helping a candidate apply for a job.

    Your task: Create a tailored version of their resume that maximizes their chances while staying 100% truthful.

    ═══════════════════════════════════════════════════════
    CANDIDATE'S MASTER RESUME:
    ═══════════════════════════════════════════════════════

    ${JSON.stringify(normalizedData, null, 2)}

    ═══════════════════════════════════════════════════════
    JOB DESCRIPTION THEY'RE APPLYING FOR:
    ═══════════════════════════════════════════════════════

    ${jobDescription}

    ═══════════════════════════════════════════════════════
    YOUR MISSION:
    ═══════════════════════════════════════════════════════

    Analyze both documents and create a tailored resume that:

    1. HIGHLIGHTS the candidate's MOST RELEVANT experience for THIS job
    2. Uses language and keywords from the JD naturally
    3. 
    4. 
    5. Preserves all their competitive advantages
    6. Fits in 2 pages

    **CRITICAL REQUIREMENTS:**

    always make sure when the resume is done it should be beliveable by recruiter it shouldnt sound like made up

    1. ATS TARGET: You MUST achieve 85-90% keyword match with the job description.
       - Identify important keywords in the JD
       - Ensure 85-90% of them appear naturally in the resume
       - Add them cleverly so it is belivable 

    critical: never touch the projects section leave lit like that 


    2. LOCATION MATCHING: 
       - If the JD mentions specific locations (city, state), update the resume header location to match
       - If the JD says "Remote" or has no location, keep the current location unchanged
       - Format as "City, State" (e.g., "Birmingham, AL")

    ═══════════════════════════════════════════════════════
    SPECIFIC INSTRUCTIONS:
    ═══════════════════════════════════════════════════════

    **SUMMARY (3-4 sentences):**
    - Lead with the skills/experience MOST relevant to this JD
    - Mirror the JD's language style
    - Emphasize years of experience in relevant areas
    - Mention specific technologies the JD asks for (if candidate has them)

    Example transformation:
    BEFORE: "AI/ML Engineer with 2 years experience in data pipelines..."
    AFTER: "AI/ML Engineer with 2+ years evaluating and deploying Large Language Models in production, specializing in agentic AI systems and cloud ML platforms..."

    **SKILLS:**
    - Keep ALL existing skills (especially unique ones like MLC-LLM, CrewAI, Apache TVM, MCP)
    - Add 5-10 keywords from the JD that candidate actually knows
    - Maintain exactly 6 categories in this order:
      1. LLM & GenAI
      2. Programming & ML Frameworks
      3. Cloud & Big Data
      4. Production & MLOps
      5. ML & NLP
      6. Data & Visualization

    **EXPERIENCE:**
    - Keep ALL jobs and ALL bullets
    - Preserve EVERY metric exactly ($11M, 79%, 120M+, 99.8%, etc.)
    - Enhance bullets by adding relevant technical terms WHERE THEY FIT

    
  if there is any critical or important keywords in the missing keywords

try to fit it in resume naturally in the professional experience or technical skills
    **PROJECTS:**
    - Include ALL projects
    - Reorder by relevance (most relevant to JD first)
    - Keep all technical details and metrics intact
    - Don't change descriptions

    **EDUCATION & CERTIFICATIONS:**
    - Keep exactly as written
    - Include relevant coursework if present
    - Don't modify

    ═══════════════════════════════════════════════════════
    CRITICAL RULES - READ CAREFULLY:
    ═══════════════════════════════════════════════════════

    ❌ NEVER:
     
    - Change any numbers, percentages, or metrics
    - Remove important achievements
    - dont touch the projects section leave lit like that 

    ✅ ALWAYS:
    - Preserve all competitive advantages (metrics, modern tech, unique projects)
    - Keep the candidate's authentic voice
    - Only add keywords you can JUSTIFY from their existing experience
    - Think: "Would a hiring manager believe this?"

    ═══════════════════════════════════════════════════════
    PAGE LENGTH CONSTRAINT:
    ═══════════════════════════════════════════════════════

    Resume must fit in 2 pages with this format:
    - Font: Times New Roman 11pt
    - Line spacing: 1.15
    - Margins: 0.5" all sides
    - Capacity: ~52 lines per page = ~104 lines total

    Guidelines:
    - Header + Summary + Skills = ~16 lines
    - Available for content: ~88 lines
    - 3 jobs × 4 bullets each = ~18 lines
    - 3 projects = ~12 lines
    - Education + Certs = ~7 lines
    TOTAL: ~53 lines (well under limit)

    If you need to trim:
    - Reduce to 3-4 bullets per job (not less)
    - Keep most relevant 3 projects
    - Shorten bullet wording slightly

    ═══════════════════════════════════════════════════════
    OUTPUT FORMAT:
    ═══════════════════════════════════════════════════════

    Return ONLY valid JSON (no markdown, no code blocks, no explanations):

    {
      "summary": "3-4 sentence professional summary",
      "skills": {
        "LLM & GenAI": ["LangChain", "CrewAI", "RAG", "..."],
        "Programming & ML Frameworks": ["Python", "PyTorch", "..."],
        "Cloud & Big Data": ["AWS", "GCP", "..."],
        "Production & MLOps": ["Docker", "MLflow", "..."],
        "ML & NLP": ["Deep Learning", "BERT", "..."],
        "Data & Visualization": ["Tableau", "ETL", "..."]
      },
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "period": "Month YYYY - Month YYYY",
          "location": "City, State",
          "achievements": [
            "Bullet 1 with metrics",
            "Bullet 2 with impact",
            "Bullet 3 with technologies",
            "Bullet 4 with results"
          ]
        }
      ],
      "projects": [
        {
          "name": "Project Name",
          "description": "What the project does and accomplishes",
          "technologies": ["Tech1", "Tech2", "Tech3"],
          "date": "Month YYYY" (if available, else "")
        }
      ],
      "certifications": [
        {"name": "Certification Name", "date": "Year"}
      ],
      "education": [
        {
          "school": "University Name",
          "degree": "Degree Type",
          "field": "Field of Study",
          "year": "Graduation Year",
          "gpa": "X.X/X.X",
          "relevantCoursework": "Course1, Course2, Course3" (if present)
        }
      ]
    }`;

    // Make the intelligent call
    const tailoredResponse = await callClaude(tailoringPrompt, 4096);
    const tailoredResume = parseJSON(tailoredResponse);

    console.log('✅ Intelligent tailoring complete');

    // Calculate page estimate
    const pageEstimate = estimateResumePages(tailoredResume);
    console.log(`📏 Estimated ${pageEstimate.estimatedPages} pages (${pageEstimate.estimatedLines} lines)`);

    // Calculate ATS score with a simple keyword match
    console.log('📊 Calculating ATS match score...');

    const atsPrompt = `Calculate ATS keyword match between this resume and job description.

    JOB DESCRIPTION:
    ${jobDescription}

    TAILORED RESUME:
    Summary: ${tailoredResume.summary}
    Skills: ${JSON.stringify(tailoredResume.skills)}
    Experience: ${tailoredResume.experience.map(e => e.achievements.join(' ')).join(' ')}
    Projects: ${tailoredResume.projects.map(p => p.name + ' ' + p.description).join(' ')}

    Count how many important keywords from the JD appear in the resume.

    Output ONLY valid JSON:
    {
      "atsScore": 92,
      "matchedKeywords": ["Python", "AWS", "LLM", "..."],
      "missingKeywords": ["Airflow", "Snowflake", "..."],
      "summary": "Strong match. Resume emphasizes relevant LLM and cloud experience."
    }
    
    Output ONLY valid JSON. No markdown, no explanations, no code blocks. Just the raw JSON object.`;

    const atsResponse = await callClaude(atsPrompt, 2000);
    const atsAnalysis = parseJSON(atsResponse);

    console.log(`✅ ATS Score: ${atsAnalysis.atsScore}%`);

    // Prepare final response
    const result = {
      resume: tailoredResume,
      atsScore: atsAnalysis.atsScore,
      matchedKeywords: atsAnalysis.matchedKeywords || [],
      missingKeywords: atsAnalysis.missingKeywords || [],

      pageEstimate: {
        pages: pageEstimate.estimatedPages,
        lines: pageEstimate.estimatedLines,
        recommendation: pageEstimate.recommendation,
        isOverTwoPages: pageEstimate.isOverTwoPages
      },

      keywordAnalysis: {
        totalJDKeywords: (atsAnalysis.matchedKeywords?.length || 0) + (atsAnalysis.missingKeywords?.length || 0),
        matchedInResume: atsAnalysis.matchedKeywords?.length || 0
      },

      optimization: {
        approach: "Holistic intelligent tailoring by Claude",
        summary: atsAnalysis.summary || "Resume optimized for this position"
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Pipeline error:', error);
    return res.status(500).json({
      error: 'Failed to generate tailored resume',
      message: error.message
    });
  }
}