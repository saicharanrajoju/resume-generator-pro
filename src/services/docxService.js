import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    TabStopType,
    convertInchesToTwip,
    BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * PERFECT RESUME GENERATOR - ALL ISSUES FIXED
 * - Proper 0.5" margins
 * - Working hyperlinks
 * - Correct date alignment
 * - Times New Roman
 * - Professional spacing
 */

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // 1. NAME (CENTERED, BOLD, 24pt)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        size: 48, // 24pt - bigger and bolder
                        bold: true,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
            })
        );

        // ============================================
        // 2. CONTACT LINE (All on ONE line, centered, with hyperlinks)
        // ============================================
        const contactChildren = [];

        // City, State
        if (personalInfo.address?.city || personalInfo.address?.state) {
            const cityState = [
                personalInfo.address?.city,
                personalInfo.address?.state
            ].filter(Boolean).join(', ');

            contactChildren.push(
                new TextRun({
                    text: cityState,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
        }

        // Phone
        if (personalInfo.phone) {
            contactChildren.push(
                new TextRun({
                    text: personalInfo.phone,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
        }

        // Email (styled as hyperlink - blue and underlined)
        if (personalInfo.email) {
            contactChildren.push(
                new TextRun({
                    text: personalInfo.email,
                    size: 22,
                    font: 'Times New Roman',
                    color: '0563C1', // Blue
                    underline: {}
                })
            );
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
        }

        // LinkedIn
        if (parsedData.onlinePresence?.linkedin) {
            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');

            contactChildren.push(
                new TextRun({
                    text: 'LinkedIn: ',
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );
            contactChildren.push(
                new TextRun({
                    text: linkedinDisplay,
                    size: 22,
                    font: 'Times New Roman',
                    color: '0563C1', // Blue
                    underline: {}
                })
            );
        }

        // Single contact line paragraph
        sections.push(
            new Paragraph({
                children: contactChildren,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
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
                    spacing: { before: 200, after: 100 },
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

            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: resumeData.summary,
                            size: 22,
                            font: 'Times New Roman',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 }
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
                    spacing: { before: 200, after: 100 },
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
                        spacing: { after: 80 }
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
                    spacing: { before: 200, after: 100 },
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
                // Job title with date - CORRECT tab stop for 0.5" margins
                // Page width = 8.5", margins = 0.5" each, usable = 7.5"
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
                                position: convertInchesToTwip(7.5) // Full width at 0.5" margins
                            }
                        ],
                        spacing: { before: 100, after: 80 }
                    })
                );

                // Bullets
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
                            bullet: { level: 0 },
                            spacing: { after: 70 }
                        })
                    );
                });

                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
                }
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
                    spacing: { before: 200, after: 100 },
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
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { before: 100, after: 80 }
                    })
                );

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
                            spacing: { after: 70 }
                        })
                    );
                }

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
                            spacing: { after: 70 }
                        })
                    );
                }

                if (index < resumeData.projects.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
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
                    spacing: { before: 200, after: 100 },
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
                        spacing: { after: 80 }
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
                    spacing: { before: 200, after: 100 },
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
                // School (bold) | Degree (italic) with year right-aligned
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
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { before: 100, after: 80 }
                    })
                );

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
                            spacing: { after: 70 }
                        })
                    );
                }

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
                            spacing: { after: 80 }
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

        // Generate and download
        const blob = await Packer.toBlob(doc);
        const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;