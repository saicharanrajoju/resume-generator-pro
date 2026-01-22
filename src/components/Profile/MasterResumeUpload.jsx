import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';

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

            setResumeText(extractedText);
            setSuccess(true);
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

    // Read PDF file using backend API
    const readPdfFile = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // Get base64 string (remove data:application/pdf;base64, prefix)
                    const base64 = e.target.result.split(',')[1];

                    // Call backend API to extract text
                    const response = await fetch('/api/extract-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileBuffer: base64 })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'PDF extraction failed');
                    }

                    const { text } = await response.json();

                    if (!text || text.trim().length < 50) {
                        throw new Error('Could not extract enough text from PDF');
                    }

                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsDataURL(file);
        });
    };

    // Trigger hidden file input
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Handle paste text submission
    const handlePasteSubmit = () => {
        if (!pastedText.trim()) {
            setError('Please paste your resume text');
            return;
        }

        setLoading(true);
        setLoadingMessage('Processing your resume...');
        setError('');

        // Simulate processing delay
        setTimeout(() => {
            setResumeText(pastedText);
            setSuccess(true);
            setShowPasteModal(false);
            setPastedText('');
            setLoading(false);
            setLoadingMessage('');
        }, 500);
    };

    // Reset and start over
    const handleStartOver = () => {
        setSelectedFile(null);
        setResumeText('');
        setSuccess(false);
        setError('');
        setPastedText('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-10 max-w-2xl w-full">
                {!success ? (
                    <>
                        {/* Icon */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                            Upload Your Master Resume
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
                    <>
                        {/* Success State */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                            ✅ Resume Loaded!
                        </h1>

                        <p className="text-gray-600 text-center mb-6">
                            Processing your resume...
                        </p>

                        {/* Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">PREVIEW (First 200 characters):</p>
                            <p className="text-sm text-gray-700 font-mono">
                                {resumeText.substring(0, 200)}...
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
                            ← Start Over
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