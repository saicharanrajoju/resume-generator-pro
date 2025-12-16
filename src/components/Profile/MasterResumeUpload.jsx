import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { masterResumeService } from '../../services/masterResumeService';
import resumeParserService from '../../services/resumeParserService';

function MasterResumeUpload({ onComplete, existingResume = null }) {
    const { user } = useAuth();
    const [uploadMethod, setUploadMethod] = useState('file');
    const [resumeText, setResumeText] = useState('');
    const [parsing, setParsing] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        if (!validTypes.includes(file.type)) {
            alert('Please upload a DOCX file');
            return;
        }

        setParsing(true);

        try {
            // Parse file with AI
            const parsedData = await resumeParserService.parseResumeFile(file);

            // Get raw text (we'll need to extract this from the file)
            const rawText = await extractTextFromFile(file);

            // Save to Firebase
            await masterResumeService.saveMasterResume(user.uid, {
                rawText,
                parsedData,
                fileType: 'docx'
            });

            alert('Master resume uploaded successfully! ✅');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to parse resume. Please try again.');
        } finally {
            setParsing(false);
        }
    };

    const handleTextPaste = async () => {
        if (!resumeText.trim()) {
            alert('Please paste your resume text');
            return;
        }

        if (resumeText.trim().length < 100) {
            alert('Please paste more content. The text seems too short.');
            return;
        }

        setParsing(true);

        try {
            // Parse text with AI
            const parsedData = await resumeParserService.parseResumeText(resumeText);

            // Save to Firebase
            await masterResumeService.saveMasterResume(user.uid, {
                rawText: resumeText,
                parsedData,
                fileType: 'text'
            });

            alert('Master resume uploaded successfully! ✅');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Parse error:', error);
            alert('Failed to parse resume. Please try again.');
        } finally {
            setParsing(false);
        }
    };

    const extractTextFromFile = async (file) => {
        // For now, return a placeholder
        // In production, we'd extract actual text from DOCX
        return `[Content from ${file.name}]`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        {existingResume ? 'Update Master Resume' : 'Upload Master Resume'}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        {existingResume
                            ? 'Upload a new version of your master resume to replace the existing one.'
                            : 'Upload your complete resume once. We\'ll use it to generate tailored resumes for each job.'}
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200">
                        <button
                            type="button"
                            onClick={() => setUploadMethod('file')}
                            className={`px-6 py-3 font-medium transition-colors ${uploadMethod === 'file'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📄 Upload DOCX
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMethod('text')}
                            className={`px-6 py-3 font-medium transition-colors ${uploadMethod === 'text'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📋 Paste Text
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                        {parsing ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 font-medium">Analyzing your resume with AI...</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    This may take 10-20 seconds. We're understanding every detail.
                                </p>
                            </div>
                        ) : uploadMethod === 'file' ? (
                            <>
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📄</div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        Upload Your Master Resume
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Upload your complete resume. AI will understand everything and use it to create tailored versions.
                                    </p>
                                    <input
                                        type="file"
                                        accept=".doc,.docx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                                    >
                                        Choose DOCX File
                                    </label>
                                    <p className="text-sm text-gray-500 mt-4">
                                        Supported format: DOCX (Microsoft Word)
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="text-6xl mb-4">📋</div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        Paste Your Resume Text
                                    </h3>
                                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                                        Open your resume → Select All (Ctrl/Cmd+A) → Copy → Paste below
                                    </p>
                                </div>

                                <textarea
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    placeholder="Paste your complete resume here...

Example: Include everything - your experience, skills, education, projects, certifications, etc.

The AI will understand your entire resume and use it to generate perfectly tailored versions for each job you apply to."
                                    className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4 font-mono text-sm"
                                />

                                <button
                                    onClick={handleTextPaste}
                                    disabled={!resumeText.trim()}
                                    className="block mx-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ✨ Upload Master Resume
                                </button>

                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    Works with text from PDF, Word, or any format
                                </p>
                            </>
                        )}
                    </div>

                    {existingResume && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Current master resume:</strong> Uploaded on {new Date(existingResume.uploadDate).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MasterResumeUpload;