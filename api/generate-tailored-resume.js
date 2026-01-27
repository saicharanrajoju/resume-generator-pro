

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
    const { parsedData, userProvidedSummary, userProvidedSkills, userProvidedExperience } = req.body;

    if (!parsedData) {
      return res.status(400).json({ error: 'Missing parsed data' });
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

    // ═══════════════════════════════════════════════════════════════
    // SIMPLE ASSEMBLY: Combine user-provided sections with stored data
    // ═══════════════════════════════════════════════════════════════

    console.log('📦 Assembling resume from provided sections...');

    // Validate that user provided the required sections
    if (!userProvidedSummary || !userProvidedSkills || !userProvidedExperience) {
      return res.status(400).json({
        error: 'Missing required sections',
        message: 'Please provide summary, skills, and experience sections'
      });
    }

    // Assemble final resume
    const finalResume = {
      summary: userProvidedSummary,
      skills: userProvidedSkills,
      experience: userProvidedExperience,

      // These come from stored data (unchanged)
      projects: normalizedData.projects || [],
      education: normalizedData.education || [],
      certifications: normalizedData.certifications || []
    };

    console.log('✅ Resume assembled successfully');

    // Calculate page estimate
    const pageEstimate = estimateResumePages(finalResume);
    console.log(`📏 Estimated ${pageEstimate.estimatedPages} pages`);

    // Return result (no ATS score needed)
    const result = {
      resume: finalResume,
      pageEstimate: {
        pages: pageEstimate.estimatedPages,
        lines: pageEstimate.estimatedLines,
        recommendation: pageEstimate.recommendation,
        isOverTwoPages: pageEstimate.isOverTwoPages
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