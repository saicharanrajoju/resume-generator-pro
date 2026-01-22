import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';

function MasterResumeUpload({ existingResume, onComplete }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State management
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pastedText, setPastedText] = useState('');

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            console.log('File selected:', file.name);
            // TODO: Process file
        }
    };

    // Trigger hidden file input
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Handle paste text submission
    const handlePasteSubmit = () => {
        console.log('Pasted text:', pastedText);
        // TODO: Process pasted text
        setShowPasteModal(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-10 max-w-2xl w-full">
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
                    Supports PDF, DOCX, or paste text directly.
                </p>

                {/* Upload Options */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Upload File Button */}
                    <button
                        onClick={triggerFileUpload}
                        className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <Upload className="w-5 h-5" />
                        Upload File
                    </button>

                    {/* Paste Text Button */}
                    <button
                        onClick={() => setShowPasteModal(true)}
                        className="flex-1 bg-white text-blue-600 border-2 border-blue-600 px-6 py-4 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
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
                {selectedFile && (
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
            </div>

            {/* Paste Text Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Paste Your Resume Text
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Copy and paste your resume content below. I'll extract all the information.
                        </p>

                        {/* Textarea */}
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Paste your resume text here..."
                            className="w-full h-64 border-2 border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                        />

                        {/* Modal Actions */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handlePasteSubmit}
                                disabled={!pastedText.trim()}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Process Text
                            </button>
                            <button
                                onClick={() => {
                                    setShowPasteModal(false);
                                    setPastedText('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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