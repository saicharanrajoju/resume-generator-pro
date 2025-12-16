import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
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
        // HEADER - Name (25pt, Regular, Center)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: fullName,
                        size: 50, // 25pt
                        font: 'Georgia', // Closest to Charter BT
                        color: '000000'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 } // 6pt after
            })
        );

        // ============================================
        // CONTACT INFO LINE (10pt, Regular, Center)
        // Format: City, State | email | phone | linkedin
        // ============================================
        const contactParts = [];

        if (personalInfo.address?.city && personalInfo.address?.state) {
            contactParts.push(`${personalInfo.address.city}, ${personalInfo.address.state}`);
        }
        if (personalInfo.email) {
            contactParts.push(personalInfo.email);
        }
        if (personalInfo.phone) {
            contactParts.push(personalInfo.phone);
        }
        if (parsedData.onlinePresence?.linkedin) {
            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');
            contactParts.push(linkedinDisplay);
        }

        if (contactParts.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: contactParts.join(' | '),
                            size: 20, // 10pt
                            font: 'Georgia',
                            color: '000000'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 120 } // 6pt after
                })
            );
        }

        // ============================================
        // SUMMARY SECTION
        // ============================================
        if (resumeData.summary) {
            sections.push(
                this.createSectionHeader('Summary'),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: resumeData.summary,
                            size: 20, // 10pt
                            font: 'Georgia',
                            color: '000000'
                        })
                    ],
                    spacing: { after: 120 }, // 6pt after
                    alignment: AlignmentType.JUSTIFIED
                })
            );
        }

        // ============================================
        // TECHNICAL SKILLS SECTION
        // Format: Category Name: skill1, skill2, skill3
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            sections.push(this.createSectionHeader('Technical Skills'));

            Object.entries(resumeData.skills).forEach(([category, skills]) => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${category}: `,
                                bold: true,
                                size: 20, // 10pt
                                font: 'Georgia',
                                color: '000000'
                            }),
                            new TextRun({
                                text: Array.isArray(skills) ? skills.join(', ') : skills,
                                size: 20, // 10pt
                                font: 'Georgia',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 40 } // Tight spacing
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 120 } })); // 6pt after section
        }

        // ============================================
        // PROFESSIONAL EXPERIENCE SECTION
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            sections.push(this.createSectionHeader('Professional Experience'));

            resumeData.experience.forEach((exp, index) => {
                // Line 1: Job Title (Bold), Company (Regular) | Date (Right-aligned)
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: exp.position,
                                bold: true,
                                size: 20, // 10pt
                                font: 'Georgia',
                                color: '000000'
                            }),
                            new TextRun({
                                text: `, ${exp.company}`,
                                size: 20, // 10pt
                                font: 'Georgia',
                                color: '000000'
                            })
                        ],
                        tabStops: [
                            {
                                type: TabStopType.RIGHT,
                                position: TabStopPosition.MAX
                            }
                        ],
                        spacing: { after: 40 }
                    })
                );

                // Bullet Points - Left Indent 0.15", Hanging 0.25"
                exp.achievements.forEach((achievement) => {
                    // Bold key metrics/technologies within text
                    const enhancedAchievement = this.boldifyKeywords(achievement);

                    sections.push(
                        new Paragraph({
                            children: enhancedAchievement,
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            indent: {
                                left: convertInchesToTwip(0.15),
                                hanging: convertInchesToTwip(0.25)
                            }
                        })
                    );
                });

                // Space between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }

        // ============================================
        // PROJECTS SECTION
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            sections.push(this.createSectionHeader('Projects'));

            resumeData.projects.forEach((project, index) => {
                // Project Name (Bold)
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: project.name,
                                bold: true,
                                size: 20,
                                font: 'Georgia',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 40 }
                    })
                );

                // Description as bullet
                if (project.description) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: project.description,
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            indent: {
                                left: convertInchesToTwip(0.15),
                                hanging: convertInchesToTwip(0.25)
                            }
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
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: project.technologies.join(', '),
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            indent: {
                                left: convertInchesToTwip(0.15),
                                hanging: convertInchesToTwip(0.25)
                            }
                        })
                    );
                }

                if (index < resumeData.projects.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }

        // ============================================
        // CERTIFICATIONS SECTION
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            sections.push(this.createSectionHeader('Certifications'));

            resumeData.certifications.forEach(cert => {
                const certText = cert.date
                    ? `${cert.name} (${cert.date})`
                    : cert.name;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: certText,
                                size: 20,
                                font: 'Georgia',
                                color: '000000'
                            })
                        ],
                        spacing: { after: 40 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }

        // ============================================
        // EDUCATION SECTION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(this.createSectionHeader('Education'));

            resumeData.education.forEach(edu => {
                // School (Bold), Degree
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${edu.school}`,
                                bold: true,
                                size: 20,
                                font: 'Georgia',
                                color: '000000'
                            }),
                            new TextRun({
                                text: `, ${edu.degree}`,
                                size: 20,
                                font: 'Georgia',
                                color: '000000'
                            }),
                            ...(edu.field ? [
                                new TextRun({
                                    text: ` in ${edu.field}`,
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                })
                            ] : [])
                        ],
                        spacing: { after: 40 }
                    })
                );

                // GPA as bullet
                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: `,
                                    bold: true,
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.gpa,
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            indent: {
                                left: convertInchesToTwip(0.15),
                                hanging: convertInchesToTwip(0.25)
                            }
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
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                }),
                                new TextRun({
                                    text: edu.relevantCoursework,
                                    size: 20,
                                    font: 'Georgia',
                                    color: '000000'
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            indent: {
                                left: convertInchesToTwip(0.15),
                                hanging: convertInchesToTwip(0.25)
                            }
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
                            top: convertInchesToTwip(0.8),   // 0.8"
                            bottom: convertInchesToTwip(1.0), // 1.0"
                            left: convertInchesToTwip(0.75),  // 0.75"
                            right: convertInchesToTwip(0.75)  // 0.75"
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

    // Create Section Header (12pt, Bold, Bottom Border)
    createSectionHeader(text) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Georgia',
                    color: '000000'
                })
            ],
            border: {
                bottom: {
                    color: '000000',
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6
                }
            },
            spacing: { before: 120, after: 60 } // 6pt before, 3pt after
        });
    },

    // Bold key metrics and technologies in achievement text
    boldifyKeywords(text) {
        const keywords = [
            'Python', 'SQL', 'PySpark', 'Databricks', 'BigQuery', 'Tableau', 'Power BI',
            'AWS', 'Azure', 'GCP', 'Pandas', 'NumPy', 'TensorFlow', 'scikit-learn',
            'BERT', 'Machine Learning', 'ML', 'Data Science', 'ETL', 'GitHub'
        ];

        const parts = [];
        let remaining = text;

        // Simple implementation: look for numbers with % or $ or M+
        const metricRegex = /(\d+[\d,]*\+?\s*(?:%|M\+|hours?|TB|GB|records?))/gi;

        let lastIndex = 0;
        let match;

        while ((match = metricRegex.exec(text)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push(new TextRun({
                    text: text.substring(lastIndex, match.index),
                    size: 20,
                    font: 'Georgia',
                    color: '000000'
                }));
            }

            // Add bold metric
            parts.push(new TextRun({
                text: match[0],
                bold: true,
                size: 20,
                font: 'Georgia',
                color: '000000'
            }));

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(new TextRun({
                text: text.substring(lastIndex),
                size: 20,
                font: 'Georgia',
                color: '000000'
            }));
        }

        return parts.length > 0 ? parts : [new TextRun({
            text: text,
            size: 20,
            font: 'Georgia',
            color: '000000'
        })];
    }
};

export default docxService;