import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { saveMasterResumeRawText, loadMasterResume } from '../../services/masterResumeService';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function MasterResumeUpload({ existingResume, onComplete }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State management
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [hasExistingResume, setHasExistingResume] = useState(false);

    // Check for existing resume on load
    useEffect(() => {
        const checkExistingResume = async () => {
            if (user?.uid) {
                const result = await loadMasterResume(user.uid);
                if (result.success && result.data?.rawText) {
                    setHasExistingResume(true);
                    setResumeText(result.data.rawText);
                    // Don't auto-show success needed for initial view, 
                    // just set state so we can show "View Current" UI
                }
            }
        };

        checkExistingResume();
    }, [user]);

    // Helper to save resume text
    const saveResumeToFirebase = async (text) => {
        try {
            console.log('Attempting to save resume...');
            console.log('User ID:', user?.uid);
            console.log('Resume text length:', text?.length);

            if (!user?.uid) {
                console.error('No user ID available for save');
                setError('No user ID available. Please ensure you are logged in.');
                return;
            }

            if (!text || text.trim().length === 0) {
                console.error('No resume text to save');
                throw new Error('No resume text to save');
            }

            setLoadingMessage('Saving to your account...');
            const result = await saveMasterResumeRawText(user.uid, text);

            console.log('Firebase save result:', result);

            if (result.success) {
                console.log('✅ Resume saved to Firebase');
                setResumeText(text);
                setSuccess(true);
                setHasExistingResume(true);
            } else {
                console.error('Failed to save resume:', result.error);
                setError(`Could not save resume: ${result.error}`);
            }
        } catch (error) {
            console.error('Firebase save error (catch block):', error);
            setError(`Save error: ${error.message}`);
        }
    };

    // Handle file selection and reading
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setError('');
        setLoading(true);
        setLoadingMessage('Reading your resume...');

        try {
            let extractedText = '';

            // Read based on file type
            if (file.name.endsWith('.txt')) {
                // Read TXT file
                extractedText = await readTextFile(file);
            } else if (file.name.endsWith('.docx')) {
                // Read DOCX file using mammoth
                extractedText = await readDocxFile(file);
            } else if (file.name.endsWith('.pdf')) {
                // Read PDF file
                extractedText = await readPdfFile(file);
            } else {
                throw new Error('Unsupported file format. Please use .txt, .docx, or .pdf');
            }

            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Could not extract enough text from file. Please try a different format or paste text.');
            }

            // Save to Firebase instead of just setting state locally
            await saveResumeToFirebase(extractedText);
            setLoadingMessage('');

        } catch (err) {
            console.error('File reading error:', err);
            setError(err.message || 'Could not read file. Please try a different format or paste text.');
            setSelectedFile(null);
        } finally {
            setLoading(false);
        }
    };

    // Read plain text file
    const readTextFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    };

    // Read DOCX file using mammoth
    const readDocxFile = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    // Read PDF file client-side using pdf.js
    const readPdfFile = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdf = await loadingTask.promise;

            let fullText = '';

            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return fullText.trim();
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error('Failed to extract text from PDF. Please try pasting text instead.');
        }
    };

    // Trigger hidden file input
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Handle paste text submission
    const handlePasteSubmit = async () => {
        if (!pastedText.trim()) {
            setError('Please paste your resume text');
            return;
        }

        setLoading(true);
        setLoadingMessage('Processing your resume...');
        setError('');

        // Process text directly
        try {
            await saveResumeToFirebase(pastedText);
            setShowPasteModal(false);
            setPastedText('');
            setLoadingMessage('');
        } catch (err) {
            setError('Failed to process text. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset and start over
    const handleStartOver = () => {
        setSelectedFile(null);
        // If we have an existing resume, reset to that state instead of completely blank
        if (hasExistingResume) {
            setSuccess(false); // Go back to "view existing" mode
        } else {
            setResumeText('');
            setSuccess(false);
        }
        setError('');
        setPastedText('');
    };

    // Show existing resume UI if user has one and is not in success (post-upload) state
    const showExistingUI = hasExistingResume && !success && !loading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-10 max-w-2xl w-full">
                {showExistingUI ? (
                    // EXISTING RESUME UI
                    <>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                            Master Resume Found
                        </h1>

                        <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
                            You already have a master resume on file. You can view it or upload a new one to replace it.
                        </p>

                        {/* Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">CURRENT RESUME PREVIEW:</p>
                            <p className="text-sm text-gray-700 font-mono">
                                {resumeText.length > 200 ? resumeText.substring(0, 200) + '...' : resumeText}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setSuccess(true)} // Show the success/preview view
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                View Full Resume
                            </button>

                            <p className="text-center text-gray-400 text-sm my-2">- OR -</p>

                            <button
                                onClick={() => setHasExistingResume(false)} // Reset to upload mode
                                className="w-full bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Upload New Resume
                            </button>
                        </div>
                    </>
                ) : !success ? (
                    // UPLOAD UI
                    <>
                        {/* Icon */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                            {hasExistingResume ? "Update Master Resume" : "Upload Your Master Resume"}
                        </h1>

                        {/* Subtext */}
                        <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
                            Upload your resume and I'll understand everything about your background.
                            Supports PDF, DOCX, TXT, or paste text directly.
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    <p className="text-sm text-blue-800">{loadingMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Upload Options */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            {/* Upload File Button */}
                            <button
                                onClick={triggerFileUpload}
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-5 h-5" />
                                Upload File
                            </button>

                            {/* Paste Text Button */}
                            <button
                                onClick={() => setShowPasteModal(true)}
                                disabled={loading}
                                className="flex-1 bg-white text-blue-600 border-2 border-blue-600 px-6 py-4 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                <FileText className="w-5 h-5" />
                                Paste Text
                            </button>
                        </div>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Selected File Display */}
                        {selectedFile && !success && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">Selected:</span> {selectedFile.name}
                                </p>
                            </div>
                        )}

                        {/* Back Button */}
                        <div className="text-center mt-6">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </>
                ) : (
                    // SUCCESS / PREVIEW UI
                    <>
                        {/* Success State */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                            ✅ Resume Uploaded & Saved!
                        </h1>

                        <p className="text-gray-600 text-center mb-6">
                            Processing with AI...
                        </p>

                        {/* Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">PREVIEW (First 200 characters):</p>
                            <p className="text-sm text-gray-700 font-mono">
                                {resumeText.length > 200 ? resumeText.substring(0, 200) + '...' : resumeText}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">Total characters:</span> {resumeText.length.toLocaleString()}
                            </p>
                        </div>

                        {/* Start Over Button */}
                        <button
                            onClick={handleStartOver}
                            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            ← {hasExistingResume ? "Back to Resume" : "Start Over"}
                        </button>
                    </>
                )}
            </div>

            {/* Paste Text Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Paste Your Resume
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Copy and paste your resume content below. I'll extract all the information.
                        </p>

                        {/* Error in Modal */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Textarea */}
                        <textarea
                            value={pastedText}
                            onChange={(e) => {
                                setPastedText(e.target.value);
                                setError('');
                            }}
                            placeholder="Paste your resume text here..."
                            className="w-full h-96 border-2 border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                        />

                        {/* Character Count */}
                        <p className="text-xs text-gray-500 mt-2">
                            {pastedText.length.toLocaleString()} characters
                        </p>

                        {/* Modal Actions */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handlePasteSubmit}
                                disabled={!pastedText.trim() || loading}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Process Resume'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPasteModal(false);
                                    setPastedText('');
                                    setError('');
                                }}
                                disabled={loading}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MasterResumeUpload;