import React from 'react';
import { pdf, Document, Page, Text, View, Link } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

export const RESUME_DEFAULT_SPACING = {
  paddingTop: 25,
  paddingBottom: 23,
  paddingLeft: 36,
  paddingRight: 36,
  lineHeight: 1.2,
  nameMarginBottom: 22,
  headerMarginBottom: 5,
  contactMarginBottom: 5,
  sectionMarginTop: 4,
  sectionMarginBottom: 3,
  paragraphMarginBottom: 4,
  bulletMarginBottom: 2,
  jobHeaderMarginTop: 4,
  jobHeaderMarginBottom: 3,
  educationMarginTop: 5,
  educationMarginBottom: 2,
};

function buildStyles(sp = {}) {
  const s = { ...RESUME_DEFAULT_SPACING, ...sp };
  return {
    page: { paddingTop: s.paddingTop, paddingBottom: s.paddingBottom, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, fontFamily: 'Times-Roman', fontSize: 11, color: '#000000', lineHeight: s.lineHeight },
    headerName: { fontSize: 26, fontFamily: 'Times-Bold' },
    contactContainer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: s.contactMarginBottom },
    contactText: { fontSize: 11, fontFamily: 'Times-Roman' },
    link: { color: '#000000', textDecoration: 'underline' },
    sectionHeaderContainer: { borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', marginTop: s.sectionMarginTop, marginBottom: s.sectionMarginBottom, paddingBottom: 2 },
    sectionTitle: { fontSize: 12, fontFamily: 'Times-Bold', textTransform: 'uppercase' },
    paragraph: { marginBottom: s.paragraphMarginBottom },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: s.jobHeaderMarginTop, marginBottom: s.jobHeaderMarginBottom },
    jobTitleLeft: { flexDirection: 'row' },
    bulletPoint: { flexDirection: 'row', marginBottom: s.bulletMarginBottom, paddingLeft: 12 },
    bulletSymbol: { width: 12, fontFamily: 'Times-Roman' },
    bulletTextContainer: { flex: 1 },
    educationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: s.educationMarginTop, marginBottom: s.educationMarginBottom },
  };
}

function parseMarkdown(text) {
  if (!text) return null;
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) runs.push(<Text key={key++} style={{ fontFamily: 'Times-Bold' }}>{match[2]}</Text>);
    else if (match[3]) runs.push(<Text key={key++} style={{ fontFamily: 'Times-Italic' }}>{match[3]}</Text>);
    else if (match[4]) runs.push(<Text key={key++}>{match[4]}</Text>);
  }
  return runs;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }
  return dateStr;
}

function shortenDegree(degree) {
  if (!degree) return '';
  return degree
    .replace('Master of Science', 'M.S.').replace('Master of Arts', 'M.A.')
    .replace('Master of Engineering', 'M.Eng.').replace('Master of Business Administration', 'M.B.A.')
    .replace('Bachelor of Science', 'B.S.').replace('Bachelor of Arts', 'B.A.')
    .replace('Bachelor of Engineering', 'B.E.').replace('Bachelor of Technology', 'B.Tech.')
    .replace('Doctor of Philosophy', 'Ph.D.');
}

