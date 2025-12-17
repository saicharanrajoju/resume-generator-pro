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
 * WORKING DOCX GENERATOR - EXACT TEMPLATE MATCH
 * 
 * This version manually creates every element to match your Word template exactly
 * No relying on built-in styles that don't work properly
 */

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // 1. NAME (Large, Black, Left-aligned)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        size: 32, // 16pt
                        bold: false,
                        font: 'Calibri',
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 }
            })
        );

        // ============================================
        // 2. CONTACT LINE (Centered, with REAL hyperlinks)
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
                    font: 'Calibri',
                    color: '000000'
                })
            );
        }

        // Phone
        if (personalInfo.phone) {
            if (contactParts.length > 0) {
                contactParts.push(new TextRun({ text: ' | ', size: 22, font: 'Calibri' }));
            }
            contactParts.push(
                new TextRun({
                    text: personalInfo.phone,
                    size: 22,
                    font: 'Calibri',
                    color: '000000'
                })
            );
        }

        // Email (as clickable hyperlink)
        if (personalInfo.email) {
            if (contactParts.length > 0) {
                contactParts.push(new TextRun({ text: ' | ', size: 22, font: 'Calibri' }));
            }
            contactParts.push(
                new TextRun({
                    text: personalInfo.email,
                    size: 22,
                    font: 'Calibri',
                    color: '0563C1', // Blue
                    underline: {}
                })
            );
        }

        // LinkedIn (as clickable hyperlink)
        if (parsedData.onlinePresence?.linkedin) {
            if (contactParts.length > 0) {
                contactParts.push(new TextRun({ text: ' | LinkedIn: ', size: 22, font: 'Calibri' }));
            }

            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');

            contactParts.push(
                new TextRun({
                    text: linkedinDisplay,
                    size: 22,
                    font: 'Calibri',
                    color: '0563C1', // Blue
                    underline: {}
                })
            );
        }

        sections.push(
            new Paragraph({
                children: contactParts,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );

        // ============================================
        // 3. SUMMARY SECTION
        // ============================================
        if (resumeData.summary) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'SUMMARY',
                            size: 24, // 12pt
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 200 }
                })
            );
        }

        // ============================================
        // 4. TECHNICAL SKILLS
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'TECHNICAL SKILLS',
                            size: 24, // 12pt
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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

            // Skills content - bold category, regular items
            Object.entries(resumeData.skills).forEach(([category, skills]) => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${category}: `,
                                bold: true,
                                size: 22,
                                font: 'Calibri',
                                color: '000000'
                            }),
                            new TextRun({
                                text: Array.isArray(skills) ? skills.join(', ') : skills,
                                size: 22,
                                font: 'Calibri',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 80 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // ============================================
        // 5. PROFESSIONAL EXPERIENCE
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROFESSIONAL EXPERIENCE',
                            size: 24,
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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
                // Job title line: "Position, Company" (bold position) with date on right
                const titleChildren = [
                    new TextRun({
                        text: exp.position,
                        bold: true,
                        size: 22,
                        font: 'Calibri',
                        color: '000000'
                    }),
                    new TextRun({
                        text: `, ${exp.company}`,
                        size: 22,
                        font: 'Calibri',
                        color: '000000'
                    })
                ];

                if (exp.period) {
                    titleChildren.push(new TextRun({ text: '\t' }));
                    titleChildren.push(
                        new TextRun({
                            text: exp.period,
                            size: 22,
                            font: 'Calibri',
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
                                position: convertInchesToTwip(6.5) // Right edge
                            }
                        ],
                        spacing: { before: 100, after: 80 }
                    })
                );

                // Achievement bullets
                exp.achievements.forEach((achievement) => {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: achievement,
                                    size: 22,
                                    font: 'Calibri',
                                    color: '000000'
                                })
                            ],
                            bullet: {
                                level: 0
                            },
                            spacing: { after: 60 }
                        })
                    );
                });

                // Space between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // ============================================
        // 6. PROJECTS
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROJECTS',
                            size: 24,
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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
                // Project name (bold) with date on right
                const projChildren = [
                    new TextRun({
                        text: project.name,
                        bold: true,
                        size: 22,
                        font: 'Calibri',
                        color: '000000'
                    })
                ];

                if (project.date) {
                    projChildren.push(new TextRun({ text: '\t' }));
                    projChildren.push(
                        new TextRun({
                            text: project.date,
                            size: 22,
                            font: 'Calibri',
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
                        spacing: { before: 100, after: 80 }
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
                                    font: 'Calibri',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 60 }
                        })
                    );
                }

                // Technologies (bullet)
                if (project.technologies && project.technologies.length > 0) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Technologies Used: ',
                                    bold: true,
                                    size: 22,
                                    font: 'Calibri',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: project.technologies.join(', '),
                                    size: 22,
                                    font: 'Calibri',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 60 }
                        })
                    );
                }

                if (index < resumeData.projects.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // ============================================
        // 7. CERTIFICATIONS
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'CERTIFICATIONS',
                            size: 24,
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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
                                font: 'Calibri',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 80 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // ============================================
        // 8. EDUCATION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            // Section Header with underline
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'EDUCATION',
                            size: 24,
                            bold: true,
                            font: 'Calibri',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 },
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
                // School line (italic) with date (bold) on right
                const schoolChildren = [
                    new TextRun({
                        text: `${edu.school} | ${edu.degree}`,
                        italics: true,
                        bold: true,
                        size: 22,
                        font: 'Calibri',
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
                            font: 'Calibri',
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
                        spacing: { before: 100, after: 80 }
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
                                    font: 'Calibri',
                                    color: '000000'
                                })
                            ],
                            spacing: { after: 60 }
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
                                    font: 'Calibri',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.relevantCoursework,
                                    size: 22,
                                    font: 'Calibri',
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
        // CREATE DOCUMENT WITH EXACT MARGINS
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