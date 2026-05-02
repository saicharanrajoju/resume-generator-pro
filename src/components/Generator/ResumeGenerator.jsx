import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { claudeService } from '../../services/claudeService';
import docxService from '../../services/docxService';
import { generateResumePdf } from '../../services/resumePdfService';
import { useAuth } from '../../hooks/useAuth';
import { estimateResumePages } from '../../utils/resumePageEstimator';

function ResumeGenerator({ masterResume }) {
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');

    // Import State
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');
    const [imported, setImported] = useState(false);
    const [parsedData, setParsedData] = useState(null);

    // Generation State
    const [generatedResume, setGeneratedResume] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generatingMessage, setGeneratingMessage] = useState('');
    const [error, setError] = useState(null);

    // UI State
    const [showPreview, setShowPreview] = useState(true);
    const [pageAnalysis, setPageAnalysis] = useState(null);

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

    // Import JSON handler
    const handleImport = () => {
        setImportError('');
        setError(null);

        if (!importJson.trim()) {
            setImportError('Paste your JSON from Claude first');
            return;
        }

        try {
            // Try to extract JSON from markdown code block if present
            let jsonStr = importJson.trim();
            const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
            }

            const parsed = JSON.parse(jsonStr);

            // Validate required fields
            const missing = [];
            if (!parsed.professionalSummary) missing.push('professionalSummary');
            if (!parsed.skills) missing.push('skills');
            if (!parsed.workExperience) missing.push('workExperience');
            if (!parsed.projects) missing.push('projects');

            if (missing.length > 0) {
                setImportError(`Missing required fields: ${missing.join(', ')}`);
                return;
            }

            if (typeof parsed.skills !== 'object' || Array.isArray(parsed.skills)) {
                setImportError('skills must be a JSON object, not an array');
                return;
            }
            if (!Array.isArray(parsed.workExperience)) {
                setImportError('workExperience must be an array');
                return;
            }
            if (!Array.isArray(parsed.projects)) {
                setImportError('projects must be an array');
                return;
            }

            setParsedData(parsed);
            setImported(true);
        } catch (err) {
            setImportError(`Invalid JSON: ${err.message}`);
        }
    };

    const handleGenerate = async () => {
        setError(null);

        if (!parsedData) {
            setError('Import your JSON first');
            return;
        }

        try {
            setGenerating(true);
            setGeneratingMessage('Combining sections and generating DOCX...');

            const result = await claudeService.generateTailoredResume(
                masterResume,
                jobDescription,
                parsedData.professionalSummary,
                parsedData.skills,
                parsedData.workExperience,
                parsedData.projects
            );

            setGeneratedResume(result);
            setGeneratingMessage('');

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

    const handleDownloadDocx = async () => {
        if (!generatedResume) return;

        try {
            const fileNameBase = parsedData?.resumeMeta?.fileName || 'Rajoju_Sai_Charan_Resume';
            const resumeData = { ...generatedResume.resume, contactLocation: parsedData?.contactLocation };
            await docxService.generateResume(
                resumeData,
                masterResume.parsedData,
                fileNameBase
            );
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download resume DOCX');
        }
    };

    const handleDownloadPdf = async () => {
        if (!generatedResume) return;

        try {
            const stored = masterResume?.parsedData?.personalInfo || {};
            const onlinePresence = masterResume?.parsedData?.onlinePresence || {};
            const api = generatedResume.resume.personalInfo || {};
            const firstName = stored.firstName || '';
            const lastName = stored.lastName || '';
            const personalInfo = {
                name: stored.name
                    || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName)
                    || api.name,
                location: stored.location || api.location,
                phone: stored.phone || api.phone,
                email: stored.email || api.email,
                linkedin: stored.linkedin || onlinePresence.linkedin || api.linkedin,
                github: stored.github || onlinePresence.github || api.github,
                website: stored.website || onlinePresence.website || api.website,
            };
            const fileNameBase = parsedData?.resumeMeta?.fileName || 'Rajoju_Sai_Charan_Resume';
            const resumeData = { ...generatedResume.resume, personalInfo, contactLocation: parsedData?.contactLocation };
            await generateResumePdf(resumeData, fileNameBase);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download resume PDF');
        }
    };

    const handleReset = () => {
        setImportJson('');
        setImportError('');
        setImported(false);
        setParsedData(null);
        setGeneratedResume(null);
        setPageAnalysis(null);
        setError(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Generate Tailored Resume
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Import & Generate */}
                <div>
                    {/* Import from Claude */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-2">Import from Claude</h2>
                        <p className="text-sm text-gray-500 mb-3">
                            Paste the entire JSON block from Claude to import all sections at once.
                        </p>
                        <textarea
                            value={importJson}
                            onChange={(e) => {
                                setImportJson(e.target.value);
                                setImportError('');
                                if (imported) {
                                    setImported(false);
                                    setParsedData(null);
                                }
                            }}
                            placeholder='Paste your full JSON from Claude here...'
                            className={`w-full h-48 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono ${importError ? 'border-red-500' : imported ? 'border-green-500' : ''}`}
                        />
                        {importError && (
                            <p className="text-red-500 text-xs mt-1">{importError}</p>
                        )}
                        {imported && (
                            <p className="text-green-600 text-xs mt-1">
                                Imported: {parsedData.workExperience.length} experiences, {parsedData.projects.length} projects, {Object.keys(parsedData.skills).length} skill categories
                            </p>
                        )}
                        <button
                            onClick={handleImport}
                            disabled={imported}
                            className={`mt-3 w-full text-white px-6 py-3 rounded-lg font-medium transition-colors ${imported ? 'bg-green-600 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {imported ? 'Imported' : 'Import JSON'}
                        </button>
                    </div>

                    {/* Job Description (optional, for ATS scoring) */}
                    {imported && (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Description <span className="text-gray-400 font-normal">(optional, for ATS scoring)</span>
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here for ATS keyword analysis..."
                                className="w-full h-32 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            />
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    {imported && (
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
                                'Generate Resume'
                            )}
                        </button>
                    )}
                </div>

                {/* Right Column - Output */}
                <div>
                    {generatedResume ? (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            {/* ATS Score */}
                            <div className="mb-6">
                                {generatedResume.keywordAnalysis?.totalJDKeywords > 0 ? (
                                    <>
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
                                            {generatedResume.atsScore >= 90 && 'Excellent! Highly optimized.'}
                                            {generatedResume.atsScore >= 85 && generatedResume.atsScore < 90 && 'Great! Strong ATS compatibility.'}
                                            {generatedResume.atsScore >= 75 && generatedResume.atsScore < 85 && 'Good match.'}
                                            {generatedResume.atsScore < 75 && 'Consider adding more keywords.'}
                                        </p>
                                    </>
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                        <p className="text-gray-600">No job description provided for ATS analysis.</p>
                                    </div>
                                )}
                            </div>

                            {/* Matched Keywords */}
                            {generatedResume.matchedKeywords && generatedResume.matchedKeywords.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-green-700 mb-2">
                                        Matched Keywords ({generatedResume.matchedKeywords.length})
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
                                        Missing Keywords ({generatedResume.missingKeywords.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {generatedResume.missingKeywords.slice(0, 10).map((keyword, i) => (
                                            <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                                        <p className="text-orange-800 font-medium mb-1">Suggestion:</p>
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

                                        {/* First Project */}
                                        {generatedResume.resume.projects?.[0] && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-700 mb-1 uppercase">First Project</p>
                                                <p className="text-sm font-semibold">{generatedResume.resume.projects[0].name}</p>
                                                <ul className="list-disc list-inside text-xs text-gray-700 mt-2 space-y-1">
                                                    {(generatedResume.resume.projects[0].bullets || []).slice(0, 2).map((bullet, i) => (
                                                        <li key={i}>{bullet}</li>
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
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    onClick={handleDownloadDocx}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Download DOCX
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Download PDF
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                                >
                                    Reset
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
        </div>
    );
}

export default ResumeGenerator;