export const ResumeDocument = ({ resumeData, spacing = {} }) => {
  const styles = buildStyles(spacing);
  const s = { ...RESUME_DEFAULT_SPACING, ...spacing };
  const personalInfo = resumeData.personalInfo || {};

  const contactItems = [];
  const displayLocation = resumeData.contactLocation || personalInfo.location;
  if (displayLocation) contactItems.push({ type: 'text', text: displayLocation });
  if (personalInfo.phone) contactItems.push({ type: 'text', text: personalInfo.phone });
  if (personalInfo.email) contactItems.push({ type: 'link', text: personalInfo.email, url: `mailto:${personalInfo.email}` });

  const addLink = (url, display) => {
    if (!url) return;
    const cleanDisplay = display || url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const cleanLink = url.startsWith('http') ? url : `https://${url}`;
    contactItems.push({ type: 'link', text: cleanDisplay, url: cleanLink });
  };
  addLink(personalInfo.linkedin);
  addLink(personalInfo.github);
  addLink(personalInfo.website);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* HEADER */}
        <View style={{ flexDirection: 'column', marginBottom: s.headerMarginBottom }}>
          <View style={{ alignItems: 'center', marginBottom: s.nameMarginBottom }}>
            <Text style={styles.headerName}>{personalInfo.name || 'Resume'}</Text>
          </View>
          <View style={styles.contactContainer}>
            {contactItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Text style={styles.contactText}> | </Text>}
                {item.type === 'link'
                  ? <Link src={item.url} style={[styles.contactText, styles.link]}>{item.text}</Link>
                  : <Text style={styles.contactText}>{item.text}</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* SUMMARY */}
        {resumeData.summary && (
          <View>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>SUMMARY</Text></View>
            <Text style={styles.paragraph}>{parseMarkdown(resumeData.summary)}</Text>
          </View>
        )}

        {/* SKILLS */}
        {resumeData.skills && Object.keys(resumeData.skills).length > 0 && (
          <View>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>SKILLS</Text></View>
            {Object.entries(resumeData.skills).map(([category, skills]) => (
              <Text key={category} style={styles.paragraph}>
                <Text style={{ fontFamily: 'Times-Bold' }}>{category}: </Text>
                <Text>{Array.isArray(skills) ? skills.join(', ') : skills}</Text>
              </Text>
            ))}
          </View>
        )}

        {/* EXPERIENCE */}
        {resumeData.experience && resumeData.experience.length > 0 && (
          <View>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text></View>
            {resumeData.experience.map((exp, index) => (
              <View key={index} wrap={false}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobTitleLeft}>
                    <Text style={{ fontFamily: 'Times-Bold' }}>{exp.company}</Text>
                    {exp.location && <Text>, {exp.location}</Text>}
                  </View>
                  <Text>{exp.dates || exp.period}</Text>
                </View>
                {exp.position && <Text style={{ fontFamily: 'Times-Italic', fontSize: 11, marginBottom: 2 }}>{exp.position}</Text>}
                {(exp.achievements || exp.bullets || exp.responsibilities || []).map((bullet, bIndex) => (
                  <View key={bIndex} style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <View style={styles.bulletTextContainer}><Text>{parseMarkdown(bullet)}</Text></View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* PROJECTS */}
        {resumeData.projects && resumeData.projects.length > 0 && (
          <View>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>PROJECTS</Text></View>
            {resumeData.projects.map((proj, index) => (
              <View key={index} wrap={false}>
                <View style={styles.jobHeader}>
                  <Text style={{ fontFamily: 'Times-Bold' }}>{proj.name}</Text>
                </View>
                {proj.bullets && proj.bullets.length > 0
                  ? proj.bullets.map((bullet, bIndex) => (
                    <View key={bIndex} style={styles.bulletPoint}>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <View style={styles.bulletTextContainer}><Text>{parseMarkdown(bullet)}</Text></View>
                    </View>
                  ))
                  : proj.description
                    ? <View style={styles.bulletPoint}><Text style={styles.bulletSymbol}>•</Text><View style={styles.bulletTextContainer}><Text>{parseMarkdown(proj.description)}</Text></View></View>
                    : null}
                {proj.technologies && proj.technologies.length > 0 && (
                  <View style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <View style={styles.bulletTextContainer}>
                      <Text>
                        <Text style={{ fontFamily: 'Times-Bold' }}>Technologies Used: </Text>
                        <Text>{proj.technologies.join(', ')}</Text>
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CERTIFICATIONS */}
        {resumeData.certifications && resumeData.certifications.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>CERTIFICATIONS</Text></View>
            {resumeData.certifications.map((cert, index) => (
              <Text key={index} style={[styles.paragraph, { fontFamily: 'Times-Bold' }]}>
                {cert.date ? `${cert.name} (${cert.date})` : cert.name}
              </Text>
            ))}
          </View>
        )}

        {/* EDUCATION */}
        {resumeData.education && resumeData.education.length > 0 && (
          <View>
            <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>EDUCATION</Text></View>
            {resumeData.education.map((edu, index) => {
              const degreeText = edu.field ? `${shortenDegree(edu.degree)} in ${edu.field}` : shortenDegree(edu.degree);
              return (
                <View key={index} wrap={false} style={{ marginBottom: 6 }}>
                  <View style={styles.educationRow}>
                    <View style={styles.jobTitleLeft}>
                      <Text style={{ fontFamily: 'Times-Bold' }}>{edu.school}</Text>
                      <Text> | </Text>
                      <Text style={{ fontFamily: 'Times-Italic' }}>{degreeText}</Text>
                    </View>
                    {edu.year && <Text style={{ fontFamily: 'Times-Bold' }}>{formatDate(edu.year)}</Text>}
                  </View>
                  {edu.gpa && <Text style={styles.paragraph}>GPA: {edu.gpa}</Text>}
                  {edu.relevantCoursework && (
                    <Text style={styles.paragraph}>
                      <Text style={{ fontFamily: 'Times-BoldItalic' }}>Relevant Coursework: </Text>
                      {edu.relevantCoursework}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </Page>
    </Document>
  );
};

export const generateResumePdf = async (resumeData, fileNameBase = 'Rajoju_Sai_Charan_Resume') => {
  const blob = await pdf(<ResumeDocument resumeData={resumeData} />).toBlob();
  saveAs(blob, `${fileNameBase}.pdf`);
};

export default { generateResumePdf };
