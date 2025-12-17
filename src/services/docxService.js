import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, convertInchesToTwip, HeadingLevel, Hyperlink } from 'docx';
import { saveAs } from 'file-saver';

/**
 * EXACT TEMPLATE REPLICATION
 * Based on analysis of Information-Technology-Resume.docx
 * 
 * Key findings:
 * - Margins: Top 0.4861", Bottom 0.1944", Left/Right 0.4028"
 * - Name: Title style, left-aligned (NOT centered, NOT bold)
 * - Contact: Heading 2 style, CENTER-aligned, line spacing 170180
 * - Section headers: Heading 1 style (underlined via style definition)
 * - Subsection headers: Heading 2 style, 7.3pt space before
 * - Body text: 0.097" left indent
 * - Tab stops at specific positions for dates
 * - Hyperlinks in contact info (mailto: and https://)
 */

const docxService = {
    async generateResume(resumeData, parsedData) {
        const sections = [];
        const personalInfo = parsedData.personalInfo || {};

        // ============================================
        // 1. NAME (Title style, LEFT aligned, NOT bold)
        // ============================================
        const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();

        sections.push(
            new Paragraph({
                text: fullName,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.LEFT,
                spacing: { after: 0 }
            })
        );

        // ============================================
        // 2. CONTACT LINE (Heading 2, CENTER, special line spacing, with hyperlinks)
        // Line spacing: 170180 (very specific)
        // ============================================
        const contactChildren = [];

        // City, State, Zip
        if (personalInfo.address?.city || personalInfo.address?.state) {
            const cityState = [
                personalInfo.address?.city,
                personalInfo.address?.state,
                personalInfo.address?.zipCode
            ].filter(Boolean).join(', ');

            contactChildren.push(
                new TextRun({ text: cityState })
            );
            contactChildren.push(new TextRun({ text: ' | ' }));
        }

        // Phone
        if (personalInfo.phone) {
            contactChildren.push(new TextRun({ text: personalInfo.phone }));
            contactChildren.push(new TextRun({ text: ' | ' }));
        }

        // Email (as hyperlink)
        if (personalInfo.email) {
            contactChildren.push(
                new Hyperlink({
                    text: personalInfo.email,
                    link: `mailto:${personalInfo.email}`
                })
            );
            contactChildren.push(new TextRun({ text: ' | ' }));
        }

        // LinkedIn (as hyperlink)
        if (parsedData.onlinePresence?.linkedin) {
            const linkedinUrl = parsedData.onlinePresence.linkedin;
            const linkedinDisplay = linkedinUrl.replace('https://', '').replace('http://', '');

            contactChildren.push(new TextRun({ text: 'LinkedIn: ' }));
            contactChildren.push(
                new Hyperlink({
                    text: linkedinDisplay,
                    link: linkedinUrl
                })
            );
        }

        sections.push(
            new Paragraph({
                children: contactChildren,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: {
                    after: 0,
                    line: 170180  // Exact line spacing from template
                }
            })
        );

        // Empty paragraph
        sections.push(new Paragraph({ text: '' }));

        // ============================================
        // 3. SUMMARY SECTION
        // ============================================
        if (resumeData.summary) {
            // Header: Heading 1, 0.097" indent
            sections.push(
                new Paragraph({
                    text: 'SUMMARY',
                    heading: HeadingLevel.HEADING_1,
                    indent: { left: convertInchesToTwip(0.097) },
                    spacing: { before: 0, after: 0 }
                })
            );

            // Content: Body Text style, 0.097" indent
            sections.push(
                new Paragraph({
                    text: resumeData.summary,
                    style: 'BodyText',
                    indent: { left: convertInchesToTwip(0.097) },
                    spacing: { after: 0 }
                })
            );
        }

        // ============================================
        // 4. TECHNICAL SKILLS
        // ============================================
        if (resumeData.skills && Object.keys(resumeData.skills).length > 0) {
            sections.push(
                new Paragraph({
                    text: 'TECHNICAL SKILLS',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 146, after: 0 } // 7.3pt = 146 twips
                })
            );

            Object.entries(resumeData.skills).forEach(([category, skills]) => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${category}: `,
                                bold: true
                            }),
                            new TextRun({
                                text: Array.isArray(skills) ? skills.join(', ') : skills
                            })
                        ],
                        style: 'BodyText',
                        indent: { left: convertInchesToTwip(0.097) },
                        spacing: { after: 0 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // 5. PROFESSIONAL EXPERIENCE
        // ============================================
        if (resumeData.experience && resumeData.experience.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'PROFESSIONAL EXPERIENCE',
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 1, after: 0 }
                })
            );

            resumeData.experience.forEach((exp, index) => {
                // Job title line with date (tab at 6.078")
                const titleChildren = [
                    new TextRun({
                        text: exp.position,
                        bold: true
                    }),
                    new TextRun({ text: ', ' }),
                    new TextRun({ text: exp.company })
                ];

                if (exp.period) {
                    titleChildren.push(new TextRun({ text: '\t' }));
                    titleChildren.push(new TextRun({ text: exp.period }));
                }

                sections.push(
                    new Paragraph({
                        children: titleChildren,
                        indent: { left: convertInchesToTwip(0.097) },
                        tabStops: [
                            {
                                type: TabStopType.LEFT,
                                position: convertInchesToTwip(6.078)
                            }
                        ],
                        spacing: { before: 1, after: 1 }
                    })
                );

                // Bullets
                exp.achievements.forEach((achievement) => {
                    sections.push(
                        new Paragraph({
                            text: achievement,
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.347),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { before: 1, after: 0 }
                        })
                    );
                });

                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '' }));
                }
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // 6. PROJECTS
        // ============================================
        if (resumeData.projects && resumeData.projects.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'PROJECTS',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 0, after: 0 }
                })
            );

            resumeData.projects.forEach((project) => {
                // Project name with date
                const projChildren = [
                    new TextRun({
                        text: project.name,
                        bold: true
                    })
                ];

                if (project.date) {
                    projChildren.push(new TextRun({ text: '\t' }));
                    projChildren.push(new TextRun({ text: project.date }));
                }

                sections.push(
                    new Paragraph({
                        children: projChildren,
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

                // Description as bullet
                if (project.description) {
                    sections.push(
                        new Paragraph({
                            text: project.description,
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.347),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { after: 0 }
                        })
                    );
                }

                // Technologies
                if (project.technologies && project.technologies.length > 0) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'Technologies Used: ' }),
                                new TextRun({ text: project.technologies.join(', ') })
                            ],
                            bullet: { level: 0 },
                            indent: {
                                left: convertInchesToTwip(0.347),
                                hanging: convertInchesToTwip(0.25)
                            },
                            spacing: { before: 1, after: 0 }
                        })
                    );
                }
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // 7. CERTIFICATIONS
        // ============================================
        if (resumeData.certifications && resumeData.certifications.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'CERTIFICATIONS',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 0, after: 0 }
                })
            );

            resumeData.certifications.forEach(cert => {
                const certText = cert.date ? `${cert.name} (${cert.date})` : cert.name;

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: certText,
                                bold: true
                            })
                        ],
                        style: 'BodyText',
                        indent: { left: convertInchesToTwip(0.097) },
                        spacing: { after: 0 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '' }));
        }

        // ============================================
        // 8. EDUCATION
        // ============================================
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'EDUCATION',
                    heading: HeadingLevel.HEADING_1,
                    indent: { left: convertInchesToTwip(0.097) },
                    spacing: { before: 0, after: 0 }
                })
            );

            resumeData.education.forEach(edu => {
                // School line (bold + italic) with date
                const schoolChildren = [
                    new TextRun({
                        text: `${edu.school} | ${edu.degree}`,
                        bold: true,
                        italics: true
                    })
                ];

                if (edu.year) {
                    schoolChildren.push(new TextRun({ text: '\t' }));
                    schoolChildren.push(
                        new TextRun({
                            text: edu.year,
                            bold: true
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

                // GPA
                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            text: `GPA: ${edu.gpa}`,
                            indent: { left: convertInchesToTwip(0.097) },
                            spacing: { after: 0 }
                        })
                    );
                }

                // Coursework
                if (edu.relevantCoursework) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Relevant Coursework: ',
                                    bold: true,
                                    italics: true
                                }),
                                new TextRun({ text: edu.relevantCoursework })
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
        // CREATE DOCUMENT - EXACT MARGINS
        // ============================================
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.4861),
                            bottom: convertInchesToTwip(0.1944),
                            left: convertInchesToTwip(0.4028),
                            right: convertInchesToTwip(0.4028)
                        }
                    }
                },
                children: sections
            }]
        });

        // Generate and save
        const blob = await Packer.toBlob(doc);
        const fileName = `${personalInfo.firstName}_${personalInfo.lastName}_Resume.docx`;
        saveAs(blob, fileName);
    }
};

export default docxService;