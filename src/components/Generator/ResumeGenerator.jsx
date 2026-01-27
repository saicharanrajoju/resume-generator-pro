import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';
import { useAuth } from '../../hooks/useAuth';
import { usageService } from '../../services/usageService';
import { estimateResumePages } from '../../utils/resumePageEstimator';

function ResumeGenerator({ masterResume }) {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [jdAnalysis, setJdAnalysis] = useState(null);

    // Manual Input State
    const [manualSummary, setManualSummary] = useState('');
    const [manualSkills, setManualSkills] = useState('');
    const [manualExperience, setManualExperience] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Generation State
    const [generatedResume, setGeneratedResume] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generatingMessage, setGeneratingMessage] = useState('');
    const [error, setError] = useState(null);

    // UI State
    const [showPreview, setShowPreview] = useState(true);
    const [pageAnalysis, setPageAnalysis] = useState(null);

    // JSON Validation Helper
    const validateJSON = (jsonString, fieldName) => {
        try {
            JSON.parse(jsonString);
            setValidationErrors({
                ...validationErrors,
                [fieldName]: null
            });
            alert(`✓ Valid JSON for ${fieldName}!`);
        } catch (err) {
            setValidationErrors({
                ...validationErrors,
                [fieldName]: `Invalid JSON: ${err.message}`
            });
        }
    };

    // Helper: Score color
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    // Helper: Score background
    const getScoreBgColor = (score) => {
        if (score >= 90) return 'bg-green-600';
        if (score >= 75) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    const handleGenerate = async () => {
        // Clear previous errors
        setError(null);
        const errors = {};

        // Validate job description
        if (!jobDescription.trim()) {
            setError('Please paste the job description in Step 1');
            return;
        }

        // Validate summary
        if (!manualSummary.trim()) {
            errors.summary = 'Summary is required';
        }

        // Validate and parse skills
        let skillsObj;
        if (!manualSkills.trim()) {
            errors.skills = 'Skills JSON is required';
        } else {
            try {
                skillsObj = JSON.parse(manualSkills);
                if (typeof skillsObj !== 'object' || Array.isArray(skillsObj)) {
                    errors.skills = 'Skills must be a JSON object, not an array';
                }
            } catch (err) {
                errors.skills = `Invalid JSON: ${err.message}`;
            }
        }

        // Validate and parse experience
        let experienceArray;
        if (!manualExperience.trim()) {
            errors.experience = 'Experience JSON is required';
        } else {
            try {
                experienceArray = JSON.parse(manualExperience);
                if (!Array.isArray(experienceArray)) {
                    errors.experience = 'Experience must be a JSON array';
                }
            } catch (err) {
                errors.experience = `Invalid JSON: ${err.message}`;
            }
        }

        // If there are validation errors, show them and stop
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError('Please fix the validation errors above');
            return;
        }

        try {
            setGenerating(true);
            setGeneratingMessage('Combining sections and generating DOCX...');

            // Call service to combine and generate
            const result = await claudeService.generateTailoredResume(
                masterResume,
                jobDescription,
                manualSummary,
                skillsObj,
                experienceArray
            );

            setGeneratedResume(result);
            setGeneratingMessage('');

            // Calculate page estimation
            const analysis = estimateResumePages(result.resume);
            setPageAnalysis(analysis);

        } catch (err) {
            console.error('Generation error:', err);
            setError('Failed to generate resume. Please check your inputs and try again.');
        } finally {
            setGenerating(false);
            setGeneratingMessage('');
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Generate Tailored Resume
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Manual Input */}
                <div>
                    {/* Step 1: Job Description */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Step 1: Paste Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here (for ATS analysis)..."
                            className="w-full h-64 border rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                            💡 The app will use this to calculate ATS score and extract keywords. You'll also paste this in your Claude chat.
                        </p>
                    </div>

                    {/* Step 2: Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">📋 Step 2: Generate Sections in Claude</h3>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Copy the job description from above</li>
                            <li>Open your <strong>pinned Claude chat</strong> in another tab</li>
                            <li>Paste the JD in Claude and ask: "Generate summary, skills, and experience"</li>
                            <li>Copy each section from Claude</li>
                            <li>Paste them in Step 3 below</li>
                            <li>Click "Generate Resume"</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-3">
                            💡 Tip: Use **double asterisks** in Claude for bold formatting (e.g., **Python**)
                        </p>
                    </div>

                    {/* Step 3: Manual Input Form */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Step 3: Paste Sections from Claude</h2>

                        {/* Summary Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                1. Summary (3-4 sentences)
                            </label>
                            <textarea
                                value={manualSummary}
                                onChange={(e) => {
                                    setManualSummary(e.target.value);
                                    setValidationErrors({ ...validationErrors, summary: null });
                                }}
                                placeholder="Paste summary with **bold** markers for key terms..."
                                className={`w-full h-24 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${validationErrors.summary ? 'border-red-500' : ''
                                    }`}
                            />
                            {validationErrors.summary && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.summary}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Example: AI/ML Engineer with **2+ years** experience...
                            </p>
                        </div>

                        {/* Skills Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                2. Skills (JSON format)
                            </label>
                            <textarea
                                value={manualSkills}
                                onChange={(e) => {
                                    setManualSkills(e.target.value);
                                    setValidationErrors({ ...validationErrors, skills: null });
                                }}
                                placeholder='Paste skills JSON from Claude...'
                                className={`w-full h-32 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono ${validationErrors.skills ? 'border-red-500' : ''
                                    }`}
                            />
                            {validationErrors.skills && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.skills}</p>
                            )}
                            <button
                                onClick={() => validateJSON(manualSkills, 'skills')}
                                className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                            >
                                ✓ Validate JSON
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                                Format: {`{"LLM & GenAI": ["skill1"], "Programming & ML": ["skill2"]}`}
                            </p>
                        </div>

                        {/* Experience Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                3. Experience (JSON array with **bold** markers)
                            </label>
                            <textarea
                                value={manualExperience}
                                onChange={(e) => {
                                    setManualExperience(e.target.value);
                                    setValidationErrors({ ...validationErrors, experience: null });
                                }}
                                placeholder='Paste experience JSON from Claude...'
                                className={`w-full h-48 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono ${validationErrors.experience ? 'border-red-500' : ''
                                    }`}
                            />
                            {validationErrors.experience && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.experience}</p>
                            )}
                            <button
                                onClick={() => validateJSON(manualExperience, 'experience')}
                                className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                            >
                                ✓ Validate JSON
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                                Include **bold** markers in achievements: "Built models using **Python**"
                            </p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                    >
                        {generating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>{generatingMessage}</span>
                            </span>
                        ) : (
                            'Generate Resume with ATS Analysis'
                        )}
                    </button>
                    {!generatedResume && !generating && (
                        <p className="text-center text-gray-500 mt-4 text-sm">
                            Paste your sections above to create your resume.
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

                                <p className="text-sm text-gray-600">
                                    {generatedResume.atsScore >= 90 && '🎯 Excellent! Highly optimized.'}
                                    {generatedResume.atsScore >= 85 && generatedResume.atsScore < 90 && '✨ Great! Strong ATS compatibility.'}
                                    {generatedResume.atsScore >= 75 && generatedResume.atsScore < 85 && '👍 Good match.'}
                                    {generatedResume.atsScore < 75 && '⚠️ Consider adding more keywords.'}
                                </p>
                            </div>

                            {/* Matched Keywords */}
                            {generatedResume.matchedKeywords && generatedResume.matchedKeywords.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">
                                        ✓ Matched Keywords ({generatedResume.matchedKeywords.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {generatedResume.matchedKeywords.slice(0, 15).map((keyword, i) => (
                                            <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {generatedResume.missingKeywords && generatedResume.missingKeywords.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-orange-700 mb-2">
                                        ⚠ Missing Keywords ({generatedResume.missingKeywords.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {generatedResume.missingKeywords.slice(0, 10).map((keyword, i) => (
                                            <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                                        <p className="text-orange-800 font-medium mb-1">💡 Suggestion:</p>
                                        <p className="text-orange-700 text-xs">
                                            Go back to your Claude chat and ask: "Add these keywords naturally: {generatedResume.missingKeywords.slice(0, 5).join(', ')}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Page Estimation Card */}
                            {pageAnalysis && (
                                <div className={`mb-6 p-4 rounded-lg border ${pageAnalysis.isOverTwoPages ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                    <h4 className={`font-bold flex items-center gap-2 ${pageAnalysis.isOverTwoPages ? 'text-yellow-800' : 'text-green-800'}`}>
                                        <span>{pageAnalysis.isOverTwoPages ? '⚠️' : '✅'}</span>
                                        <span>Length Estimate: {pageAnalysis.estimatedPages} Pages</span>
                                    </h4>
                                    <p className={`text-sm mt-1 ${pageAnalysis.isOverTwoPages ? 'text-yellow-700' : 'text-green-700'}`}>
                                        {pageAnalysis.recommendation}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        *Based on Times New Roman 11pt, 0.5" margins
                                    </p>
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
                                                {Object.entries(generatedResume.resume.skills || {}).slice(0, 3).map(([cat, skills]) => (
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
                                                    {(generatedResume.resume.experience[0].achievements || []).slice(0, 3).map((ach, i) => (
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

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    📥 Download Resume
                                </button>
                                <button
                                    onClick={() => {
                                        setGeneratedResume(null);
                                        setPageAnalysis(null);
                                    }}
                                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                >
                                    🔄 Reset
                                </button>
                            </div>
                        </div>
                    ) : (
                        !generating && (
                            <div className="bg-gray-50 rounded-lg p-12 text-center h-full flex flex-col items-center justify-center">
                                <div className="text-6xl mb-4">📄</div>
                                <p className="text-gray-600">
                                    Your combined resume will appear here for preview and download.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div >
    );
}

export default ResumeGenerator;