/**
 * Page estimation for Times New Roman 11pt, 1.15 spacing, 0.5" margins
 * Based on actual DOCX template: ~52 lines per page
 */

export const estimateResumePages = (resumeData) => {
    let lines = 0;

    // FIXED HEADER SECTIONS
    lines += 4;  // Name + contact line
    lines += 4;  // Summary (3-4 sentences assumed)

    // SKILLS (6 categories, ~1.3 lines each)
    const skillCount = Object.keys(resumeData.skills || {}).length;
    lines += 1;  // "TECHNICAL SKILLS" header
    lines += Math.min(skillCount * 1.3, 8);  // Max 8 lines for skills

    // EXPERIENCE
    lines += 1;  // "PROFESSIONAL EXPERIENCE" header
    (resumeData.experience || []).forEach((job, idx) => {
        lines += 1.2;  // Job title line (sometimes wraps)

        const bullets = (job.achievements || job.bullets || []).length;
        // Each bullet: assume 100 chars = 1 line, 150 chars = 1.5 lines
        // Conservative: 1.2 lines per bullet on average
        lines += bullets * 1.2;

        // Spacing between jobs
        if (idx < resumeData.experience.length - 1) {
            lines += 0.5;
        }
    });

    // PROJECTS
    if (resumeData.projects && resumeData.projects.length > 0) {
        lines += 1;  // "PROJECTS" header
        resumeData.projects.forEach((proj, idx) => {
            lines += 1;  // Project title
            if (proj.description) lines += 1.2;  // Description bullet
            if (proj.technologies && proj.technologies.length > 0) lines += 1;  // Tech line

            if (idx < resumeData.projects.length - 1) {
                lines += 0.5;  // Spacing
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
            lines += 1.2;  // School + degree line
            if (edu.gpa) lines += 0.5;  // GPA line
            if (edu.relevantCoursework) lines += 1;  // Coursework
            lines += 0.3;  // Spacing
        });
    }

    const pages = lines / 52;  // 52 lines per page

    return {
        estimatedLines: Math.round(lines),
        estimatedPages: Math.round(pages * 10) / 10,  // e.g., 1.8
        isOverTwoPages: pages > 2.15,  // 10% buffer
        recommendation: getRecommendation(pages, resumeData)
    };
};

const getRecommendation = (pages, resumeData) => {
    if (pages <= 1.9) {
        return `✅ ${Math.round(pages * 10) / 10} pages - Perfect length!`;
    }

    if (pages <= 2.1) {
        return `✅ ${Math.round(pages * 10) / 10} pages - Fits well in 2 pages!`;
    }

    // Over 2 pages - give suggestions
    const suggestions = [];

    if (resumeData.experience && resumeData.experience.length > 3) {
        suggestions.push('remove oldest job');
    }

    if (resumeData.projects && resumeData.projects.length > 3) {
        suggestions.push('reduce to 2-3 projects');
    }

    const avgBullets = resumeData.experience
        ? resumeData.experience.reduce((acc, job) => acc + (job.achievements || []).length, 0) / resumeData.experience.length
        : 0;

    if (avgBullets > 4) {
        suggestions.push('trim bullets to 3-4 per job');
    }

    return `⚠️ ${Math.round(pages * 10) / 10} pages - Try: ${suggestions.join(', ') || 'condense content'}`;
};
