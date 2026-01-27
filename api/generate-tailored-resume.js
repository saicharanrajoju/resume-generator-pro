

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
    const { parsedData, jobDescription: jdInput, userProvidedSummary, userProvidedSkills, userProvidedExperience } = req.body;

    // Make jobDescription optional (default to empty string)
    const jobDescription = jdInput || '';

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

    // Extract keywords from job description
    function extractKeywords(jdText) {
      if (!jdText || typeof jdText !== 'string') {
        return [];  // Return empty array if no JD
      }

      // Convert to lowercase and split into words
      const words = jdText.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

      // Common words to exclude
      const stopWords = new Set([
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'a', 'an', 'as', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'you', 'we', 'our', 'your', 'from', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
        'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
        'where', 'why', 'how', 'all', 'each', 'other', 'some', 'such', 'only',
        'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'also', 'well',
        'more', 'most', 'years', 'year', 'experience', 'work', 'working', 'ability'
      ]);

      // Count word frequency
      const wordCount = {};
      words.forEach(word => {
        if (!stopWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });

      // Get top keywords (appear 2+ times)
      const keywords = Object.entries(wordCount)
        .filter(([word, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);

      return keywords;
    }

    // Extract location from job description
    function extractLocation(jdText) {
      if (!jdText || typeof jdText !== 'string') {
        return null;  // Return null if no JD
      }

      // Common location patterns
      const locationPatterns = [
        /location[:\s]+([^,\n]+(?:,\s*[A-Z]{2})?)/i,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g, // City, ST
        /\b(Remote|Hybrid|On-site)\b/i
      ];

      for (const pattern of locationPatterns) {
        const match = jdText.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }

      return null;
    }

    // Calculate ATS score
    function calculateATSScore(resume, jdKeywords) {
      // Combine all resume text
      const resumeText = [
        resume.summary,
        JSON.stringify(resume.skills),
        JSON.stringify(resume.experience)
      ].join(' ').toLowerCase();

      // Count matching keywords
      let matchCount = 0;
      const matched = [];
      const missing = [];

      jdKeywords.forEach(keyword => {
        if (resumeText.includes(keyword)) {
          matchCount++;
          matched.push(keyword);
        } else {
          missing.push(keyword);
        }
      });

      const score = jdKeywords.length > 0
        ? Math.round((matchCount / jdKeywords.length) * 100)
        : 0;

      return {
        score,
        totalKeywords: jdKeywords.length,
        matchedCount: matchCount,
        matched: matched.slice(0, 20), // Top 20
        missing: missing.slice(0, 15)  // Top 15
      };
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
    // INTELLIGENT DATA PROCESSING
    // ═══════════════════════════════════════════════════════════════

    console.log('🧠 Processing data intelligently...');

    // Extract JD insights
    const jdKeywords = jobDescription ? extractKeywords(jobDescription) : [];
    const jdLocation = jobDescription ? extractLocation(jobDescription) : null;

    console.log(`📊 Extracted ${jdKeywords.length} keywords from JD`);
    if (jdLocation) console.log(`� JD location: ${jdLocation}`);

    // Process personal info
    const personalInfo = {
      name: parsedData.personalInfo?.name || parsedData.name || 'Rajoju Sai Charan',
      location: jdLocation || parsedData.personalInfo?.location || parsedData.location || 'Denton, TX',
      phone: parsedData.personalInfo?.phone || parsedData.phone || '+1 940-300-2732',
      email: parsedData.personalInfo?.email || parsedData.email || 'rajojusaicharan1@gmail.com',
      linkedin: parsedData.personalInfo?.linkedin || parsedData.linkedin || 'linkedin.com/in/rajojusaicharan',
      github: parsedData.personalInfo?.github || parsedData.github || parsedData.onlinePresence?.github ||
        parsedData.onlinePresence?.GitHub || null,
      website: parsedData.personalInfo?.website || parsedData.website || parsedData.onlinePresence?.website || null
    };

    // Process education with multiple fallbacks
    const processedEducation = (parsedData.education || []).map(edu => {
      const school = edu.school || edu.institution || edu.university ||
        edu.institutionName || edu.schoolName || '';
      const degree = edu.degree || edu.degreeType || edu.degreeLevel || '';
      const field = edu.field || edu.major || edu.fieldOfStudy || edu.program || '';
      const year = edu.year || edu.graduationYear || edu.gradYear || edu.endDate || '';
      const gpa = edu.gpa || edu.GPA || '';
      const coursework = edu.relevantCoursework || edu.coursework ||
        edu['Relevant Coursework'] || edu.courses || '';

      return {
        school,
        degree,
        field,
        year,
        gpa,
        relevantCoursework: coursework
      };
    });

    // Process certifications
    const processedCertifications = (parsedData.certifications || []).map(cert => {
      if (typeof cert === 'string') {
        // Parse string format: "AWS Certified ML (2025)"
        const match = cert.match(/^(.+?)\s*(?:\((\d{4})\))?$/);
        return {
          name: match ? match[1].trim() : cert,
          date: match && match[2] ? match[2] : ''
        };
      }
      return {
        name: cert.name || cert.certification || cert.title || cert.certificationName || '',
        date: cert.date || cert.year || cert.issueDate || cert.yearObtained || ''
      };
    });

    // Process projects (keep as-is but ensure structure)
    const processedProjects = (parsedData.projects || []).map(proj => ({
      name: proj.name || proj.title || proj.projectName || '',
      description: proj.description || proj.desc || '',
      technologies: proj.technologies || proj.techStack || proj.tools || [],
      date: proj.date || proj.year || proj.period || ''
    }));

    // Assemble final resume
    const finalResume = {
      personalInfo,
      summary: userProvidedSummary,
      skills: userProvidedSkills,
      experience: userProvidedExperience,
      projects: processedProjects,
      education: processedEducation,
      certifications: processedCertifications
    };

    console.log('✅ Data processed:', {
      hasGithub: !!personalInfo.github,
      hasWebsite: !!personalInfo.website,
      locationUpdated: jdLocation ? true : false,
      educationCount: processedEducation.length,
      projectsCount: processedProjects.length
    });

    // Calculate ATS score
    const atsAnalysis = calculateATSScore(finalResume, jdKeywords);
    console.log(`📊 ATS Score: ${atsAnalysis.score}%`);

    // Calculate page estimate
    const pageEstimate = estimateResumePages(finalResume);
    console.log(`📏 Estimated ${pageEstimate.estimatedPages} pages`);

    // Return comprehensive result
    const result = {
      resume: finalResume,
      atsScore: atsAnalysis.score,
      matchedKeywords: atsAnalysis.matched,
      missingKeywords: atsAnalysis.missing,
      keywordAnalysis: {
        totalJDKeywords: atsAnalysis.totalKeywords,
        matchedInResume: atsAnalysis.matchedCount
      },
      pageEstimate: {
        pages: pageEstimate.estimatedPages,
        lines: pageEstimate.estimatedLines,
        recommendation: pageEstimate.recommendation,
        isOverTwoPages: pageEstimate.isOverTwoPages
      },
      locationMatched: !!jdLocation
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