import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from 'docx';
import { saveAs } from 'file-saver';

const docxService = {
    async generateResume(resumeData, userProfile) {
        const sections = [];

        // HEADER - Name and Contact
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${userProfile.personalInfo.firstName} ${userProfile.personalInfo.lastName}`,
                        bold: true,
                        size: 32, // 16pt
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );

        // Contact Info Line
        const contactParts = [];
        if (userProfile.personalInfo.address?.city) {
            contactParts.push(`${userProfile.personalInfo.address.city}, ${userProfile.personalInfo.address.state || ''}`);
        }
        if (userProfile.personalInfo.email) {
            contactParts.push(userProfile.personalInfo.email);
        }
        if (userProfile.personalInfo.phone) {
            contactParts.push(userProfile.personalInfo.phone);
        }
        if (userProfile.onlinePresence?.linkedin) {
            contactParts.push(userProfile.onlinePresence.linkedin);
        }

        sections.push(
            new Paragraph({
                text: contactParts.join(' | '),
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            })
        );

        // SUMMARY SECTION
        if (resumeData.summary || userProfile.professionalSummary) {
            sections.push(
                this.createSectionHeader('SUMMARY'),
                new Paragraph({
                    text: resumeData.summary || userProfile.professionalSummary,
                    spacing: { after: 300 }
                })
            );
        }

        // TECHNICAL SKILLS SECTION
        if (resumeData.skills && resumeData.skills.length > 0) {
            sections.push(this.createSectionHeader('TECHNICAL SKILLS'));

            // Group skills by category
            const skillGroups = this.groupSkills(resumeData.skills, userProfile.skills);

            skillGroups.forEach(group => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${group.category}: `,
                                bold: true
                            }),
                            new TextRun({
                                text: group.skills.join(', ')
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // PROFESSIONAL EXPERIENCE SECTION
        if (resumeData.experience && resumeData.experience.length > 0) {
            sections.push(this.createSectionHeader('PROFESSIONAL EXPERIENCE'));

            resumeData.experience.forEach((exp, index) => {
                // Job Title and Company
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${exp.position}`,
                                bold: true
                            }),
                            new TextRun({
                                text: `, ${exp.company}`
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );

                // Dates (right-aligned would need table, so we'll put inline)
                sections.push(
                    new Paragraph({
                        text: exp.period,
                        italics: true,
                        spacing: { after: 100 }
                    })
                );

                // Achievements as bullets
                exp.achievements.forEach(achievement => {
                    sections.push(
                        new Paragraph({
                            text: achievement,
                            bullet: { level: 0 },
                            spacing: { after: 50 }
                        })
                    );
                });

                // Space between jobs
                if (index < resumeData.experience.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 150 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // PROJECTS SECTION
        if (userProfile.projects && userProfile.projects.length > 0) {
            sections.push(this.createSectionHeader('PROJECTS'));

            userProfile.projects.forEach((project, index) => {
                sections.push(
                    new Paragraph({
                        text: project.name,
                        bold: true,
                        spacing: { after: 100 }
                    })
                );

                if (project.description) {
                    sections.push(
                        new Paragraph({
                            text: project.description,
                            bullet: { level: 0 },
                            spacing: { after: 50 }
                        })
                    );
                }

                if (project.technologies && project.technologies.length > 0) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Technologies Used: ',
                                    bold: true
                                }),
                                new TextRun({
                                    text: project.technologies.join(', ')
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 50 }
                        })
                    );
                }

                if (index < userProfile.projects.length - 1) {
                    sections.push(new Paragraph({ text: '', spacing: { after: 150 } }));
                }
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // CERTIFICATIONS SECTION
        if (userProfile.certifications && userProfile.certifications.length > 0) {
            sections.push(this.createSectionHeader('CERTIFICATIONS'));

            userProfile.certifications.forEach(cert => {
                const certText = cert.issueDate
                    ? `${cert.name} (${cert.issueDate})`
                    : cert.name;

                sections.push(
                    new Paragraph({
                        text: certText,
                        spacing: { after: 100 }
                    })
                );
            });

            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }

        // EDUCATION SECTION
        if (resumeData.education && resumeData.education.length > 0) {
            sections.push(this.createSectionHeader('EDUCATION'));

            resumeData.education.forEach(edu => {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${edu.school}`,
                                bold: true
                            }),
                            new TextRun({
                                text: `, ${edu.degree} in ${edu.field}`
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );

                if (edu.year) {
                    sections.push(
                        new Paragraph({
                            text: edu.year,
                            italics: true,
                            spacing: { after: 100 }
                        })
                    );
                }

                if (edu.gpa) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: `,
                                    bold: true
                                }),
                                new TextRun({
                                    text: edu.gpa
                                })
                            ],
                            bullet: { level: 0 },
                            spacing: { after: 100 }
                        })
                    );
                }
            });
        }

        // Create Document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch = 1440 twips
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: sections
            }]
        });

        // Generate and Download
        const blob = await Packer.toBlob(doc);
        const fileName = `Resume_${userProfile.personalInfo.firstName}_${userProfile.personalInfo.lastName}.docx`;
        saveAs(blob, fileName);
    },

    createSectionHeader(text) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    bold: true,
                    size: 24, // 12pt
                    font: 'Calibri'
                })
            ],
            border: {
                bottom: {
                    color: '000000',
                    space: 1,
                    style: 'single',
                    size: 6
                }
            },
            spacing: { before: 200, after: 150 }
        });
    },

    groupSkills(resumeSkills, profileSkills) {
        const groups = [];

        // If we have technical skills from profile
        if (profileSkills?.technical && profileSkills.technical.length > 0) {
            groups.push({
                category: 'Programming & Tools',
                skills: profileSkills.technical
            });
        }

        // If we have soft skills
        if (profileSkills?.soft && profileSkills.soft.length > 0) {
            groups.push({
                category: 'Additional Skills',
                skills: profileSkills.soft
            });
        }

        // Fallback to resume skills if no profile skills
        if (groups.length === 0 && resumeSkills.length > 0) {
            groups.push({
                category: 'Skills',
                skills: resumeSkills
            });
        }

        return groups;
    }
};

export default docxService;