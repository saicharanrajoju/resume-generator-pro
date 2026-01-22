

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
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
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
    // STAGE 1 & 2: Run in PARALLEL (Efficiency Improvement)
    // ═══════════════════════════════════════════════════════════════

    console.log('🚀 Starting Stage 1 & 2 in parallel...');

    const [jdKeywords, resumeContext] = await Promise.all([

      // STAGE 1: Extract JD Keywords (Compressed - only JD, no resume)
      callClaude(`Extract all technical keywords from this job description.

JOB DESCRIPTION:
${jobDescription}

Output as JSON:
{
  "all_keywords": ["Python", "AWS", "Machine Learning"],
  "categories": {
    "languages": ["Python", "SQL"],
    "frameworks": ["PyTorch", "TensorFlow"],
    "cloud": ["AWS", "GCP"],
    "tools": ["Docker", "Kubernetes"],
    "skills": ["Machine Learning", "Data Engineering"]
  }
}

Be thorough. Extract ALL technical terms.`, 1500),

      // STAGE 2: Analyze Resume (Compressed - only skills + project names)
      callClaude(`Analyze what this candidate knows based on their background.

SKILLS:
${JSON.stringify(parsedData.skills, null, 2)}

EXPERIENCE SUMMARY:
${parsedData.experience?.map(e => `${e.position} at ${e.company}`).join(', ')}

PROJECT NAMES:
${parsedData.projects?.map(p => p.name).join(', ')}

Output as JSON:
{
  "technologies_used": ["Docker", "Python", "AWS"],
  "domains": ["MLOps", "Data Engineering"],
  "seniority_indicators": ["2+ years professional experience", "Fortune 500 companies"]
}

This helps determine which new keywords would be believable.`, 1500)
    ]);

    const jdData = parseJSON(jdKeywords);
    const resumeData = parseJSON(resumeContext);

    console.log(`✅ Stage 1 & 2 complete. Found ${jdData.all_keywords.length} JD keywords.`);

    // ═══════════════════════════════════════════════════════════════
    // STAGE 3: Strategic Keyword Selection (THE CRITICAL STAGE)
    // ═══════════════════════════════════════════════════════════════

    console.log('🧠 Stage 3: Strategic keyword selection...');

    const stage3Prompt = `⚠️ CRITICAL: Resume must fit in 2 pages (~104 total lines).

TEMPLATE SPECS:
- Font: Times New Roman 11pt, 1.15 spacing
- Capacity: ~52 lines per page
- 2 pages = ~104 total lines

FIXED SECTIONS (~20 lines):
- Header: 4 lines
- Summary: 4 lines  
- Skills (6 categories): 8 lines
- Section headers: 4 lines

CONTENT BUDGET: ~84 lines remaining

GUIDELINES FOR CONTENT:
- 3 jobs with 4 bullets each = ~18 lines
- 3 projects with 2 bullets each = ~12 lines
- Education (2 degrees) = ~5 lines
- Certifications = ~2 lines
TOTAL: ~37 lines (well under budget)

If adding keywords would push resume over 2 pages, be MORE selective.

You are a strategic resume advisor. Your goal is to select 3-7 keywords that improve ATS matching while maintaining authenticity.

⚠️ PHILOSOPHY: This is a GOLDEN RESUME. Preserve quality over perfect ATS scores.

JD KEYWORDS:
${JSON.stringify(jdData.all_keywords, null, 2)}

CANDIDATE'S CURRENT SKILLS:
${JSON.stringify(parsedData.skills, null, 2)}

CANDIDATE'S BACKGROUND:
- Technologies used: ${resumeData.technologies_used.join(', ')}
- Domains: ${resumeData.domains.join(', ')}
- Experience: ${resumeData.seniority_indicators.join(', ')}

SELECTION CRITERIA:
1. RELATEDNESS: Has Docker → can add Kubernetes ✅
2. TRUTHFULNESS: No testing tools → skip A/B testing ❌
3. NATURAL FIT: Fits existing skill categories ✅
4. PRIORITY: Required keywords > preferred keywords

LIMITS: Maximum 7 keywords. When in doubt, DON'T add.

Output as JSON:
{
  "keywords_to_add": [
    {
      "keyword": "Kubernetes",
      "reasoning": "Candidate has Docker in Production & MLOps. Natural extension.",
      "confidence": "high",
      "target_category": "Production & MLOps"
    }
  ],
  "keywords_to_skip": [
    {
      "keyword": "Airflow",
      "reasoning": "No workflow orchestration experience evident"
    }
  ]
}

Be conservative. Authenticity over ATS score.`;

    const stage3Response = await callClaude(stage3Prompt, 2500);
    const keywordSelection = parseJSON(stage3Response);

    console.log(`✅ Stage 3 complete. Selected ${keywordSelection.keywords_to_add.length} keywords to add.`);

    // ═══════════════════════════════════════════════════════════════
    // STAGE 4: Skills Section Optimization (Protected)
    // ═══════════════════════════════════════════════════════════════

    console.log('⚙️ Stage 4: Optimizing skills section...');

    const stage4Prompt = `⚠️ PAGE LIMIT: Resume must fit 2 pages.

Current skills section: ~8 lines
Do NOT add so many keywords that skills section exceeds 10 lines.
Each additional line reduces space for experience/projects.

Add selected keywords to skills section while preserving structure.

⚠️ CRITICAL RULES:
1. Do NOT remove ANY existing skills
2. KEEP all modern tech: LangChain, CrewAI, RAG, FAISS, Weaviate, MLC-LLM, Apache TVM, MCP, Quantization, Fine-tuning
3. Maintain EXACTLY 6 categories in this order:
   - LLM & GenAI
   - Programming & ML Frameworks
   - Cloud & Big Data
   - Production & MLOps
   - ML & NLP
   - Data & Visualization

CURRENT SKILLS:
${JSON.stringify(parsedData.skills, null, 2)}

KEYWORDS TO ADD:
${JSON.stringify(keywordSelection.keywords_to_add, null, 2)}

INSTRUCTIONS:
- Add each keyword to its target_category
- Place logically with related skills
- Do NOT remove anything

Output COMPLETE updated skills section (all 6 categories) as JSON:
{
  "LLM & GenAI": ["LangChain", "CrewAI", "RAG", ...],
  "Programming & ML Frameworks": ["Python", "SQL", ...],
  "Cloud & Big Data": [...],
  "Production & MLOps": [...],
  "ML & NLP": [...],
  "Data & Visualization": [...]
}`;

    const stage4Response = await callClaude(stage4Prompt, 2000);
    const optimizedSkills = parseJSON(stage4Response);

    console.log('✅ Stage 4 complete. Skills section optimized.');

    // ═══════════════════════════════════════════════════════════════
    // STAGE 5: Assemble Final Resume (NO API - Pure Logic)
    // ═══════════════════════════════════════════════════════════════

    console.log('🔧 Stage 5: Assembling final resume...');

    // DEBUG: Log what we're receiving to catch missing data
    console.log('📦 Data check:', {
      hasSummary: !!parsedData.summary,
      hasSkills: !!parsedData.skills,
      hasExperience: !!parsedData.experience,
      experienceCount: parsedData.experience?.length || 0,
      hasProjects: !!parsedData.projects,
      projectCount: parsedData.projects?.length || 0,
      hasEducation: !!parsedData.education,
      hasCertifications: !!parsedData.certifications
    });

    // CRITICAL: Assemble with fallbacks for missing data
    const finalResume = {
      summary: parsedData.summary || "AI/ML Engineer with experience in data pipelines and ML systems",

      skills: optimizedSkills, // ONLY thing we modified

      // Everything else is UNCHANGED from parsedData
      experience: parsedData.experience || [],
      projects: parsedData.projects || [],
      certifications: parsedData.certifications || [],
      education: parsedData.education || []
    };

    // Validation: Make sure we're not returning empty sections
    if (!finalResume.experience.length || !finalResume.projects.length) {
      console.error('❌ CRITICAL: Missing sections in parsedData!');
      console.error('parsedData structure:', Object.keys(parsedData));

      throw new Error('Incomplete resume data. Check frontend is sending all sections.');
    }

    console.log('✅ Stage 5 complete. Resume assembled successfully.');

    // ═══════════════════════════════════════════════════════════════
    // STAGE 6: Calculate ATS Score (Claude)
    // ═══════════════════════════════════════════════════════════════

    console.log('📈 Stage 6: Calculating ATS score...');

    const stage6Prompt = `Calculate ATS match percentage between resume and job description.

JD KEYWORDS (Total: ${jdData.all_keywords.length}):
${JSON.stringify(jdData.all_keywords, null, 2)}

RESUME CONTENT (Check all sections):
Summary: ${finalResume.summary}
Skills: ${JSON.stringify(finalResume.skills, null, 2)}
Experience: ${finalResume.experience?.map(e => (e.achievements || e.bullets || []).join(' ')).join(' ')}
Projects: ${finalResume.projects?.map(p => p.name + ' ' + (p.technologies || []).join(' ')).join(' ')}

SCORING RULES:
1. Search ENTIRE resume for each JD keyword
2. Exact match (case-insensitive) = 1.0 point
3. Partial match (ML for Machine Learning) = 0.7 points
4. No match = 0.0 points
5. Calculate: (total points / total keywords) × 100

Output as JSON:
{
  "total_jd_keywords": ${jdData.all_keywords.length},
  "points_earned": 38.5,
  "ats_score": 86,
  "matched_keywords": ["Python (exact)", "AWS (exact)", "ML (partial)"],
  "missing_keywords": ["Airflow", "Snowflake"]
}

Be accurate with math.`;

    const stage6Response = await callClaude(stage6Prompt, 2000);
    const atsAnalysis = parseJSON(stage6Response);

    console.log(`✅ Stage 6 complete. ATS Score: ${atsAnalysis.ats_score}%`);

    // ═══════════════════════════════════════════════════════════════
    // PAGE COUNT VALIDATION
    // ═══════════════════════════════════════════════════════════════

    console.log('📄 Estimating page count...');
    const pageEstimate = estimateResumePages(finalResume);

    // Validate page count before returning
    if (pageEstimate.isOverTwoPages) {
      console.warn(`⚠️ WARNING: Estimated ${pageEstimate.estimatedPages} pages (over 2 page limit)`);
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL OUTPUT: Comprehensive Report
    // ═══════════════════════════════════════════════════════════════

    console.log('✅ All stages complete! Preparing final output...');

    const result = {
      resume: finalResume,

      optimization: {
        atsScore: atsAnalysis.ats_score,

        changesMade: keywordSelection.keywords_to_add.map(k =>
          `Added '${k.keyword}' to ${k.target_category}`
        ),

        keywordsAdded: keywordSelection.keywords_to_add.map(k => ({
          keyword: k.keyword,
          category: k.target_category,
          reasoning: k.reasoning,
          confidence: k.confidence
        })),

        keywordsSkipped: keywordSelection.keywords_to_skip.map(k => ({
          keyword: k.keyword,
          reason: k.reasoning
        })),

        sectionsPreserved: {
          projects: true,
          experience: true,
          education: true,
          certifications: true,
          allMetrics: true,
          modernTech: true
        }
      },

      analysis: {
        totalJDKeywords: atsAnalysis.total_jd_keywords,
        pointsEarned: atsAnalysis.points_earned,
        matchedKeywords: atsAnalysis.matched_keywords,
        missingKeywords: atsAnalysis.missing_keywords
      },

      summary: `ATS Match: ${atsAnalysis.ats_score}% | Added ${keywordSelection.keywords_to_add.length} keywords | Skipped ${keywordSelection.keywords_to_skip.length} (no fit) | All projects, metrics, and competitive advantages preserved.`
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Pipeline error:', error);
    return res.status(500).json({
      error: 'Optimization failed',
      message: error.message,
      stage: 'Check server logs for details'
    });
  }
}