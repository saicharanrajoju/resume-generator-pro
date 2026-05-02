import React from 'react';
import { pdf, Document, Page, Text, View, Link } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

export const CL_DEFAULT_SPACING = {
  paddingTop: 22,
  paddingBottom: 22,
  paddingLeft: 36,
  paddingRight: 36,
  lineHeight: 1.1,
  nameMarginBottom: 23,
  contactMarginBottom: 6,
  borderMarginBottom: 15,
  paragraphMarginBottom: 5,
  recipientMarginBottom: 5,
  salutationMarginBottom: 5,
  signOffMarginTop: 5,
  signOffMarginBottom: 0,
};

function buildStyles(sp = {}) {
  const s = { ...CL_DEFAULT_SPACING, ...sp };
  return {
    page: { paddingTop: s.paddingTop, paddingBottom: s.paddingBottom, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, fontFamily: 'Times-Roman', fontSize: 11, color: '#000000', lineHeight: s.lineHeight },
    headerName: { fontSize: 26, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: s.nameMarginBottom },
    contactContainer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: s.contactMarginBottom },
    contactText: { fontSize: 11, fontFamily: 'Times-Roman' },
    link: { color: '#000000', textDecoration: 'underline' },
    bottomBorder: { borderBottomWidth: 1, borderBottomColor: '#000000', borderBottomStyle: 'solid', marginTop: 0, marginBottom: s.borderMarginBottom },
    paragraph: { marginBottom: s.paragraphMarginBottom, lineHeight: s.lineHeight },
    boldText: { fontFamily: 'Times-Bold' },
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

export const CoverLetterDocument = ({ data, spacing = {} }) => {
  const styles = buildStyles(spacing);
  const s = { ...CL_DEFAULT_SPACING, ...spacing };
  const personalInfo = data.personalInfo || {};
  const recipientInfo = data.recipientInfo || {};
  const letterDetails = data.letterDetails || {};

  const contactItems = [];
  if (personalInfo.location) contactItems.push({ type: 'text', text: personalInfo.location });
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
        <Text style={styles.headerName}>{personalInfo.name || 'Cover Letter'}</Text>
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
        <View style={styles.bottomBorder} />

        {/* Date */}
        {letterDetails.date && (
          <Text style={[styles.paragraph, { marginBottom: s.salutationMarginBottom }]}>{letterDetails.date}</Text>
        )}

        {/* Recipient */}
        <View style={{ marginBottom: s.recipientMarginBottom }}>
          {recipientInfo.contactPerson && <Text style={{ lineHeight: s.lineHeight }}>{recipientInfo.contactPerson}</Text>}
          {recipientInfo.role && <Text style={{ lineHeight: s.lineHeight }}>{recipientInfo.role}</Text>}
          {recipientInfo.company && <Text style={[styles.boldText, { lineHeight: s.lineHeight }]}>{recipientInfo.company}</Text>}
          {recipientInfo.address && recipientInfo.address.split('\n').map((line, idx) => (
            <Text key={idx} style={{ lineHeight: s.lineHeight }}>{line}</Text>
          ))}
        </View>

        {/* Salutation */}
        {letterDetails.salutation && (
          <Text style={[styles.paragraph, { marginBottom: s.salutationMarginBottom }]}>{letterDetails.salutation}</Text>
        )}

        {/* Body */}
        {Array.isArray(letterDetails.bodyParagraphs) && letterDetails.bodyParagraphs.map((paragraph, idx) => (
          <Text key={idx} style={styles.paragraph}>{parseMarkdown(paragraph)}</Text>
        ))}

        {/* Sign Off */}
        {letterDetails.signOff && (
          <Text style={[styles.paragraph, { marginTop: s.signOffMarginTop, marginBottom: s.signOffMarginBottom }]}>{letterDetails.signOff}</Text>
        )}

        {/* Signature */}
        {letterDetails.signature && (
          <Text style={styles.boldText}>{letterDetails.signature}</Text>
        )}

      </Page>
    </Document>
  );
};

export const generateCoverLetterPdf = async (data, fileNameBase = 'Rajoju_Sai_Charan_Cover_Letter') => {
  const blob = await pdf(<CoverLetterDocument data={data} />).toBlob();
  saveAs(blob, `${fileNameBase}_Cover_Letter.pdf`);
};

export default { generateCoverLetterPdf };
