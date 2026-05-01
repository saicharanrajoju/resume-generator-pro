import { useState } from 'react';
import { generateCoverLetter } from '../../services/coverLetterDocxService';
import { generateCoverLetterPdf } from '../../services/coverLetterPdfService';

const PLACEHOLDER = `{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "location": "Ann Arbor, MI",
    "linkedin": "linkedin.com/in/johndoe"
  },
  "recipientInfo": {
    "company": "Acme Corp",
    "contactPerson": "Hiring Manager",
    "role": "Senior Software Engineer",
    "address": "456 Corporate Blvd\\nSan Francisco, CA 94105"
  },
  "letterDetails": {
    "date": "February 17, 2026",
    "salutation": "Dear Hiring Manager,",
    "bodyParagraphs": [
      "I am writing to express my strong interest in the **Senior Software Engineer** position at Acme Corp, as advertised on your careers page. With my background in **full-stack development** and passion for building scalable systems, I am excited about the opportunity to contribute to your team.",
      "In my current role at XYZ Inc., I led the development of a **microservices architecture** handling over 10 million requests daily. My experience with *React*, *Node.js*, and *AWS* aligns well with your tech stack requirements.",
      "I am particularly drawn to Acme Corp's mission. I would welcome the opportunity to discuss how my skills and experience can contribute to your team's goals."
    ],
    "signOff": "Sincerely,",
    "signature": "John Doe"
  }
}`;

function CoverLetterGenerator() {
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateDocx = async () => {
    setError('');

    if (!content.trim()) {
      setError('Paste your cover letter JSON to generate.');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      setError('Invalid JSON format. Please ensure your input is valid JSON.');
      return;
    }

    setGenerating(true);
    try {
      await generateCoverLetter(parsedData);
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePdf = async () => {
    setError('');

    if (!content.trim()) {
      setError('Paste your cover letter JSON to generate.');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      setError('Invalid JSON format. Please ensure your input is valid JSON.');
      return;
    }

    setGenerating(true);
    try {
      await generateCoverLetterPdf(parsedData);
    } catch (err) {
      console.error('Error generating cover letter PDF:', err);
      setError('Failed to generate cover letter PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cover Letter Generator</h1>
        <p className="text-gray-600">
          Paste your cover letter JSON below and download it as a perfectly formatted ATS-compliant DOCX.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Letter JSON *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Must be valid JSON. Supports **bold** and *italic* markdown in the body paragraphs.
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={22}
            className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
            placeholder={PLACEHOLDER}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={handleGenerateDocx}
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Download (.docx)'
            )}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={generating}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Download (.pdf)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CoverLetterGenerator;
