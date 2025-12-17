import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    TabStopType,
    TabStopPosition,
    convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // HEADER - Name (Title style, default font, black)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        color: '000000'
                    })
                ],
                style: 'Title',
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 }
            })
        );

        // ============================================
        // CONTACT INFO (Heading 2 style, centered, pipe separated)
        // Line spacing: 170180 (complex multiple)
        // ============================================
        const contactParts = [];

        if (personalInfo.address?.city && personalInfo.address?.state) {
            contactParts.push(`${personalInfo.address.city}, ${personalInfo.address.state}`);
        }
        if (personalInfo.phone) {
            contactParts.push(personalInfo.phone);
        }
        if (personalInfo.email) {
            contactParts.push(personalInfo.email);
        }
        if (parsedData.onlinePresence?.linkedin) {
            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');
            contactParts.push(`LinkedIn: ${linkedinDisplay}`);
        }

        if (contactParts.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: contactParts.join(' | '),
                            color: '000000'
                        })
                    ],
                    style: 'Heading 2',
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 }
                })
            );
        }

        // Empty paragraph for spacing
        sections.push(new Paragraph({ text: '' }));

        // ============================================
        // SUMMARY SECTION (if exists)
        // ============================================
        if (resumeData.summary) {
            // Section Header (Heading 1 style)
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'SUMMARY',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 1',
                    spacing: { before: 0, after: 0 },
                    indent: { left: convertInchesToTwip(0.097) }
                })
            );

            // Summary content (Body Text style)
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: resumeData.summary,
                            color: '000000'
                        })
                    ],
                    style: 'Body Text',
                    indent: { left: convertInchesToTwip(0.097) },
                    spacing: { after: 0 }
                })
            );
        }

        // ============================================
        // TECHNICAL SKILLS SECTION
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            // Section Header (Heading 2 style)
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'TECHNICAL SKILLS',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 2',
                    spacing: { before: 146, after: 0 } // 7.3pt before
                })
            );

            // Skills content (Body Text style, bold category names)
            Object.entries(resumeData.skills).forEach(([category, skills]) => {
                const children = [
                    new TextRun({
                        text: `${category}: `,
                        bold: true,
                        color: '000000'
                    }),
                    new TextRun({
                        text: Array.isArray(skills) ? skills.join(', ') : skills,
                        color: '000000'
                    })
                ];

                sections.push(
                    new Paragraph({
                        children: children,
                        style: 'Body Text',
                        indent: { left: convertInchesToTwip(0.097) },
                        spacing: { after: 0 }
                    })
                );
            });

            // Empty paragraph after section
            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // PROFESSIONAL EXPERIENCE SECTION
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            // Section Header
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROFESSIONAL EXPERIENCE',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 1',
                    spacing: { before: 1, after: 0 } // 0.05pt before
                })
            );

            resumeData.experience.forEach((exp, index) => {
                // Job Title Line (Bold) with Date (Right-aligned via tab)
                // Tab stop at 6.078 inches
                const jobTitleChildren = [
                    new TextRun({
                        text: exp.position,
                        bold: true,
                        color: '000000'
                    }),
                    new TextRun({
                        text: ', ',
                        color: '000000'
                    }),
                    new TextRun({
                        text: exp.company,
                        color: '000000'
                    })
                ];

                if (exp.period) {
                    jobTitleChildren.push(new TextRun({ text: '\t' }));
                    jobTitleChildren.push(
                        new TextRun({
                            text: exp.period,
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: jobTitleChildren,
                        indent: { left: convertInchesToTwip(0.097) },
                        tabStops: [
                            {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(6.078)
                            }
                        ],
                        spacing: { before: 1, after: 1 } // 0.05pt
                    })
                );

                // Achievement bullets (List Paragraph style)
                exp.achievements.forEach((achievement) => {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: achievement,
                                    color: '000000'
                                })
                            ],
                            style: 'List Paragraph',
                            bullet: { level: 0 },
                            spacing: { before: 1, after: 0 },
                            tabStops: [
                                {
                                    type: TabStopType.LEFT,
                                    position: convertInchesToTwip(0.347)
                                }
                            ]
                        })
                    );
                });

                // Empty paragraph between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '' }));
                }
            });

            // Empty paragraph after section
            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // PROJECTS SECTION
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            // Section Header
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'PROJECTS',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 2',
                    spacing: { before: 0, after: 0 }
                })
            );

            resumeData.projects.forEach((project, index) => {
                // Project Name (Bold) with Date (Right-aligned)
                const projectChildren = [
                    new TextRun({
                        text: project.name,
                        bold: true,
                        color: '000000'
                    })
                ];

                if (project.date) {
                    projectChildren.push(new TextRun({ text: '\t' }));
                    projectChildren.push(
                        new TextRun({
                            text: project.date,
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: projectChildren,
                        indent: { left: convertInchesToTwip(0.097) },
                        tabStops: [
                            {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(6.083)
                            }
                        ],
                        spacing: { after: 0 }
                    })
                );

                // Project Description (as bullet)
                if (project.description) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: project.description,
                                    color: '000000'
                                })
                            ],
                            style: 'List Paragraph',
                            bullet: { level: 0 },
                            spacing: { after: 0 },
                            tabStops: [
                                {
                                    type: TabStopType.LEFT,
                                    position: convertInchesToTwip(0.347)
                                }
                            ]
                        })
                    );
                }

                // Technologies (as bullet)
                if (project.technologies && project.technologies.length > 0) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Technologies Used: ',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: project.technologies.join(', '),
                                    color: '000000'
                                })
                            ],
                            style: 'List Paragraph',
                            bullet: { level: 0 },
                            spacing: { before: 1, after: 0 }
                        })
                    );
                }
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // CERTIFICATIONS SECTION
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'CERTIFICATIONS',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 2',
                    spacing: { before: 0, after: 0 }
                })
            );

            resumeData.certifications.forEach(cert => {
                const certText = cert.date
                    ? `${cert.name} (${cert.date})`
                    : cert.name;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: certText,
                                color: '000000'
                            })
                        ],
                        style: 'Body Text',
                        indent: { left: convertInchesToTwip(0.097) },
                        spacing: { after: 0 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // EDUCATION SECTION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'EDUCATION',
                            color: '000000'
                        })
                    ],
                    style: 'Heading 1',
                    spacing: { before: 0, after: 0 },
                    indent: { left: convertInchesToTwip(0.097) }
                })
            );

            resumeData.education.forEach(edu => {
                // School line (Bold + Italic) with Date (Right-aligned)
                const schoolChildren = [
                    new TextRun({
                        text: `${edu.school} | ${edu.degree}`,
                        bold: true,
                        italics: true,
                        color: '000000'
                    })
                ];

                if (edu.year) {
                    schoolChildren.push(new TextRun({ text: '\t' }));
                    schoolChildren.push(
                        new TextRun({
                            text: edu.year,
                            bold: true,
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: schoolChildren,
                        alignment: AlignmentType.JUSTIFY,
                        indent: {
                            left: convertInchesToTwip(0.097),
                            right: convertInchesToTwip(0.596)
                        },
                        tabStops: [
                            {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(5.901)
                            },
                            {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(6.523)
                            }
                        ],
                        spacing: { after: 0 }
                    })
                );

                // GPA and other details
                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: ${edu.gpa}`,
                                    color: '000000'
                                })
                            ],
                            indent: { left: convertInchesToTwip(0.097) },
                            spacing: { after: 0 }
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
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.relevantCoursework,
                                    color: '000000'
                                })
                            ],
                            alignment: AlignmentType.JUSTIFY,
                            indent: { left: convertInchesToTwip(0.097) },
                            spacing: { after: 0 }
                        })
                    );
                }
            });
        }

        // ============================================
        // CREATE DOCUMENT with exact margins
        // ============================================
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.486),
                            bottom: convertInchesToTwip(0.194),
                            left: convertInchesToTwip(0.403),
                            right: convertInchesToTwip(0.403)
                        }
                    }
                },
                children: sections
            }]
        });

        // Generate and Download
        const blob = await Packer.toBlob(doc);
        const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;