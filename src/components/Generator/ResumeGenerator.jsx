import { useState } from 'react';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';

function ResumeGenerator({ masterResume }) {
    const [jobDescription, setJobDescription] = useState('');
    const [generatedResume, setGeneratedResume] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Refinement chat state
    const [showRefinementChat, setShowRefinementChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [refining, setRefining] = useState(false);
    const [resumeHistory, setResumeHistory] = useState([]);

    // ... existing state ...

    const handleGenerate = async () => {
        // ... existing generation code ...

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

    const extractTopKeywords = (jd) => {
        // Simple keyword extraction (you can make this smarter)
        const words = jd.toLowerCase().split(/\W+/);
        const common = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
        return [...new Set(words)]
            .filter(w => w.length > 4 && !common.includes(w))
            .slice(0, 10);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* ... existing code ... */}

            {/* Right Column - Output */}
            <div>
                {generatedResume && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        {/* ATS Score and details ... */}

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
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                            >
                                📥 Download Current Version
                            </button>
                            <button
                                onClick={() => {
                                    setGeneratedResume(null);
                                    setShowRefinementChat(false);
                                    setChatMessages([]);
                                    setResumeHistory([]);
                                }}
                                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                            >
                                🔄 Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResumeGenerator;