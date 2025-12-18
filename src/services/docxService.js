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
 * - Professional formatting
 * - Times New Roman font
 * - Proper spacing and alignment
 * - Clean structure
 */

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // 1. NAME (CENTERED, BOLD, 26pt)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

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
        // 2. CONTACT LINE (One line, centered)
        // ============================================
        const contactChildren = [];

        // Full address with zipcode
        if (personalInfo.address?.city || personalInfo.address?.state) {
            const location = [
                personalInfo.address?.city,
                personalInfo.address?.state,
                personalInfo.address?.zipCode
            ].filter(Boolean).join(', ');

            contactChildren.push(
                new TextRun({
                    text: location,
                    size: 22,
                    font: 'Times New Roman',
                    color: '000000'
                })
            );

            if (personalInfo.phone || personalInfo.email) {
                contactChildren.push(
                    new TextRun({
                        text: ' | ',
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                );
            }
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

            if (personalInfo.email) {
                contactChildren.push(
                    new TextRun({
                        text: ' | ',
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                );
            }
        }

        // Email (styled as link - blue and underlined)
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

            if (parsedData.onlinePresence?.linkedin) {
                contactChildren.push(
                    new TextRun({
                        text: ' | ',
                        size: 22,
                        font: 'Times New Roman',
                        color: '000000'
                    })
                );
            }
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
                    spacing: { after: 120, line: 276 } // 1.15 line spacing
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
                            size: 6
                        }
                    }
                })
            );

            resumeData.experience.forEach((exp, index) => {
                // Job title with date - RIGHT-aligned
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
                                position: convertInchesToTwip(7.5) // Correct for 0.5" margins
                            }
                        ],
                        spacing: { before: 120, after: 100 }
                    })
                );

                // Bullets with proper spacing
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
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { after: 80, line: 276 } // 1.15 line spacing
                        })
                    );
                });

                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
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
                        spacing: { before: 120, after: 100 }
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
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { after: 80, line: 276 }
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
                            indent: {
                                left: convertInchesToTwip(0.25),
                                hanging: convertInchesToTwip(0.25)
                            },
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

            resumeData.education.forEach((edu, index) => {
                // School (bold) | Full Degree with Field (italic)
                const degreeText = edu.field
                    ? `${edu.degree} in ${edu.field}`
                    : edu.degree;

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
                        spacing: { before: 120, after: 80 }
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
                            spacing: { after: 80 }
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
                            spacing: { after: 100 }
                        })
                    );
                }

                if (index < resumeData.education.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
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
        const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;