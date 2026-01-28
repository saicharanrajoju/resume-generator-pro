import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    TabStopType,
    convertInchesToTwip,
    BorderStyle,
    ExternalHyperlink
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * PERFECT RESUME GENERATOR - ALL FIXES APPLIED
 * - Clickable hyperlinks
 * - Subtle underlines
 * - Proper spacing (no double spaces)
 * - Tight bullet spacing
 */

/**
 * Parses text with **bold** markers and returns array of text runs
 * Example: "Built models using **Python**" -> [{text: "Built models using ", bold: false}, {text: "Python", bold: true}]
 */
function parseFormattedText(text) {
    if (!text) return [{ text: '', bold: false }];

    const runs = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        // Add text before the bold part
        if (match.index > lastIndex) {
            runs.push({
                text: text.substring(lastIndex, match.index),
                bold: false
            });
        }

        // Add the bold part (content inside **...**)
        runs.push({
            text: match[1],
            bold: true
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last bold marker
    if (lastIndex < text.length) {
        runs.push({
            text: text.substring(lastIndex),
            bold: false
        });
    }

    // If no bold markers found, return entire text as non-bold
    if (runs.length === 0) {
        runs.push({
            text: text,
            bold: false
        });
    }

    return runs;
}

/**
 * Format date from YYYY-MM to Month YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    // Check if format is YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
        const [year, month] = dateStr.split('-');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[parseInt(month) - 1]} ${year}`;
    }
    return dateStr;
}

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = resumeData.personalInfo || {};

        // ============================================
        // 1. NAME (CENTERED, BOLD, 26pt)
        // ============================================
        const fullName = personalInfo.name || 'Resume';

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        size: 52, // 26pt
                        bold: true,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 }
            })
        );

        // ============================================
        // 2. CONTACT LINE (with REAL clickable hyperlinks)
        // ============================================
        const contactChildren = [];

        const addSep = () => {
            if (contactChildren.length > 0) {
                contactChildren.push(new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                }));
            }
        };

        // Location
        if (personalInfo.location) {
            contactChildren.push(new TextRun({
                text: personalInfo.location,
                size: 22,
                font: 'Times New Roman',
                color: '000000'
            }));
        }

        // Phone
        if (personalInfo.phone) {
            addSep();
            contactChildren.push(new TextRun({
                text: personalInfo.phone,
                size: 22,
                font: 'Times New Roman',
                color: '000000'
            }));
        }

        // Email
        if (personalInfo.email) {
            addSep();
            contactChildren.push(new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: personalInfo.email,
                        size: 22,
                        font: 'Times New Roman',
                        style: 'Hyperlink'
                    })
                ],
                link: `mailto:${personalInfo.email}`
            }));
        }

        // Helper for social links
        const addLink = (url, display) => {
            if (!url) return;
            addSep();
            const cleanDisplay = display || url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            const cleanLink = url.startsWith('http') ? url : `https://${url}`;

            contactChildren.push(new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: cleanDisplay,
                        size: 22,
                        font: 'Times New Roman',
                        style: 'Hyperlink'
                    })
                ],
                link: cleanLink
            }));
        };

        addLink(personalInfo.linkedin);
        addLink(personalInfo.github);
        addLink(personalInfo.website);

        sections.push(
            new Paragraph({
                children: contactChildren,
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 }
            })
        );

        // ============================================
        // 3. SUMMARY
        // ============================================
        if (resumeData.summary) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'SUMMARY',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 0, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            const summaryRuns = parseFormattedText(resumeData.summary);

            sections.push(
                new Paragraph({
                    children: summaryRuns.map(run =>
                        new TextRun({
                            text: run.text,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000',
                            bold: run.bold
                        })
                    ),
                    spacing: { after: 120, line: 276 }
                })
            );
        }

        // ============================================
        // 4. TECHNICAL SKILLS
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'TECHNICAL SKILLS',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 240, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            Object.entries(resumeData.skills || {}).forEach(([category, skills]) => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${category}: `,
                                bold: true,
                                size: 22,
                                font: 'Times New Roman',
                                color: '000000'
                            }),
                            new TextRun({
                                text: Array.isArray(skills) ? skills.join(', ') : skills,
                                size: 22,
                                font: 'Times New Roman',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            });
        }

        // ============================================
        // 5. PROFESSIONAL EXPERIENCE
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROFESSIONAL EXPERIENCE',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 240, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            resumeData.experience.forEach((exp, index) => {
                // Job title with date - RIGHT-aligned
                // Job title with date - RIGHT-aligned
                // FIX: Use company field as main title per user request
                const titleChildren = [
                    new TextRun({
                        text: exp.company,
                        bold: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];

                // Add location if available
                if (exp.location) {
                    titleChildren.push(
                        new TextRun({
                            text: `, ${exp.location}`,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    );
                }

                if (exp.period) {
                    titleChildren.push(new TextRun({ text: '\t' }));
                    titleChildren.push(
                        new TextRun({
                            text: exp.period,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: titleChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { before: 120, after: 100 }
                    })
                );

                // Bullets with tighter spacing
                // Bullets with tighter spacing
                const achievements = exp.achievements || exp.bullets || exp.responsibilities || [];
                achievements.forEach((achievement, achIndex) => {
                    const isLastBullet = achIndex === achievements.length - 1;
                    const isLastJob = index === resumeData.experience.length - 1;

                    const achievementRuns = parseFormattedText(achievement);

                    sections.push(
                        new Paragraph({
                            children: achievementRuns.map(run =>
                                new TextRun({
                                    text: run.text,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000',
                                    bold: run.bold
                                })
                            ),
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: {
                                after: (isLastBullet && !isLastJob) ? 200 : 60,
                                line: 260
                            }
                        })
                    );
                });
            });
        }

        // ============================================
        // 6. PROJECTS
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROJECTS',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 240, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            resumeData.projects.forEach((project, index) => {
                const projChildren = [
                    new TextRun({
                        text: project.name,
                        bold: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];



                sections.push(
                    new Paragraph({
                        children: projChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { before: 120, after: 100 }
                    })
                );

                // Project Bullets
                if (project.bullets && project.bullets.length > 0) {
                    project.bullets.forEach((bullet, bIndex) => {
                        const bulletRuns = parseFormattedText(bullet);
                        const isLastBullet = bIndex === project.bullets.length - 1;

                        sections.push(
                            new Paragraph({
                                children: bulletRuns.map(run =>
                                    new TextRun({
                                        text: run.text,
                                        size: 22,
                                        font: 'Times New Roman',
                                        color: '000000',
                                        bold: run.bold
                                    })
                                ),
                                bullet: { level: 0 },
                                indent: {
                                    left: convertInchesToTwip(0.25),
                                    hanging: convertInchesToTwip(0.25)
                                },
                                spacing: {
                                    after: isLastBullet ? 120 : 60,
                                    line: 260
                                }
                            })
                        );
                    });
                } else if (project.description) {
                    const descriptionRuns = parseFormattedText(project.description);

                    sections.push(
                        new Paragraph({
                            children: descriptionRuns.map(run =>
                                new TextRun({
                                    text: run.text,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000',
                                    bold: run.bold
                                })
                            ),
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { after: 60, line: 260 }  // Tighter spacing
                        })
                    );
                }

                const technologies = project.technologies || [];
                if (technologies.length > 0) {
                    const isLastProject = index === resumeData.projects.length - 1;

                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Technologies Used: ',
                                    bold: true,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: technologies.join(', '),
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { after: !isLastProject ? 200 : 60 }
                        })
                    );
                }
            });
        }

        // ============================================
        // 7. CERTIFICATIONS
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'CERTIFICATIONS',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 240, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            resumeData.certifications.forEach(cert => {
                const certText = cert.date ? `${cert.name} (${cert.date})` : cert.name;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: certText,
                                bold: true,
                                size: 22,
                                font: 'Times New Roman',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            });
        }

        // ============================================
        // 8. EDUCATION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'EDUCATION',
                            size: 24,
                            bold: true,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 240, after: 120 },
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 4  // Subtle underline
                        }
                    }
                })
            );

            // Helper function to shorten degree names
            const shortenDegree = (degree) => {
                return degree
                    .replace('Master of Science', 'M.S.')
                    .replace('Master of Arts', 'M.A.')
                    .replace('Master of Engineering', 'M.Eng.')
                    .replace('Master of Business Administration', 'M.B.A.')
                    .replace('Bachelor of Science', 'B.S.')
                    .replace('Bachelor of Arts', 'B.A.')
                    .replace('Bachelor of Engineering', 'B.E.')
                    .replace('Bachelor of Technology', 'B.Tech.')
                    .replace('Doctor of Philosophy', 'Ph.D.');
            };

            resumeData.education.forEach((edu, index) => {
                // School (bold) | Shortened Degree with Field (italic) | GPA (if exists)
                const degreeText = edu.field
                    ? `${shortenDegree(edu.degree)} in ${edu.field}`
                    : shortenDegree(edu.degree);

                const schoolChildren = [
                    new TextRun({
                        text: edu.school,
                        bold: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    }),
                    new TextRun({
                        text: ' | ',
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    }),
                    new TextRun({
                        text: degreeText,
                        italics: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];

                // Add year (right-aligned) - NO GPA on this line
                if (edu.year) {
                    schoolChildren.push(new TextRun({ text: '\t' }));
                    schoolChildren.push(
                        new TextRun({
                            text: formatDate(edu.year),
                            bold: true,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: schoolChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { before: 120, after: 80 }
                    })
                );

                // GPA on separate line (if exists)
                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: ${edu.gpa}`,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            spacing: { after: 80 }
                        })
                    );
                }

                // Relevant Coursework (if exists)
                const isLastEdu = index === resumeData.education.length - 1;
                const finalSpacing = isLastEdu ? 100 : 200;

                if (edu.relevantCoursework) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Relevant Coursework: ',
                                    bold: true,
                                    italics: true,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.relevantCoursework,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            spacing: { after: finalSpacing }
                        })
                    );
                } else if (!edu.gpa && !isLastEdu) {
                    // Add spacing between education entries if no GPA and no coursework
                    sections.push(
                        new Paragraph({
                            text: '',
                            spacing: { after: finalSpacing }
                        })
                    );
                }
            });
        }

        // ============================================
        // CREATE DOCUMENT - 0.5" margins
        // ============================================
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.5),
                            bottom: convertInchesToTwip(0.5),
                            left: convertInchesToTwip(0.5),
                            right: convertInchesToTwip(0.5)
                        }
                    }
                },
                children: sections
            }]
        });

        const blob = await Packer.toBlob(doc);
        const cleanName = (personalInfo.name || 'Resume').replace(/\s+/g, '');
        const fileName = `${cleanName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;