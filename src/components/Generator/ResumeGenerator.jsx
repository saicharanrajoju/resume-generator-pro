import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { claudeService } from '../../services/claudeService';
import { docxService } from '../../services/docxService';

function ResumeGenerator({ masterResume }) {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            alert('Please paste a job description');
            return;
        }

        if (jobDescription.trim().length < 100) {
            alert('Please paste a more detailed job description (at least 100 characters)');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Generate tailored resume using master resume
            const generatedResult = await claudeService.generateTailoredResume(
                jobDescription,
                masterResume
            );

            setResult(generatedResult);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!result) return;

        try {
            await docxService.generateResume(result.resume, masterResume.parsedData);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download resume. Please try again.');
        }
    };

    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard! ✅');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Generate Tailored Resume
                    </h2>
                    <p className="text-gray-600">
                        Paste the job description below and we'll create a perfectly tailored resume from your master resume.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Job Description
                            </h3>
                            <span className="text-sm text-gray-500">Step 1</span>
                        </div>

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here...

Include:
- Job title
- Required qualifications
- Responsibilities
- Required skills and technologies
- Years of experience needed

The more detail you provide, the better the AI can tailor your resume!"
                            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !jobDescription.trim()}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating tailored resume...
                                </span>
                            ) : (
                                '✨ Generate Tailored Resume'
                            )}
                        </button>

                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">
                                    ⚡ AI is working on your resume...
                                </p>
                                <p className="text-xs text-blue-600">
                                    • Analyzing job requirements<br />
                                    • Extracting keywords for ATS<br />
                                    • Tailoring your experience<br />
                                    • Optimizing for 97%+ match rate
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Tailored Resume
                            </h3>
                            {result && <span className="text-sm text-green-600 font-medium">Step 2 ✓</span>}
                        </div>

                        {!result && !loading && (
                            <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <div className="text-center">
                                    <p className="text-4xl mb-4">📄</p>
                                    <p className="text-lg font-medium text-gray-500">Your tailored resume will appear here</p>
                                    <p className="text-sm text-gray-400 mt-2">Paste a job description and click generate</p>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6">
                                {/* ATS Score */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-700">ATS Match Score:</span>
                                        <span className={`text-3xl font-bold ${result.atsScore >= 95 ? 'text-green-600' :
                                            result.atsScore >= 85 ? 'text-blue-600' :
                                                result.atsScore >= 75 ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {result.atsScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${result.atsScore >= 95 ? 'bg-green-600' :
                                                result.atsScore >= 85 ? 'bg-blue-600' :
                                                    result.atsScore >= 75 ? 'bg-yellow-600' :
                                                        'bg-red-600'
                                                }`}
                                            style={{ width: `${result.atsScore}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {result.atsScore >= 95 ? '🎉 Excellent! Very high chance of passing ATS' :
                                            result.atsScore >= 85 ? '✅ Great! Strong ATS compatibility' :
                                                result.atsScore >= 75 ? '⚠️ Good, but could be improved' :
                                                    '❌ Needs more optimization'}
                                    </p>

                                    {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <p className="text-xs font-medium text-gray-700 mb-2">
                                                Matched Keywords ({result.matchedKeywords.length}):
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {result.matchedKeywords.slice(0, 10).map((keyword, i) => (
                                                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {result.matchedKeywords.length > 10 && (
                                                    <span className="text-xs text-gray-500 px-2 py-1">
                                                        +{result.matchedKeywords.length - 10} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto bg-gray-50">
                                    <div className="space-y-4 text-sm">
                                        {/* Summary */}
                                        {result.resume.summary && (
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs uppercase mb-2 pb-1 border-b border-gray-300">
                                                    Summary
                                                </h4>
                                                <p className="text-gray-700 leading-relaxed">{result.resume.summary}</p>
                                            </div>
                                        )}

                                        {/* Skills */}
                                        {result.resume.skills && Object.keys(result.resume.skills).length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs uppercase mb-2 pb-1 border-b border-gray-300">
                                                    Technical Skills
                                                </h4>
                                                {Object.entries(result.resume.skills).map(([category, skills]) => (
                                                    <p key={category} className="text-gray-700 mb-1">
                                                        <span className="font-semibold">{category}:</span> {skills.join(', ')}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {/* Experience */}
                                        {result.resume.experience && result.resume.experience.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs uppercase mb-2 pb-1 border-b border-gray-300">
                                                    Professional Experience
                                                </h4>
                                                {result.resume.experience.map((exp, i) => (
                                                    <div key={i} className="mb-3">
                                                        <p className="font-semibold text-gray-800">{exp.position}</p>
                                                        <p className="text-gray-600 text-xs italic">{exp.company} | {exp.period}</p>
                                                        <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                                                            {exp.achievements.map((ach, j) => (
                                                                <li key={j} className="text-xs leading-relaxed">{ach}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Projects */}
                                        {result.resume.projects && result.resume.projects.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs uppercase mb-2 pb-1 border-b border-gray-300">
                                                    Projects
                                                </h4>
                                                {result.resume.projects.map((proj, i) => (
                                                    <div key={i} className="mb-2">
                                                        <p className="font-semibold text-gray-800 text-xs">{proj.name}</p>
                                                        <p className="text-gray-700 text-xs">{proj.description}</p>
                                                        {proj.technologies && (
                                                            <p className="text-gray-600 text-xs mt-1">
                                                                <span className="font-semibold">Technologies:</span> {proj.technologies.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                        📥 Download as DOCX
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleCopyText(JSON.stringify(result.resume, null, 2))}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            📋 Copy JSON
                                        </button>
                                        <button
                                            onClick={() => setResult(null)}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                                        >
                                            🔄 Start Over
                                        </button>
                                    </div>
                                </div>

                                {/* Strategy Note */}
                                {result.optimizationStrategy && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-blue-800 mb-1">
                                            AI Optimization Strategy:
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            {result.optimizationStrategy}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResumeGenerator;