import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';
import { useAuth } from '../../hooks/useAuth';
import { usageService } from '../../services/usageService';

function ResumeGenerator({ masterResume }) {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [generatedResume, setGeneratedResume] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generatingMessage, setGeneratingMessage] = useState('');
    const [error, setError] = useState(null);

    // Refinement chat state
    const [showRefinementChat, setShowRefinementChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [refining, setRefining] = useState(false);
    const [resumeHistory, setResumeHistory] = useState([]);

    // UI enhancement state
    const [showAllMatched, setShowAllMatched] = useState(false);
    const [showAllMissing, setShowAllMissing] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            setError('Please paste a job description');
            return;
        }

        let warmupTimer;
        let generatingTimer;

        try {
            setGenerating(true);
            setGeneratingMessage('Starting AI generation...');
            setError(null);

            // Show "warming up" message after 3 seconds
            warmupTimer = setTimeout(() => {
                setGeneratingMessage('Warming up AI service (first request takes longer)...');
            }, 3000);

            // Show "generating" message after 8 seconds
            generatingTimer = setTimeout(() => {
                setGeneratingMessage('Generating your tailored resume...');
            }, 8000);

            const result = await claudeService.generateTailoredResume(
                jobDescription,
                masterResume
            );

            clearTimeout(warmupTimer);
            clearTimeout(generatingTimer);

            if (result.usage) {
                // Add to firestore
                if (user?.uid) {
                    await usageService.addUsage(user.uid, result.usage);
                }
            }

            // After successful generation:
            setGeneratedResume(result);
            setResumeHistory([result]); // Start history
            setShowRefinementChat(true); // Show chat
            setChatMessages([
                {
                    role: 'assistant',
                    content: `Great! Your resume has been generated with an ATS score of ${result.atsScore}%. 
    
    I can help you refine it further. Just tell me what you'd like to change. For example:
    - "Add 2 soft skills to the summary"
    - "Make the first job's bullets shorter"
    - "Add more ${extractTopKeywords(jobDescription).slice(0, 2).join(' and ')} keywords"
    - "Change tone to be more action-oriented"`
                }
            ]);

        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate resume. Please try again.');
        } finally {
            clearTimeout(warmupTimer);
            clearTimeout(generatingTimer);
            setGenerating(false);
            setGeneratingMessage('');
        }
    };

    const handleRefinementRequest = async () => {
        if (!userMessage.trim()) return;

        try {
            setRefining(true);

            // Add user message to chat
            const newMessages = [
                ...chatMessages,
                { role: 'user', content: userMessage }
            ];
            setChatMessages(newMessages);
            setUserMessage('');

            // Add "thinking" message
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '✨ Working on your refinement...',
                isThinking: true
            }]);

            // Call refinement API
            const refinedResume = await claudeService.refineResume(
                generatedResume,
                userMessage,
                jobDescription,
                masterResume
            );

            if (refinedResume.usage) {
                // Add to firestore
                if (user?.uid) {
                    await usageService.addUsage(user.uid, refinedResume.usage);
                }
            }

            // Remove thinking message and add result
            setChatMessages(prev => [
                ...prev.filter(m => !m.isThinking),
                {
                    role: 'assistant',
                    content: `✓ Updated! Your ATS score ${refinedResume.atsScore > generatedResume.atsScore ? 'improved' : 'changed'
                        } from ${generatedResume.atsScore}% to ${refinedResume.atsScore}%.

${refinedResume.atsScore > generatedResume.atsScore ? '🎉 Nice improvement!' : ''}

Want to make more changes?`
                }
            ]);

            // Update resume and add to history
            setResumeHistory(prev => [...prev, refinedResume]);
            setGeneratedResume(refinedResume);

        } catch (err) {
            console.error('Refinement error:', err);
            setChatMessages(prev => [
                ...prev.filter(m => !m.isThinking),
                {
                    role: 'assistant',
                    content: '❌ Sorry, something went wrong. Please try again.'
                }
            ]);
        } finally {
            setRefining(false);
        }
    };

    const handleUndo = () => {
        if (resumeHistory.length > 1) {
            const newHistory = [...resumeHistory];
            newHistory.pop();
            setResumeHistory(newHistory);
            setGeneratedResume(newHistory[newHistory.length - 1]);

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '↩️ Undone! Reverted to previous version.'
            }]);
        }
    };

    const handleDownload = async () => {
        if (!generatedResume) return;

        try {
            await docxService.generateResume(
                generatedResume.resume,
                masterResume.parsedData
            );
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download resume');
        }
    };

    const extractTopKeywords = (jd) => {
        // Simple keyword extraction (you can make this smarter)
        const words = jd.toLowerCase().split(/\W+/);
        const common = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
        return [...new Set(words)]
            .filter(w => w.length > 4 && !common.includes(w))
            .slice(0, 10);
    };

    const getScoreColor = (score) => {
        if (score >= 95) return 'text-green-600';
        if (score >= 90) return 'text-blue-600';
        if (score >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 95) return 'bg-green-600';
        if (score >= 90) return 'bg-blue-600';
        if (score >= 85) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Generate Tailored Resume
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <div>
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here..."
                            className="w-full h-96 border rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={!jobDescription.trim() || generating}
                        className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                    >
                        {generating ? (
                            <span className="flex flex-col items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span className="text-sm">{generatingMessage}</span>
                            </span>
                        ) : (
                            'Generate Tailored Resume'
                        )}
                    </button>

                    {!generatedResume && !generating && (
                        <p className="text-center text-gray-500 mt-4 text-sm">
                            Paste a job description and click Generate to start.
                        </p>
                    )}
                </div>

                {/* Right Column - Output */}
                <div>
                    {generatedResume ? (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            {/* ATS Score */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold">ATS Match Score</h3>
                                    <span className={`text-4xl font-bold ${getScoreColor(generatedResume.atsScore)}`}>
                                        {generatedResume.atsScore}%
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all ${getScoreBgColor(generatedResume.atsScore)}`}
                                        style={{ width: `${generatedResume.atsScore}%` }}
                                    />
                                </div>

                                {/* Score interpretation */}
                                <p className="text-sm text-gray-600">
                                    {generatedResume.atsScore >= 95 && '🎯 Excellent! Your resume is highly optimized.'}
                                    {generatedResume.atsScore >= 90 && generatedResume.atsScore < 95 && '✨ Great! Strong ATS compatibility.'}
                                    {generatedResume.atsScore >= 85 && generatedResume.atsScore < 90 && '👍 Good match with room for improvement.'}
                                    {generatedResume.atsScore < 85 && '⚠️ Consider adding more relevant keywords.'}
                                </p>
                            </div>

                            {/* Keyword Analysis Stats */}
                            {generatedResume.keywordAnalysis && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-blue-900">Keyword Analysis</h4>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-blue-700 font-medium">Total JD Keywords</p>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {generatedResume.keywordAnalysis.totalJDKeywords}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-green-700 font-medium">Matched</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {generatedResume.keywordAnalysis.matchedInResume}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-orange-700 font-medium">Missing</p>
                                            <p className="text-2xl font-bold text-orange-600">
                                                {generatedResume.keywordAnalysis.totalJDKeywords - generatedResume.keywordAnalysis.matchedInResume}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Matched Keywords */}
                            {generatedResume.matchedKeywords && generatedResume.matchedKeywords.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-green-700 flex items-center gap-2">
                                            <span>✓</span>
                                            <span>Matched Keywords ({generatedResume.matchedKeywords.length})</span>
                                        </h4>
                                        <button onClick={() => setShowAllMatched(!showAllMatched)} className="text-xs text-green-600 hover:text-green-700">
                                            {showAllMatched ? 'Show Less' : 'Show All'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(showAllMatched ? generatedResume.matchedKeywords : generatedResume.matchedKeywords.slice(0, 15)).map((keyword, i) => (
                                            <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">{keyword}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {generatedResume.missingKeywords && generatedResume.missingKeywords.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                                            <span>⚠</span>
                                            <span>Missing Keywords ({generatedResume.missingKeywords.length})</span>
                                        </h4>
                                        <button onClick={() => setShowAllMissing(!showAllMissing)} className="text-xs text-orange-600 hover:text-orange-700">
                                            {showAllMissing ? 'Show Less' : 'Show All'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(showAllMissing ? generatedResume.missingKeywords : generatedResume.missingKeywords.slice(0, 10)).map((keyword, i) => (
                                            <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">{keyword}</span>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                                        <p className="text-orange-800 font-medium mb-1">💡 Suggestions:</p>
                                        <ul className="text-orange-700 text-xs list-disc list-inside space-y-1">
                                            <li>Try: "Add more {generatedResume.missingKeywords.slice(0, 3).join(', ')} keywords"</li>
                                            <li>Or use quick action: "More keywords" below</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* AI Suggestions - Only show if score < 95% */}
                            {generatedResume.atsScore < 95 && (
                                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h4 className="font-semibold mb-2 text-purple-900 flex items-center gap-2">
                                        <span>💡</span>
                                        <span>AI Suggestions to Reach 95%+</span>
                                    </h4>
                                    <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
                                        {generatedResume.missingKeywords && generatedResume.missingKeywords.length > 0 && (
                                            <li>Add these missing keywords: <span className="font-semibold">{generatedResume.missingKeywords.slice(0, 5).join(', ')}</span></li>
                                        )}
                                        {generatedResume.atsScore < 90 && <li>Consider using the "More keywords" quick action below</li>}
                                        {generatedResume.atsScore >= 90 && generatedResume.atsScore < 95 && <li>You're close! Try rephrasing bullets to include more JD terminology</li>}
                                        <li>Ensure every bullet includes at least one keyword from the job description</li>
                                    </ul>
                                </div>
                            )}

                            {/* Resume Preview - Expandable */}
                            <div className="mb-6 border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors bg-white"
                                >
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <span>📄</span>
                                        <span>Resume Content Preview</span>
                                    </h4>
                                    {showPreview ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {showPreview && (
                                    <div className="border-t p-4 bg-gray-50 max-h-96 overflow-y-auto">
                                        {/* Summary */}
                                        {generatedResume.resume.summary && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-700 mb-1 uppercase">Summary</p>
                                                <p className="text-sm text-gray-800 leading-relaxed">{generatedResume.resume.summary}</p>
                                            </div>
                                        )}

                                        {/* Skills - First 3 categories */}
                                        {generatedResume.resume.skills && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-700 mb-1 uppercase">Skills</p>
                                                {Object.entries(generatedResume.resume.skills).slice(0, 3).map(([cat, skills]) => (
                                                    <p key={cat} className="text-sm mb-1">
                                                        <span className="font-semibold">{cat}:</span> {Array.isArray(skills) ? skills.join(', ') : skills}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {/* First Job */}
                                        {generatedResume.resume.experience?.[0] && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-700 mb-1 uppercase">First Job</p>
                                                <p className="text-sm font-semibold">{generatedResume.resume.experience[0].position} at {generatedResume.resume.experience[0].company}</p>
                                                <ul className="list-disc list-inside text-xs text-gray-700 mt-2 space-y-1">
                                                    {generatedResume.resume.experience[0].achievements.slice(0, 3).map((ach, i) => (
                                                        <li key={i}>{ach}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Education */}
                                        {generatedResume.resume.education?.[0] && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-700 mb-1 uppercase">Education</p>
                                                <p className="text-sm font-semibold">{generatedResume.resume.education[0].school}</p>
                                                <p className="text-xs text-gray-600">{generatedResume.resume.education[0].degree} in {generatedResume.resume.education[0].field}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Refinement Chat */}
                            {showRefinementChat && (
                                <div className="mt-6 border-t pt-6">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <span>🤖</span>
                                        <span>Resume Refinement Assistant</span>
                                    </h4>

                                    {/* Chat Messages */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
                                        {chatMessages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`${msg.role === 'user'
                                                    ? 'bg-blue-100 ml-8'
                                                    : 'bg-white mr-8'
                                                    } rounded-lg p-3 ${msg.isThinking ? 'animate-pulse' : ''}`}
                                            >
                                                <p className={`text-sm ${msg.role === 'user' ? 'text-blue-900' : 'text-gray-800'
                                                    } whitespace-pre-line`}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setUserMessage('Add 2 soft skills like leadership and teamwork to the summary')}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                                            >
                                                + Add soft skills
                                            </button>
                                            <button
                                                onClick={() => setUserMessage('Make all bullets more concise, max 1.5 lines each')}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                                            >
                                                ✂️ Shorten bullets
                                            </button>
                                            <button
                                                onClick={() => setUserMessage('Add more action verbs and make tone more confident')}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                                            >
                                                💪 Stronger tone
                                            </button>
                                            <button
                                                onClick={() => setUserMessage(`Add more occurrences of these keywords: ${extractTopKeywords(jobDescription).slice(0, 3).join(', ')}`)}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                                            >
                                                🔑 More keywords
                                            </button>
                                        </div>
                                    </div>

                                    {/* Input Box */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={userMessage}
                                            onChange={(e) => setUserMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleRefinementRequest()}
                                            placeholder="Tell me what to change..."
                                            disabled={refining}
                                            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                        />
                                        <button
                                            onClick={handleRefinementRequest}
                                            disabled={refining || !userMessage.trim()}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                        >
                                            {refining ? '⏳' : '📤'}
                                        </button>
                                    </div>

                                    {/* Undo Button */}
                                    {resumeHistory.length > 1 && (
                                        <button
                                            onClick={handleUndo}
                                            className="mt-3 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                                        >
                                            ↩️ Undo last change
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    📥 Download Current Version
                                    {resumeHistory.length > 1 && (
                                        <span className="bg-green-700 px-2 py-0.5 rounded-full text-xs">
                                            v{resumeHistory.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setGeneratedResume(null);
                                        setShowRefinementChat(false);
                                        setChatMessages([]);
                                        setResumeHistory([]);
                                        setJobDescription('');
                                    }}
                                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                >
                                    🔄 Start Over
                                </button>
                            </div>
                        </div>
                    ) : (
                        !generating && (
                            <div className="bg-gray-50 rounded-lg p-12 text-center">
                                <div className="text-6xl mb-4">📄</div>
                                <p className="text-gray-600">
                                    Paste a job description and click Generate to create your tailored resume
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResumeGenerator;