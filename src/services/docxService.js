import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    TabStopType,
    TabStopPosition,
    convertInchesToTwip,
    UnderlineType
} from 'docx';
import { saveAs } from 'file-saver';

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // HEADER - Name (22pt, Bold, Center)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        bold: true,
                        size: 44, // 22pt
                        font: 'Garamond',
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 }
            })
        );

        // ============================================
        // CONTACT INFO LINE (11pt, Center, Blue Links)
        // Format: City, State | email | phone | linkedin
        // ============================================
        const contactChildren = [];

        // City, State
        if (personalInfo.address?.city && personalInfo.address?.state) {
            contactChildren.push(
                new TextRun({
                    text: `${personalInfo.address.city}, ${personalInfo.address.state}`,
                    size: 22, // 11pt
                    font: 'Garamond',
                    color: '000000'
                })
            );
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Garamond',
                    color: '000000'
                })
            );
        }

        // Email (Blue, Underlined like hyperlink)
        if (personalInfo.email) {
            contactChildren.push(
                new TextRun({
                    text: personalInfo.email,
                    size: 22, // 11pt
                    font: 'Garamond',
                    color: '0563C1', // Standard Word blue
                    underline: {
                        type: UnderlineType.SINGLE
                    }
                })
            );
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Garamond',
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
                    font: 'Garamond',
                    color: '000000'
                })
            );
        }

        // LinkedIn (Blue, Underlined)
        if (parsedData.onlinePresence?.linkedin) {
            contactChildren.push(
                new TextRun({
                    text: ' | ',
                    size: 22,
                    font: 'Garamond',
                    color: '000000'
                })
            );

            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');

            contactChildren.push(
                new TextRun({
                    text: linkedinDisplay,
                    size: 22,
                    font: 'Garamond',
                    color: '0563C1', // Blue for links
                    underline: {
                        type: UnderlineType.SINGLE
                    }
                })
            );
        }

        if (contactChildren.length > 0) {
            sections.push(
                new Paragraph({
                    children: contactChildren,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 }
                })
            );
        }

        // ============================================
        // SUMMARY SECTION
        // ============================================
        if (resumeData.summary) {
            sections.push(
                this.createSectionHeader('SUMMARY'),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: resumeData.summary,
                            size: 22, // 11pt
                            font: 'Garamond',
                            color: '000000'
                        })
                    ],
                    spacing: { after: 240 },
                    alignment: AlignmentType.LEFT
                })
            );
        }

        // ============================================
        // TECHNICAL SKILLS SECTION
        // Format: Category Name: skill1, skill2, skill3
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            sections.push(this.createSectionHeader('TECHNICAL SKILLS'));

            Object.entries(resumeData.skills).forEach(([category, skills]) => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${category}: `,
                                bold: true,
                                size: 22, // 11pt
                                font: 'Garamond',
                                color: '000000'
                            }),
                            new TextRun({
                                text: Array.isArray(skills) ? skills.join(', ') : skills,
                                size: 22, // 11pt
                                font: 'Garamond',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 120 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }

        // ============================================
        // PROFESSIONAL EXPERIENCE SECTION
        // Two-line format:
        // Line 1: Company (Bold) Left | Date (Bold) Right
        // Line 2: Position (Italic) Left | Location Right
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            sections.push(this.createSectionHeader('PROFESSIONAL EXPERIENCE'));

            resumeData.experience.forEach((exp, index) => {
                // Line 1: Company (Bold) | Date (Bold, Right-aligned)
                const companyChildren = [
                    new TextRun({
                        text: exp.company,
                        bold: true,
                        size: 22, // 11pt
                        font: 'Garamond',
                        color: '000000'
                    })
                ];

                if (exp.period) {
                    companyChildren.push(
                        new TextRun({
                            text: '\t', // Tab to right
                        })
                    );
                    companyChildren.push(
                        new TextRun({
                            text: exp.period,
                            bold: true,
                            size: 22,
                            font: 'Garamond',
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: companyChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(7.5) // Right edge
                            }
                        ],
                        spacing: { after: 60 }
                    })
                );

                // Line 2: Position (Italic) | Location (Right-aligned)
                const positionChildren = [
                    new TextRun({
                        text: exp.position,
                        italics: true,
                        size: 22,
                        font: 'Garamond',
                        color: '000000'
                    })
                ];

                if (exp.location) {
                    positionChildren.push(
                        new TextRun({
                            text: '\t',
                        })
                    );
                    positionChildren.push(
                        new TextRun({
                            text: exp.location,
                            size: 22,
                            font: 'Garamond',
                            color: '000000'
                        })
                    );
                }

                sections.push(
                    new Paragraph({
                        children: positionChildren,
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: convertInchesToTwip(7.5)
                            }
                        ],
                        spacing: { after: 120 }
                    })
                );

                // Bullet Points - Standard indentation
                exp.achievements.forEach((achievement) => {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: achievement,
                                    size: 22, // 11pt
                                    font: 'Garamond',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 80 }
                        })
                    );
                });

                // Space between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 240 } }));
        }

        // ============================================
        // PROJECTS SECTION
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            sections.push(this.createSectionHeader('PROJECTS'));

            resumeData.projects.forEach((project, index) => {
                // Project Name (Bold)
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: project.name,
                                bold: true,
                                size: 22,
                                font: 'Garamond',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 80 }
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
                                    font: 'Garamond',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 80 }
                        })
                    );
                }

                // Technologies Used
                if (project.technologies && project.technologies.length > 0) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Technologies Used: ',
                                    bold: true,
                                    size: 22,
                                    font: 'Garamond',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: project.technologies.join(', '),
                                    size: 22,
                                    font: 'Garamond',
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

            sections.push(new Paragraph({ text: '', spacing: { after: 240 } }));
        }

        // ============================================
        // CERTIFICATIONS SECTION
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            sections.push(this.createSectionHeader('CERTIFICATIONS'));

            resumeData.certifications.forEach(cert => {
                const certText = cert.date
                    ? `${cert.name} (${cert.date})`
                    : cert.name;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: certText,
                                size: 22,
                                font: 'Garamond',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 120 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 240 } }));
        }

        // ============================================
        // EDUCATION SECTION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(this.createSectionHeader('EDUCATION'));

            resumeData.education.forEach(edu => {
                // Line 1: School (Bold) | Date (Bold, Right)
                const schoolChildren = [
                    new TextRun({
                        text: edu.school,
                        bold: true,
                        size: 22,
                        font: 'Garamond',
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
                            font: 'Garamond',
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
                        spacing: { after: 60 }
                    })
                );

                // Line 2: Degree (Italic)
                const degreeText = edu.field
                    ? `${edu.degree} in ${edu.field}`
                    : edu.degree;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: degreeText,
                                italics: true,
                                size: 22,
                                font: 'Garamond',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 80 }
                    })
                );

                // GPA as bullet
                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: ${edu.gpa}`,
                                    bold: true,
                                    size: 22,
                                    font: 'Garamond',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
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
                                    text: `Relevant Coursework: `,
                                    bold: true,
                                    size: 22,
                                    font: 'Garamond',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.relevantCoursework,
                                    size: 22,
                                    font: 'Garamond',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 80 }
                        })
                    );
                }
            });
        }

        // ============================================
        // CREATE DOCUMENT
        // ============================================
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.5),   // 0.5" all sides
                            bottom: convertInchesToTwip(0.5),
                            left: convertInchesToTwip(0.5),
                            right: convertInchesToTwip(0.5)
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
    },

    // Create Section Header (12pt, Bold, ALL CAPS)
    createSectionHeader(text) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text.toUpperCase(),
                    bold: true,
                    size: 24, // 12pt
                    font: 'Garamond',
                    color: '000000'
                })
            ],
            spacing: { before: 240, after: 120 }
        });
    }
};

export default docxService;