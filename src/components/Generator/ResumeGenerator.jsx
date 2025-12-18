import { useState, useEffect } from 'react';
import UsageTracker from './UsageTracker';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';
import { usageService } from '../../services/usageService';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, Panel, ScaleButton } from '../ui/MotionWrapper';
function ResumeGenerator({ masterResume }) {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [generatedResume, setGeneratedResume] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Step 2: Job-specific details state
    const [showJobDetails, setShowJobDetails] = useState(false);
    const [addLocations, setAddLocations] = useState(false);
    const [addProjectDates, setAddProjectDates] = useState(false);
    const [jobSpecificData, setJobSpecificData] = useState({
        jobLocations: {},
        projectDates: {}
    });
    const shouldShowJobDetails = () => {
        if (!jobDescription || jobDescription.trim().length < 100) {
            return false;
        }

        const jobsMissingLocation = masterResume.parsedData.workExperience?.some(
            job => !job.location
        ) ?? false;

        const projectsMissingDates = masterResume.parsedData.projects?.some(
            proj => !proj.date
        ) ?? false;

        return jobsMissingLocation || projectsMissingDates;
    };


    // Usage Tracking
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [usageHistory, setUsageHistory] = useState([]);

    useEffect(() => {
        if (user?.uid) {
            loadUsageHistory();
        }
    }, [user]);

    const loadUsageHistory = async () => {
        if (!user?.uid) return;
        const history = await usageService.getUsageHistory(user.uid);
        setUsageHistory(history);
    };

    const updateJobLocation = (index, value) => {
        setJobSpecificData(prev => ({
            ...prev,
            jobLocations: {
                ...prev.jobLocations,
                [index]: value
            }
        }));
    };

    const updateProjectDate = (index, value) => {
        setJobSpecificData(prev => ({
            ...prev,
            projectDates: {
                ...prev.projectDates,
                [index]: value
            }
        }));
    };

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            setError('Please paste a job description');
            return;
        }

        try {
            setGenerating(true);
            setError(null);

            // Merge job-specific data temporarily (don't save to master)
            const enrichedResume = {
                ...masterResume,
                parsedData: {
                    ...masterResume.parsedData,
                    workExperience: masterResume.parsedData.workExperience?.map((job, index) => ({
                        ...job,
                        location: jobSpecificData.jobLocations?.[index] || job.location
                    })),
                    projects: masterResume.parsedData.projects?.map((project, index) => ({
                        ...project,
                        date: jobSpecificData.projectDates?.[index] || project.date
                    }))
                }
            };

            const result = await claudeService.generateTailoredResume(
                jobDescription,
                enrichedResume // Use enriched version with job-specific data
            );

            if (result.usage) {
                // Add to firestore
                if (user?.uid) {
                    await usageService.addUsage(user.uid, result.usage);
                    // Refresh local history
                    loadUsageHistory();
                }
            }

            setGeneratedResume(result);
        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate resume. Please try again.');
        } finally {
            setGenerating(false);
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
        <FadeIn className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Generate Tailored Resume</h1>
                <ScaleButton
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
                >
                    {showAnalytics ? 'Hide Analytics' : '📊 View Token Usage'}
                </ScaleButton>
            </div>

            <AnimatePresence>
                {showAnalytics && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <UsageTracker
                            usageHistory={usageHistory}
                            onClose={() => setShowAnalytics(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <div>
                    <Panel className="p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900">1. Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here..."
                            className="w-full h-96 border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-gray-50 transition-all"
                        />
                    </Panel>

                    {/* Step 2: Job-Specific Details (Optional) */}
                    {shouldShowJobDetails() && !generatedResume && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        💡 Job-Specific Details (Optional)
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Add details for this application only (won't be saved to master resume)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowJobDetails(!showJobDetails)}
                                    className="text-yellow-700 hover:text-yellow-800 font-medium text-sm"
                                >
                                    {showJobDetails ? '▼ Hide' : '▶ Show'}
                                </button>
                            </div>

                            {showJobDetails && (
                                <div className="space-y-4 mt-4 border-t border-yellow-200 pt-4">
                                    {/* Job Locations */}
                                    {masterResume.parsedData.workExperience?.length > 0 && (
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="mr-2 w-4 h-4"
                                                    checked={addLocations}
                                                    onChange={(e) => setAddLocations(e.target.checked)}
                                                />
                                                Add Job Locations
                                            </label>
                                            {addLocations && (
                                                <div className="space-y-2 ml-6">
                                                    {masterResume.parsedData.workExperience.map((job, index) => (
                                                        <div key={index} className="flex flex-col gap-1">
                                                            <span className="text-xs text-gray-600">
                                                                {job.position} at {job.company}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder="Remote / City, State"
                                                                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                                                                value={jobSpecificData.jobLocations[index] || ''}
                                                                onChange={(e) => updateJobLocation(index, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Project Dates */}
                                    {masterResume.parsedData.projects?.length > 0 && (
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="mr-2 w-4 h-4"
                                                    checked={addProjectDates}
                                                    onChange={(e) => setAddProjectDates(e.target.checked)}
                                                />
                                                Add Project Dates
                                            </label>
                                            {addProjectDates && (
                                                <div className="space-y-2 ml-6">
                                                    {masterResume.parsedData.projects.map((project, index) => (
                                                        <div key={index} className="flex flex-col gap-1">
                                                            <span className="text-xs text-gray-600">
                                                                {project.name}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder="Jan 2024 - May 2024"
                                                                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                                                                value={jobSpecificData.projectDates[index] || ''}
                                                                onChange={(e) => updateProjectDate(index, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <motion.button
                        layout
                        onClick={handleGenerate}
                        disabled={!jobDescription.trim() || generating}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm relative overflow-hidden ${!jobDescription.trim() ? 'bg-gray-200 text-gray-400' : 'bg-emerald-600 text-white'
                            }`}
                        whileHover={!generating && jobDescription.trim() ? { scale: 1.02 } : {}}
                        whileTap={!generating && jobDescription.trim() ? { scale: 0.98 } : {}}
                        animate={generating ? {
                            width: '100%',
                            backgroundColor: '#059669', // emerald-600
                            transition: { duration: 0.3 }
                        } : {}}
                    >
                        <AnimatePresence mode='wait'>
                            {generating ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center justify-center gap-3"
                                >
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Crafting Resume...</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    Generate Tailored Resume
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Right Column - Output */}
                <div>
                    {generatedResume && (
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

                                {/* Keyword Analysis */}
                                {generatedResume.keywordAnalysis && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Keyword Match:</span> {generatedResume.keywordAnalysis.matchedInResume} out of {generatedResume.keywordAnalysis.totalJDKeywords} keywords ({generatedResume.keywordAnalysis.matchRate})
                                        </p>
                                    </div>
                                )}

                                {generatedResume.atsScore < 90 && (
                                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <h4 className="font-semibold text-orange-800 mb-2">
                                            💡 Want to Improve Your Score?
                                        </h4>
                                        <p className="text-sm text-gray-700 mb-3">
                                            Your score is below 90%. Try regenerating with more aggressive keyword matching.
                                        </p>
                                        <button
                                            onClick={() => {
                                                const enhanced = `${jobDescription}\n\nCRITICAL: Score MUST be 95%+. Be EXTREMELY aggressive with keywords.`;
                                                setJobDescription(enhanced);
                                                handleGenerate();
                                            }}
                                            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 text-sm"
                                        >
                                            🔄 Regenerate (More Aggressive)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Matched Keywords */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-2 text-green-700 flex items-center gap-2">
                                    <span>✓</span>
                                    <span>Matched Keywords ({generatedResume.matchedKeywords?.length || 0})</span>
                                </h4>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                    {generatedResume.matchedKeywords?.slice(0, 20).map((keyword, i) => (
                                        <span
                                            key={i}
                                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                    {generatedResume.matchedKeywords?.length > 20 && (
                                        <span className="text-gray-500 text-sm px-3 py-1">
                                            +{generatedResume.matchedKeywords.length - 20} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Missing Keywords */}
                            {generatedResume.missingKeywords && generatedResume.missingKeywords.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-2 text-orange-700 flex items-center gap-2">
                                        <span>⚠</span>
                                        <span>Missing Keywords ({generatedResume.missingKeywords.length})</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {generatedResume.missingKeywords.slice(0, 15).map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                        💡 These JD keywords couldn't be naturally included without compromising authenticity
                                    </p>
                                </div>
                            )}

                            {/* Optimization Strategy */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold mb-2 text-blue-900">Optimization Strategy</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                    {generatedResume.optimizationStrategy}
                                </p>
                            </div>

                            {/* Resume Preview */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                                <h4 className="font-semibold mb-3">Resume Preview</h4>

                                {/* Summary */}
                                {generatedResume.resume.summary && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">SUMMARY</p>
                                        <p className="text-sm text-gray-600">{generatedResume.resume.summary}</p>
                                    </div>
                                )}

                                {/* Skills Preview */}
                                {generatedResume.resume.skills && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">TECHNICAL SKILLS</p>
                                        <div className="text-sm text-gray-600">
                                            {Object.entries(generatedResume.resume.skills).slice(0, 3).map(([category, skills]) => (
                                                <p key={category} className="mb-1">
                                                    <span className="font-semibold">{category}:</span> {Array.isArray(skills) ? skills.slice(0, 5).join(', ') : skills}...
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Experience Preview */}
                                {generatedResume.resume.experience && generatedResume.resume.experience.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">EXPERIENCE (First Job)</p>
                                        <p className="text-sm text-gray-800 font-medium">
                                            {generatedResume.resume.experience[0].position} at {generatedResume.resume.experience[0].company}
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                                            {generatedResume.resume.experience[0].achievements.slice(0, 2).map((achievement, i) => (
                                                <li key={i} className="mb-1">{achievement.substring(0, 100)}...</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                                >
                                    📥 Download DOCX
                                </button>
                                <button
                                    onClick={() => {
                                        setGeneratedResume(null);
                                        setJobSpecificData({ jobLocations: {}, projectDates: {} });
                                        setAddLocations(false);
                                        setAddProjectDates(false);
                                    }}
                                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                >
                                    Start Over
                                </button>
                            </div>
                        </div>
                    )}

                    {!generatedResume && !generating && (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <div className="text-6xl mb-4">📄</div>
                            <p className="text-gray-600">
                                Paste a job description and click Generate to create your tailored resume
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </FadeIn>
    );
}

export default ResumeGenerator;