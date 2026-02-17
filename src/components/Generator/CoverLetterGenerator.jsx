import { useState } from 'react';
import { generateCoverLetter } from '../../services/coverLetterDocxService';

const CLOSING_OPTIONS = [
  "Sincerely,",
  "Best regards,",
  "Respectfully,",
  "Kind regards,",
  "Thank you,",
];

function CoverLetterGenerator({ masterResume }) {
  const personalInfo = masterResume?.parsedData?.personalInfo || {};

  const [sender, setSender] = useState({
    name: personalInfo.name || '',
    address: '',
    city: personalInfo.location || '',
    state: '',
    zip: '',
    phone: personalInfo.phone || '',
    email: personalInfo.email || '',
  });

  const [recipient, setRecipient] = useState({
    name: '',
    title: '',
    company: '',
    address: '',
  });

  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('Sincerely,');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const updateSender = (field, value) => {
    setSender(prev => ({ ...prev, [field]: value }));
  };

  const updateRecipient = (field, value) => {
    setRecipient(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setError('');

    if (!sender.name.trim()) {
      setError('Your name is required.');
      return;
    }
    if (!body.trim()) {
      setError('Cover letter body content is required.');
      return;
    }

    setGenerating(true);
    try {
      await generateCoverLetter({
        sender,
        recipient,
        body,
        closing,
      });
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
          Paste your cover letter content and fill in contact details to generate a professional DOCX file.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Your Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={sender.name}
                onChange={e => updateSender('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={sender.email}
                onChange={e => updateSender('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={sender.phone}
                onChange={e => updateSender('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={sender.address}
                onChange={e => updateSender('address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={sender.city}
                onChange={e => updateSender('city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ann Arbor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={sender.state}
                  onChange={e => updateSender('state', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  value={sender.zip}
                  onChange={e => updateSender('zip', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="48104"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hiring Manager Name
              </label>
              <input
                type="text"
                value={recipient.name}
                onChange={e => updateRecipient('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hiring Manager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={recipient.title}
                onChange={e => updateRecipient('title', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Director of Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={recipient.company}
                onChange={e => updateRecipient('company', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
              <input
                type="text"
                value={recipient.address}
                onChange={e => updateRecipient('address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="456 Corporate Blvd, City, ST 12345"
              />
            </div>
          </div>
        </div>

        {/* Cover Letter Body */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Cover Letter Body *</h2>
          <p className="text-sm text-gray-500 mb-4">
            Paste your cover letter content in markdown format. Supports **bold** and *italic* text.
          </p>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder={`I am writing to express my strong interest in the Software Engineer position at Acme Corp, as advertised on your careers page. With my background in full-stack development and passion for building scalable systems, I am excited about the opportunity to contribute to your team.

In my current role at XYZ Inc., I have led the development of **microservices architecture** that handles over 10 million requests daily. I collaborated with cross-functional teams to deliver features that increased user engagement by 35%. My experience with *React*, *Node.js*, and *AWS* aligns well with your tech stack requirements.

I am particularly drawn to Acme Corp's mission of democratizing access to technology. I would welcome the opportunity to discuss how my skills and experience can contribute to your team's goals. I have enclosed my resume for your review and look forward to hearing from you.`}
          />
        </div>

        {/* Closing Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Closing</h2>
          <div className="flex flex-wrap gap-2">
            {CLOSING_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => setClosing(option)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  closing === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
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
