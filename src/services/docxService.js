import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    TabStopType,
    convertInchesToTwip,
    ExternalHyperlink,
    BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * PERFECT RESUME GENERATOR
 * All issues fixed - Professional ATS-friendly format
 */

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // 1. NAME (CENTERED, BOLD, 20pt, Times New Roman)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        size: 40, // 20pt
                        bold: true,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 }
            })
        );

        // ============================================
        // 2. CONTACT LINE (Centered, with REAL clickable hyperlinks)
        // ============================================
        const contactParts = [];

        // City, State
        if (personalInfo.address?.city || personalInfo.address?.state) {
            const cityState = [
                personalInfo.address?.city,
                personalInfo.address?.state
            ].filter(Boolean).join(', ');

            contactParts.push(
                new TextRun({
                    text: cityState,
                    size: 22, // 11pt
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
        }

        // Phone
        if (personalInfo.phone) {
            if (contactParts.length > 0) {
                contactParts.push(new TextRun({ text: ' | ', size: 22, font: 'Times New Roman' }));
            }
            contactParts.push(
                new TextRun({
                    text: personalInfo.phone,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
        }

        // Email (as REAL clickable hyperlink)
        if (personalInfo.email) {
            if (contactParts.length > 0) {
                contactParts.push(new TextRun({ text: ' | ', size: 22, font: 'Times New Roman' }));
            }

            // Create actual hyperlink
            sections.push(
                new Paragraph({
                    children: [
                        ...contactParts,
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: personalInfo.email,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '0563C1',
                                    underline: {}
                                })
                            ],
                            link: `mailto:${personalInfo.email}`
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                })
            );

            // Reset contactParts for LinkedIn
            contactParts.length = 0;

            // LinkedIn on same line
            if (parsedData.onlinePresence?.linkedin) {
                const linkedinUrl = parsedData.onlinePresence.linkedin;
                const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: ' | LinkedIn: ',
                                size: 22,
                                font: 'Times New Roman'
                            }),
                            new ExternalHyperlink({
                                children: [
                                    new TextRun({
                                        text: linkedinDisplay,
                                        size: 22,
                                        font: 'Times New Roman',
                                        color: '0563C1',
                                        underline: {}
                                    })
                                ],
                                link: linkedinUrl
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 }
                    })
                );
            }
        } else {
            // If no email, just put contact parts
            sections.push(
                new Paragraph({
                    children: contactParts,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 }
                })
            );
        }

        // ============================================
        // 3. SUMMARY SECTION
        // ============================================
        if (resumeData.summary) {
            // Section Header with thin underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'SUMMARY',
                            size: 24, // 12pt
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
                            size: 6
                        }
                    }
                })
            );

            // Summary content
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: resumeData.summary,
                            size: 22, // 11pt
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 120 }
                })
            );
        }

        // ============================================
        // 4. TECHNICAL SKILLS
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            // Section Header
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
                            size: 6
                        }
                    }
                })
            );

            // Skills content
            Object.entries(resumeData.skills).forEach(([category, skills]) => {
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
            // Section Header
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
                            size: 6
                        }
                    }
                })
            );

            resumeData.experience.forEach((exp, index) => {
                // Job title line: "Position, Company" with date RIGHT-aligned
                const titleChildren = [
                    new TextRun({
                        text: exp.position,
                        bold: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    }),
                    new TextRun({
                        text: `, ${exp.company}`,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];

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
                                position: convertInchesToTwip(6.5) // Far right
                            }
                        ],
                        spacing: { before: 120, after: 100 }
                    })
                );

                // Achievement bullets with better spacing
                exp.achievements.forEach((achievement) => {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: achievement,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            bullet: {
                                level: 0
                            },
                            spacing: { after: 80 }
                        })
                    );
                });

                // Space between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                }
            });
        }

        // ============================================
        // 6. PROJECTS
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            // Section Header
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
                            size: 6
                        }
                    }
                })
            );

            resumeData.projects.forEach((project, index) => {
                // Project name with date RIGHT-aligned
                const projChildren = [
                    new TextRun({
                        text: project.name,
                        bold: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];

                if (project.date) {
                    projChildren.push(new TextRun({ text: '\t' }));
                    projChildren.push(
                        new TextRun({
                            text: project.date,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: projChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(6.5)
                            }
                        ],
                        spacing: { before: 120, after: 100 }
                    })
                );

                // Description as bullet
                if (project.description) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: project.description,
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 80 }
                        })
                    );
                }

                // Technologies as bullet (not separate line)
                if (project.technologies && project.technologies.length > 0) {
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
                                    text: project.technologies.join(', '),
                                    size: 22,
                                    font: 'Times New Roman',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 80 }
                        })
                    );
                }

                if (index < resumeData.projects.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                }
            });
        }

        // ============================================
        // 7. CERTIFICATIONS
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            // Section Header
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
                            size: 6
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
            // Section Header
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
                            size: 6
                        }
                    }
                })
            );

            resumeData.education.forEach(edu => {
                // School line (BOLD only) with date (bold) RIGHT-aligned
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
                        text: edu.degree,
                        italics: true,
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ];

                if (edu.year) {
                    schoolChildren.push(new TextRun({ text: '\t' }));
                    schoolChildren.push(
                        new TextRun({
                            text: edu.year,
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
                                position: convertInchesToTwip(6.5)
                            }
                        ],
                        spacing: { before: 120, after: 80 }
                    })
                );

                // GPA
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

                // Relevant Coursework
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
                            spacing: { after: 100 }
                        })
                    );
                }
            });
        }

        // ============================================
        // CREATE DOCUMENT - 1" margins (standard)
        // ============================================
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1.0),
                            bottom: convertInchesToTwip(1.0),
                            left: convertInchesToTwip(1.0),
                            right: convertInchesToTwip(1.0)
                        }
                    }
                },
                children: sections
            }]
        });

        // Generate and download
        const blob = await Packer.toBlob(doc);
        const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;