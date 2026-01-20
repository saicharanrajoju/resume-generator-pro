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

    const prompt = `You are an elite ATS optimization strategist with deep expertise in balancing keyword matching with resume quality. You understand that preserving competitive advantage is more important than chasing perfect ATS scores.

═══════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL CONTEXT: THIS IS A GOLDEN RESUME (9/10 QUALITY) ⚠️
═══════════════════════════════════════════════════════════════════════════════

This resume represents weeks of meticulous optimization by an experienced resume expert. It showcases:
- Cutting-edge AI/ML projects (LLM quantization, RAG systems, multi-agent orchestration)
- Real, defensible metrics from actual work (3.8x energy efficiency, 89.7% accuracy, $11M business impact)
- Graduate-level technical depth (MS Data Science, 4.0 GPA, GenAI coursework)
- Professional experience at Fortune 500 companies (Nike, Lloyds Banking Group)
- Modern tech stack that differentiates from 90% of candidates

Your mission: Make MINIMAL, SURGICAL changes to improve ATS matching WITHOUT destroying what makes this resume exceptional.

CORE PHILOSOPHY: "Subtle strategic additions that preserve gem-standard quality"

TARGET: 85-90% ATS match (realistic and excellent for a quality resume)
NOT 95%+ (that requires keyword stuffing that destroys readability)

GOLDEN RULE: When uncertain about a change, DON'T make it. Preservation > Optimization.

═══════════════════════════════════════════════════════════════════════════════
📄 MASTER RESUME (HANDLE WITH EXTREME CARE)
═══════════════════════════════════════════════════════════════════════════════

${masterResumeText}

═══════════════════════════════════════════════════════════════════════════════
📊 PARSED DATA
═══════════════════════════════════════════════════════════════════════════════

${JSON.stringify(parsedData, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
💼 JOB DESCRIPTION
═══════════════════════════════════════════════════════════════════════════════

${jobDescription}

═══════════════════════════════════════════════════════════════════════════════
🚫 ABSOLUTE PROHIBITIONS - NEVER VIOLATE THESE RULES
═══════════════════════════════════════════════════════════════════════════════

1. ❌ DO NOT MODIFY PROJECTS SECTION
   • Copy ALL three projects EXACTLY word-for-word from master resume
   • Keep ALL project titles unchanged
   • Keep ALL project bullet points unchanged
   • Keep ALL technologies lists unchanged
   • Keep ALL project structure unchanged
   • Projects are the STRONGEST part of this resume - they are SACRED

2. ❌ DO NOT CHANGE ANY QUANTITATIVE METRICS ANYWHERE
   • 3.8x energy efficiency → UNTOUCHABLE
   • 89.7% accuracy → UNTOUCHABLE
   • 75.2% F1 score → UNTOUCHABLE
   • sub-100ms latency → UNTOUCHABLE
   • 4.5pp degradation → UNTOUCHABLE
   • $11M incremental value → UNTOUCHABLE
   • 120M+ records → UNTOUCHABLE
   • 79% precision → UNTOUCHABLE
   • 25% reduction → UNTOUCHABLE
   • 15+ TB → UNTOUCHABLE
   • 99.8% data integrity → UNTOUCHABLE
   • 8+ hours saved weekly → UNTOUCHABLE
   • 5M rows → UNTOUCHABLE
   • 4.0/4.0 GPA → UNTOUCHABLE
   • 8.09/10 CGPA → UNTOUCHABLE
   • EVERY SINGLE NUMBER is real and defensible - DO NOT TOUCH

3. ❌ DO NOT MODIFY EDUCATION SECTION
   • School names: University of North Texas (UNT), Kakatiya Institute of Technology & Science (KITSW)
   • Degree names: Master of Science in Data Science, Bachelor of Mechanical Engineering
   • Dates: May 2026, May 2022
   • GPA/CGPA values
   • Coursework list and order (GenAI & LLMs must stay first)
   • Copy education section EXACTLY as provided

4. ❌ DO NOT MODIFY CERTIFICATIONS
   • AWS Certified Machine Learning – Associate (2025)
   • Copy exactly as written

5. ❌ DO NOT MODIFY PERSONAL INFORMATION
   • Name: Rajoju Sai Charan
   • Location: Denton, TX
   • Email: rajojusaicharan1@gmail.com
   • Phone: +1 940-300-2732
   • LinkedIn: linkedin.com/in/rajojusaicharan
   • GitHub: github.com/saicharanrajoju

6. ❌ DO NOT MODIFY COMPANY NAMES, JOB TITLES, OR EMPLOYMENT DATES
   • Companies: Nike, Lloyds Banking Group, Wipro Limited
   • Titles: Project Engineer, Trainee
   • Dates: June 2023 – July 2024, September 2022 – May 2023, March 2022 – June 2022
   • Keep exactly as written

7. ❌ DO NOT REMOVE MODERN TECHNOLOGIES
   • LangChain, CrewAI, RAG, FAISS, Weaviate → MUST STAY
   • MLC-LLM, Apache TVM, Model Context Protocol (MCP) → MUST STAY
   • Quantization, Fine-tuning → MUST STAY
   • These are competitive differentiators - DO NOT REMOVE

8. ❌ DO NOT REWRITE EXPERIENCE BULLETS COMPLETELY
   • Only add 1-2 keywords if they fit naturally
   • Do NOT change the core meaning or structure
   • Do NOT add new bullets
   • Do NOT fabricate new accomplishments

9. ❌ DO NOT ADD FAKE METRICS OR FABRICATED EXPERIENCE
   • All claims must be based on actual work in master resume
   • Do NOT invent numbers
   • Do NOT claim experience candidate doesn't have
   • Reframe existing work, NEVER fabricate

10. ❌ DO NOT MAKE CONTENT MORE GENERIC
    • Do NOT replace "multi-agent orchestration" with "data processing"
    • Do NOT replace "quantization" with "model optimization"
    • Do NOT replace "RAG-powered systems" with "AI applications"
    • Preserve technical specificity

═══════════════════════════════════════════════════════════════════════════════
✅ ALLOWED OPTIMIZATIONS (SUBTLE & STRATEGIC ONLY)
═══════════════════════════════════════════════════════════════════════════════

1. ✅ TECHNICAL SKILLS SECTION (Primary Optimization Target)
   
   CURRENT STRUCTURE (Must be preserved):
   • LLM & GenAI: LangChain, CrewAI, RAG (Retrieval-Augmented Generation), FAISS, Weaviate, MLC-LLM, Apache TVM, Model Context Protocol (MCP), Quantization, Fine-tuning
   • Programming & ML Frameworks: Python, SQL, PyTorch, scikit-learn, TensorFlow, PySpark, Pandas, NumPy
   • Cloud & Big Data: AWS (Certified ML Associate), GCP (BigQuery, Dataproc, Vertex AI), Azure (ADF, Data Lake), Databricks, Apache Spark
   • Production & MLOps: Docker, FastAPI, Redis, PostgreSQL, Prometheus, MLflow, Git/GitHub, CI/CD
   • ML & NLP: Classification, Regression, Deep Learning, NLP, BERT, Transformers, Feature Engineering, Model Optimization
   • Data & Visualization: Tableau, Looker, Power BI, Data Pipelines, ETL
   
   ALLOWED CHANGES:
   • Add 3-7 missing JD keywords to appropriate categories
   • Reorder skills WITHIN categories to prioritize JD terms (e.g., move "PyTorch" before "scikit-learn")
   • Add closely related technologies (e.g., if JD wants "Kubernetes" and resume has "Docker", add "Kubernetes" to Production & MLOps)
   • DO NOT remove existing skills
   • DO NOT merge or split categories
   • Keep "LLM & GenAI" as first category (priority positioning)

2. ✅ SUMMARY OPTIMIZATION (Maximum 5-10 Words Changed)
   
   CURRENT SUMMARY:
   "AI/ML Engineer with over 2 years of professional experience engineering data pipelines, validating large-scale datasets, and supporting ML model deployments across cloud platforms in retail and banking environments. Skilled in building production ML systems and LLM applications, including classification models, RAG-powered systems, multi-agent orchestration, and on-device LLM optimization."
   
   ALLOWED CHANGES:
   • Swap 1-2 generic terms for JD-specific terminology
   • Example: "ML systems" → "ML models" (if JD uses "models")
   • Example: "data pipelines" → "ML pipelines" (if JD emphasizes ML pipelines)
   • Keep the natural flow and sentence structure
   • Keep the tone professional and confident
   • Keep "over 2 years" (accurate experience level)
   • DO NOT rewrite entire sentences
   • DO NOT change the core message

3. ✅ PROFESSIONAL EXPERIENCE (Gentle Keyword Enhancement Only)
   
   ALLOWED CHANGES:
   • Add 1-2 JD keywords to existing bullets IF they fit naturally
   • Example: "pipelines" → "data pipelines" (if JD emphasizes this)
   • Example: "model monitoring" → "ML model monitoring" (if JD uses this phrase)
   • Example: "workflows" → "ETL workflows" (if JD mentions ETL)
   
   STRICT RULES:
   • DO NOT rewrite entire bullets
   • DO NOT change the core action or accomplishment
   • DO NOT add new bullets
   • DO NOT change any metrics
   • Only modify if the keyword fits naturally without awkward phrasing
   • If a bullet is already strong, leave it untouched

4. ✅ SKILLS CATEGORY REORDERING (Only if JD Heavily Emphasizes One Area)
   
   CURRENT ORDER:
   1. LLM & GenAI
   2. Programming & ML Frameworks
   3. Cloud & Big Data
   4. Production & MLOps
   5. ML & NLP
   6. Data & Visualization
   
   ALLOWED:
   • Keep this order for most AI/ML jobs
   • If JD is heavily MLOps-focused, consider moving "Production & MLOps" to position #2
   • If JD is heavily cloud-focused, consider moving "Cloud & Big Data" to position #2
   • ALWAYS keep "LLM & GenAI" first unless JD is purely data engineering with no AI/ML

═══════════════════════════════════════════════════════════════════════════════
📋 STRATEGIC DECISION-MAKING FRAMEWORK
═══════════════════════════════════════════════════════════════════════════════

STEP 1: EXTRACT JD KEYWORDS
- Identify all technical skills, tools, and requirements
- Categorize by type (languages, frameworks, cloud, methodologies)
- Prioritize "required" over "preferred" keywords

STEP 2: COMPARE WITH MASTER RESUME
- Check which JD keywords already exist in resume
- Note which keywords are missing
- Identify which missing keywords could be naturally added

STEP 3: MAKE STRATEGIC DECISIONS
For each missing keyword, ask:
  a) Does the candidate likely know this? (e.g., Kubernetes when they know Docker)
  b) Would it fit naturally in Technical Skills section?
  c) Is it closely related to existing skills?
  
  If YES to all → Add it
  If NO to any → Skip it, list in "missingKeywords"

STEP 4: APPLY CHANGES CONSERVATIVELY
- Add 3-7 keywords maximum to Technical Skills
- Make 0-3 gentle modifications to Summary
- Make 0-5 keyword additions to Experience bullets (only if natural)
- Copy Projects, Education, Certifications exactly as-is

STEP 5: CALCULATE HONEST ATS SCORE
- Count total JD keywords
- Count how many appear in optimized resume
- atsScore = (matched keywords / total JD keywords) × 100
- Be HONEST - if it's 87%, say 87% (not 95%)

═══════════════════════════════════════════════════════════════════════════════
🎯 ATS SCORE CALCULATION (MUST BE ACCURATE)
═══════════════════════════════════════════════════════════════════════════════

SCORING METHODOLOGY:

1. Extract ALL keywords from JD:
   • Programming languages (Python, SQL, Java, etc.)
   • Frameworks & libraries (PyTorch, TensorFlow, scikit-learn, etc.)
   • Cloud platforms (AWS, GCP, Azure, etc.)
   • Tools (Docker, Git, Kubernetes, etc.)
   • Methodologies (Agile, CI/CD, MLOps, etc.)
   • Requirements (2+ years experience, Master's degree, etc.)
   • Domain skills (Machine Learning, NLP, Data Engineering, etc.)

2. Check each keyword in optimized resume:
   • Exact match (e.g., "Python" in JD, "Python" in resume) = 1.0 point
   • Partial match (e.g., "Machine Learning" in JD, "ML" in resume) = 0.8 points
   • Related match (e.g., "data pipelines" in JD, "pipelines" in resume) = 0.6 points
   • No match = 0 points

3. Calculate score:
   atsScore = (total points earned / total possible points) × 100

4. Round to nearest whole number

5. Be HONEST:
   • If actual score is 84%, report 84%
   • If actual score is 91%, report 91%
   • Do NOT inflate to 95%+ to look good
   • List keywords that couldn't be naturally added

REALISTIC EXPECTATIONS:
- 75-80% = Good match (some gaps but viable)
- 81-88% = Very good match (strong alignment)
- 89-93% = Excellent match (minimal gaps)
- 94%+ = Exceptional match (rare without keyword stuffing)

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT (STRICT JSON STRUCTURE)
═══════════════════════════════════════════════════════════════════════════════

{
  "resume": {
    "summary": "Minimally optimized summary (only if strategic changes needed, otherwise copy exactly)",
    
    "skills": {
      "LLM & GenAI": ["List with any strategic additions"],
      "Programming & ML Frameworks": ["List with any strategic additions"],
      "Cloud & Big Data": ["List with any strategic additions"],
      "Production & MLOps": ["List with any strategic additions"],
      "ML & NLP": ["List exactly as is unless additions needed"],
      "Data & Visualization": ["List exactly as is unless additions needed"]
    },
    
    "experience": [
      {
        "company": "Nike",
        "position": "Project Engineer",
        "period": "June 2023 – July 2024",
        "location": "Client: Nike, Wipro Limited",
        "achievements": [
          "Bullets with minimal keyword enhancements (or exact copy if no natural fit)",
          "Keep all metrics exactly as written"
        ]
      },
      {
        "company": "Lloyds Banking Group",
        "position": "Project Engineer",
        "period": "September 2022 – May 2023",
        "location": "Client: Lloyds Banking Group, Wipro Limited",
        "achievements": [
          "Bullets with minimal keyword enhancements (or exact copy if no natural fit)",
          "Keep all metrics exactly as written"
        ]
      },
      {
        "company": "Wipro Limited",
        "position": "Trainee",
        "period": "March 2022 – June 2022",
        "location": "Wipro Limited",
        "achievements": [
          "Copy exactly as written from master resume"
        ]
      }
    ],
    
    "projects": [
      {
        "name": "Mobile-First GreenAI: On-Device LLM Deployment for Energy-Efficient Inference",
        "bullets": [
          "COPY EXACTLY WORD-FOR-WORD FROM MASTER RESUME",
          "DO NOT MODIFY A SINGLE WORD",
          "DO NOT CHANGE ANY METRICS",
          "DO NOT CHANGE ANY TECHNOLOGIES"
        ],
        "technologies": ["COPY EXACTLY FROM MASTER RESUME"]
      },
      {
        "name": "AI-Enhanced Supabase MCP Server: Natural Language Database Interface",
        "bullets": [
          "COPY EXACTLY WORD-FOR-WORD FROM MASTER RESUME"
        ],
        "technologies": ["COPY EXACTLY FROM MASTER RESUME"]
      },
      {
        "name": "AetherFlow: Multi-Agent Data Orchestration System with LLM-Powered ETL",
        "bullets": [
          "COPY EXACTLY WORD-FOR-WORD FROM MASTER RESUME"
        ],
        "technologies": ["COPY EXACTLY FROM MASTER RESUME"]
      }
    ],
    
    "certifications": [
      {
        "name": "AWS Certified Machine Learning – Associate",
        "date": "2025"
      }
    ],
    
    "education": [
      {
        "school": "University of North Texas (UNT)",
        "degree": "Master of Science in Data Science",
        "year": "May 2026",
        "gpa": "4.0/4.0",
        "relevantCoursework": "Generative AI & Large Language Models, Deep Learning for Big Data, Applied Machine Learning, Data Modeling, Data Visualization, Data Storage & Retrieval"
      },
      {
        "school": "Kakatiya Institute of Technology & Science (KITSW)",
        "degree": "Bachelor of Mechanical Engineering",
        "year": "May 2022",
        "gpa": "8.09/10"
      }
    ]
  },
  
  "optimization": {
    "atsScore": <HONEST_CALCULATED_NUMBER_70_TO_95>,
    
    "changesMade": [
      "Added 'Kubernetes' to Production & MLOps section (JD requirement)",
      "Moved 'PyTorch' before 'TensorFlow' in Programming & ML (JD emphasis)",
      "Changed 'ML systems' to 'ML models' in summary (JD terminology)",
      "Added 'data pipelines' to Nike bullet 2 (natural fit)"
    ],
    
    "keywordsAdded": [
      "Kubernetes",
      "Model Deployment",
      "ML models (replaced ML systems)"
    ],
    
    "keywordsMissing": [
      "A/B testing - Candidate has no experience with this",
      "Airflow - Not used in any projects or work",
      "Snowflake - Different tech stack (uses BigQuery, Databricks)"
    ],
    
    "sectionsPreserved": {
      "projects": true,
      "education": true,
      "certifications": true,
      "allMetrics": true,
      "modernTech": true
    }
  },
  
  "analysis": {
    "totalJDKeywords": 45,
    "matchedKeywords": 39,
    "matchRate": "87%",
    "keywordBreakdown": {
      "exact": 32,
      "partial": 7,
      "missing": 6
    }
  },
  
  "honestAssessment": "This resume achieved an 87% ATS match score, which is excellent for a high-quality resume. The optimization added 3 strategic keywords to the Technical Skills section and made 2 minor terminology adjustments to align with JD language. All projects, metrics, and competitive advantages were preserved completely. The missing 13% represents keywords the candidate doesn't have experience with (A/B testing, Airflow, Snowflake). Attempting to reach 95%+ would require keyword stuffing that would damage readability and remove what makes this resume stand out. This optimization strikes the optimal balance between ATS performance and human appeal."
}

═══════════════════════════════════════════════════════════════════════════════
⚠️  FINAL QUALITY CHECK BEFORE SUBMITTING
═══════════════════════════════════════════════════════════════════════════════

Before you output the JSON, verify:

✅ Did you copy ALL three projects EXACTLY word-for-word?
✅ Did you keep EVERY metric unchanged (3.8x, 89.7%, $11M, 120M+, 79%, etc.)?
✅ Did you keep ALL modern tech (LangChain, CrewAI, RAG, FAISS, MLC-LLM, etc.)?
✅ Did you copy education and certifications exactly?
✅ Did you make only 3-7 keyword additions maximum?
✅ Did you calculate ATS score honestly (not inflated to 95%)?
✅ Did you preserve the resume's competitive advantages?
✅ Would this resume still impress a human recruiter?

If ANY answer is NO, go back and fix it.

REMEMBER: A great resume with 85% ATS match beats a generic resume with 95% match.

Now generate the optimized resume with honesty, precision, and respect for the golden standard.`;

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
      return res.status(500).json({ error: 'AI service error', details: errorText });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Locate the first '{' and last '}' to extract the JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      console.error('No JSON object found in response:', text);
      return res.status(500).json({ error: 'AI response did not contain JSON', details: text.substring(0, 200) + '...' });
    }

    const cleanText = text.substring(firstBrace, lastBrace + 1);
    let result;

    try {
      result = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Extracted Text:', cleanText);
      // Attempt to fix common JSON issues if standard parse fails (e.g. trailing commas?)
      // For now, fail loudly so we can see the issue
      return res.status(500).json({ error: 'Failed to parse extracted JSON', details: cleanText.substring(0, 200) + '...' });
    }

    // Attach usage data if available
    if (data.usage) {
      result.usage = data.usage;
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}