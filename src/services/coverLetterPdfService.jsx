import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// Styles to perfectly mirror the DOCX layout
// DOCX 1.0 inch margins = 72 points
const styles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 36,
    paddingRight: 36,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#000000',
    lineHeight: 1.15,
  },
  headerName: {
    fontSize: 26,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 11,
    fontFamily: 'Times-Roman',
  },
  link: {
    color: '#000000',
    textDecoration: 'underline',
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    marginTop: 0,
    marginBottom: 18,
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.15,
  },
  boldText: {
    fontFamily: 'Times-Bold',
  },
});

function parseMarkdown(text) {
  if (!text) return null;
  const runs = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      runs.push(<Text key={key++} style={{ fontFamily: 'Times-Bold' }}>{match[2]}</Text>);
    } else if (match[3]) {
      runs.push(<Text key={key++} style={{ fontFamily: 'Times-Italic' }}>{match[3]}</Text>);
    } else if (match[4]) {
      runs.push(<Text key={key++}>{match[4]}</Text>);
    }
  }
  return runs;
}

const CoverLetterDocument = ({ data }) => {
  const personalInfo = data.personalInfo || {};
  const recipientInfo = data.recipientInfo || {};
  const letterDetails = data.letterDetails || {};

  // Construct contact info
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
        
        {/* 1. HEADER */}
        <Text style={styles.headerName}>{personalInfo.name || 'Cover Letter'}</Text>
        <View style={styles.contactContainer}>
          {contactItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Text style={styles.contactText}> | </Text>}
              {item.type === 'link' ? (
                <Link src={item.url} style={[styles.contactText, styles.link]}>{item.text}</Link>
              ) : (
                <Text style={styles.contactText}>{item.text}</Text>
              )}
            </React.Fragment>
          ))}
        </View>
        
        <View style={styles.bottomBorder} />

        {/* 2. LETTER BODY */}
        
        {/* Date */}
        {letterDetails.date && (
          <Text style={[styles.paragraph, { marginBottom: 12 }]}>{letterDetails.date}</Text>
        )}

        {/* Recipient Info */}
        <View style={{ marginBottom: 12 }}>
          {recipientInfo.contactPerson && <Text style={{ lineHeight: 1.15 }}>{recipientInfo.contactPerson}</Text>}
          {recipientInfo.role && <Text style={{ lineHeight: 1.15 }}>{recipientInfo.role}</Text>}
          {recipientInfo.company && <Text style={[styles.boldText, { lineHeight: 1.15 }]}>{recipientInfo.company}</Text>}
          {recipientInfo.address && recipientInfo.address.split('\n').map((line, idx) => (
            <Text key={idx} style={{ lineHeight: 1.15 }}>{line}</Text>
          ))}
        </View>

        {/* Salutation */}
        {letterDetails.salutation && (
          <Text style={[styles.paragraph, { marginBottom: 12 }]}>{letterDetails.salutation}</Text>
        )}

        {/* Body Paragraphs */}
        {Array.isArray(letterDetails.bodyParagraphs) && letterDetails.bodyParagraphs.map((paragraph, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {parseMarkdown(paragraph)}
          </Text>
        ))}

        {/* Sign Off */}
        {letterDetails.signOff && (
          <Text style={[styles.paragraph, { marginTop: 12, marginBottom: 24 }]}>{letterDetails.signOff}</Text>
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
