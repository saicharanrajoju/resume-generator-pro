import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';
import ResumeEditor from '../Editor/ResumeEditor';

function ResumeGenerator() {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            alert('Please paste a job description');
            return;
        }

        setLoading(true);
        setError(null);
        setEditMode(false);

        try {
            // Get user profile
            const profile = await profileService.getProfile(user.uid);

            if (!profile) {
                alert('Please set up your profile first');
                return;
            }

            setUserProfile(profile);

            // Generate resume using Claude API
            const generatedResult = await claudeService.generateResume(
                jobDescription,
                profile
            );

            setResult(generatedResult);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        // Convert resume to HTML for editing
        const htmlContent = convertResumeToHTML(result.resume, userProfile);
        setEditedContent(htmlContent);
        setEditMode(true);
    };

    const handleSaveEdit = () => {
        // Update result with edited content
        // For now, just exit edit mode
        // In a full implementation, you'd parse the HTML back to resume structure
        setEditMode(false);
        alert('Changes saved! (Note: Editing updates preview only)');
    };

    const handleDownload = async () => {
        if (!result || !userProfile) return;

        try {
            await docxService.generateResume(result.resume, userProfile);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download resume. Please try again.');
        }
    };

    const handleCopyEmail = () => {
        if (!result) return;

        navigator.clipboard.writeText(result.email);
        alert('Email copied to clipboard! ✅');
    };

    const convertResumeToHTML = (resume, profile) => {
        return `
      <h2>${profile.fullName}</h2>
      <p>${profile.email} | ${profile.phone || ''} | ${profile.location || ''}</p>
      
      <h3>PROFESSIONAL SUMMARY</h3>
      <p>${resume.summary}</p>
      
      <h3>EXPERIENCE</h3>
      ${resume.experience.map(exp => `
        <div>
          <p><strong>${exp.position}</strong></p>
          <p><em>${exp.company} | ${exp.period}</em></p>
          <ul>
            ${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
      
      <h3>SKILLS</h3>
      <p>${resume.skills.join(', ')}</p>
      
      <h3>EDUCATION</h3>
      ${resume.education.map(edu => `
        <p><strong>${edu.degree} in ${edu.field}</strong> - ${edu.school} (${edu.year})</p>
      `).join('')}
    `;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                    Generate Resume
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Job Description
                        </h3>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating...
                                </span>
                            ) : (
                                '✨ Generate Resume'
                            )}
                        </button>

                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            {editMode ? 'Edit Resume' : 'Generated Resume'}
                        </h3>

                        {!result && !loading && (
                            <div className="h-96 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <p className="text-xl mb-2">📄</p>
                                    <p>Your resume will appear here</p>
                                </div>
                            </div>
                        )}

                        {result && !editMode && (
                            <div className="space-y-6">
                                {/* ATS Score */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800">ATS Score:</span>
                                        <span className={`text-2xl font-bold ${result.atsScore >= 80 ? 'text-green-600' :
                                            result.atsScore >= 60 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                            {result.atsScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${result.atsScore >= 80 ? 'bg-green-600' :
                                                result.atsScore >= 60 ? 'bg-yellow-600' :
                                                    'bg-red-600'
                                                }`}
                                            style={{ width: `${result.atsScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Resume Preview */}
                                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-2">PROFESSIONAL SUMMARY</h4>
                                            <p className="text-gray-700 text-sm">{result.resume.summary}</p>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-2">EXPERIENCE</h4>
                                            {result.resume.experience.map((exp, i) => (
                                                <div key={i} className="mb-3">
                                                    <p className="font-semibold text-gray-800">{exp.position}</p>
                                                    <p className="text-gray-600 text-sm">{exp.company} | {exp.period}</p>
                                                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                                                        {exp.achievements.map((ach, j) => (
                                                            <li key={j}>{ach}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-2">SKILLS</h4>
                                            <p className="text-gray-700 text-sm">{result.resume.skills.join(', ')}</p>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-2">EDUCATION</h4>
                                            {result.resume.education.map((edu, i) => (
                                                <p key={i} className="text-gray-700 text-sm">
                                                    {edu.degree} in {edu.field}, {edu.school} ({edu.year})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        📥 Download .docx
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>

                                {/* Email Preview */}
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">Cover Letter</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {result.email}
                                    </div>
                                    <button
                                        onClick={handleCopyEmail}
                                        className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        📋 Copy Email
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Edit Mode */}
                        {result && editMode && (
                            <div className="space-y-4">
                                <ResumeEditor
                                    content={editedContent}
                                    onChange={setEditedContent}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        ✅ Save Changes
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResumeGenerator;