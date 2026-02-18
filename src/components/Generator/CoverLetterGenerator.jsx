import { useState } from 'react';
import { generateCoverLetter } from '../../services/coverLetterDocxService';

const PLACEHOLDER = `John Doe
123 Main St
Ann Arbor, MI 48104
(555) 123-4567
john@example.com

February 17, 2026

Hiring Manager
Acme Corp
456 Corporate Blvd
San Francisco, CA 94105

Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Acme Corp, as advertised on your careers page. With my background in **full-stack development** and passion for building scalable systems, I am excited about the opportunity to contribute to your team.

In my current role at XYZ Inc., I led the development of a **microservices architecture** handling over 10 million requests daily. I collaborated with cross-functional teams to deliver features that increased user engagement by 35%. My experience with *React*, *Node.js*, and *AWS* aligns well with your tech stack requirements.

I am particularly drawn to Acme Corp's mission of democratizing access to technology. I would welcome the opportunity to discuss how my skills and experience can contribute to your team's goals. I have enclosed my resume for your review and look forward to hearing from you.

Sincerely,

John Doe

Enclosure`;

function CoverLetterGenerator() {
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');

    if (!content.trim()) {
      setError('Paste your cover letter content to generate.');
      return;
    }

    setGenerating(true);
    try {
      await generateCoverLetter(content);
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cover Letter Generator</h1>
        <p className="text-gray-600">
          Paste your complete cover letter below and download it as a professionally formatted DOCX.
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
            Cover Letter *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Include everything — your info, date, recipient, salutation, body, and closing.
            Supports **bold** and *italic* markdown.
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={22}
            className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
            placeholder={PLACEHOLDER}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Download Cover Letter (.docx)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CoverLetterGenerator;
