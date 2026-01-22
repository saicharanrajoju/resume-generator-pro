import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Briefcase, Award, TrendingUp, Layers, Star, MessageSquare, Send } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import {
    saveMasterResumeRawText,
    loadMasterResume,
    updateProcessingStatus,
    saveProcessedResume
} from '../../services/masterResumeService';

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

    // Resume DNA State
    const [showUnderstanding, setShowUnderstanding] = useState(false);
    const [resumeData, setResumeData] = useState(null);

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Check for existing resume on load
    useEffect(() => {
        const checkExistingResume = async () => {
            if (user?.uid) {
                const result = await loadMasterResume(user.uid);
                if (result.success && result.data?.rawText) {
                    setHasExistingResume(true);
                    setResumeText(result.data.rawText);

                    // Check if we have processed data
                    if (result.data.meta?.processingStatus === 'complete' &&
                        result.data.understanding &&
                        result.data.structured) {
                        setResumeData({
                            understanding: result.data.understanding,
                            structured: result.data.structured
                        });
                        setShowUnderstanding(true);
                        setSuccess(true);
                    }
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

                // Trigger AI processing
                try {
                    setLoadingMessage('Understanding your background with AI...');
                    await updateProcessingStatus(user.uid, 'processing');

                    // Call Claude API to process
                    console.log('Calling process-resume API...');
                    const processResponse = await fetch('/api/process-resume', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resumeText: text })
                    });

                    if (!processResponse.ok) {
                        const err = await processResponse.json();
                        throw new Error(err.error || 'Processing failed');
                    }

                    const { understanding, structured } = await processResponse.json();

                    // Save processed data
                    console.log('Saving processed data...');
                    await saveProcessedResume(user.uid, understanding, structured);

                    console.log('✅ AI Processing complete');
                    setResumeData({ understanding, structured });
                    setShowUnderstanding(true);
                    setResumeText(text);
                    setSuccess(true);
                    setHasExistingResume(true);
                } catch (procError) {
                    console.error('AI Processing error:', procError);
                    await updateProcessingStatus(user.uid, 'error');
                    // Still show success for upload, but warn about AI
                    setResumeText(text);
                    setSuccess(true);
                    setHasExistingResume(true);
                    setError('Resume saved, but AI analysis failed. Please try again later.');
                }
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
        setShowUnderstanding(false);
        // If we have an existing resume, reset to that state instead of completely blank
        if (hasExistingResume && !showUnderstanding) {
            // Already showing existing, do nothing or maybe reset view
            setSuccess(false);
        } else {
            setResumeText('');
            setSuccess(false);
            setHasExistingResume(false);
        }
        setError('');
        setPastedText('');
    };

    const handleGenerateResume = () => {
        navigate('/generate-resume');
    };

    // Chat Handler
    const handleChatSubmit = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMessage = chatInput.trim();

        // Add user message to chat
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);

        try {
            // Call API to process the update request
            const response = await fetch('/api/update-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    message: userMessage,
                    currentResume: resumeData
                })
            });

            if (!response.ok) {
                throw new Error('Update failed');
            }

            const data = await response.json();

            // Add assistant response to chat
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);

            // Update the displayed resume data if changes were made
            if (data.updatedResume) {
                setResumeData(data.updatedResume);
                // Optionally save back to Firebase or update local context if needed, 
                // but the API usually handles saving to Firebase.
            }

        } catch (error) {
            console.error('Chat error:', error);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Handle viewing analysis for existing resume
    const handleViewAnalysis = async () => {
        try {
            console.log('View Analysis clicked');
            setLoading(true);
            setLoadingMessage('Loading AI analysis...');
            setError('');

            // Load the full resume data from Firebase
            const result = await loadMasterResume(user.uid);
            console.log('Loaded data:', result);

            if (result.success && result.data) {
                const { understanding, structured, meta } = result.data;
                console.log('Understanding:', understanding);
                console.log('Structured:', structured);

                // Check if AI processing was completed
                if (!understanding || !structured) {
                    console.log('No understanding found, showing raw text preview');
                    setSuccess(true); // Fallback to simple preview
                    setLoading(false);
                    return;
                }

                // Set the data to display
                setResumeData({ understanding, structured });
                setShowUnderstanding(true);
                // setHasExistingResume(false); // Can keep this true if we want to show 'back' button logic differently, but request says hide existing resume card logic
                // The current UI logic shows dashboard if showUnderstanding is true, so checks below handle visibility
                setLoading(false);

            } else {
                setError('Could not load resume data');
                setLoading(false);
            }

        } catch (error) {
            console.error('Error loading analysis:', error);
            setError('Failed to load AI analysis');
            setLoading(false);
        }
    };

    // Show existing resume UI if user has one and is not in success (post-upload) state
    const showExistingUI = hasExistingResume && !success && !loading && !showUnderstanding;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">

            {showUnderstanding && resumeData ? (
                // ==========================
                // RESUME DNA DASHBOARD (AI Insights)
                // ==========================
                <div className="max-w-4xl w-full my-8">
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Resume DNA Analysis Complete!</h2>
                            <p className="text-blue-100 max-w-xl mx-auto">
                                I've processed your resume and created a comprehensive understanding of your professional profile.
                            </p>
                        </div>

                        <div className="p-8 space-y-8">

                            {/* Profile Section */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Professional Profile</h3>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {resumeData.understanding.profile}
                                </p>
                            </div>

                            {/* Core Strengths & Value Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Strengths */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Core Strengths</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {resumeData.understanding.coreStrengths.map((strength, idx) => (
                                            <li key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                                                <span className="text-gray-700 text-sm font-medium">{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Unique Value */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Star className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Unique Value Proposition</h3>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex-grow flex items-center">
                                        <p className="text-purple-900 font-medium italic text-center w-full">
                                            "{resumeData.understanding.uniqueValue}"
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                <Award className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Career Trajectory</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm border-t pt-3">
                                            {resumeData.understanding.trajectory}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Depth */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Layers className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Technical Depth</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(resumeData.understanding.technicalDepth).map(([skill, level]) => (
                                        <div key={skill} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                                            <strong className="block text-gray-800 mb-1">{skill}</strong>
                                            <span className="text-sm text-gray-600">{level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <span className="block text-3xl font-bold text-blue-600 mb-1">
                                        {resumeData.structured.experience?.length || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Years Exp</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <span className="block text-3xl font-bold text-blue-600 mb-1">
                                        {resumeData.structured.projects?.length || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <span className="block text-3xl font-bold text-blue-600 mb-1">
                                        {resumeData.structured.education?.length || 0}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Degrees</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <span className="block text-3xl font-bold text-blue-600 mb-1">
                                        {Object.keys(resumeData.structured.skills || {}).reduce((acc, cat) => acc + resumeData.structured.skills[cat].length, 0)}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</span>
                                </div>
                            </div>

                            {/* Chat Section */}
                            <div className="border-t-2 border-slate-100 pt-8 mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Update Your Resume</h3>
                                        <p className="text-gray-500 text-sm">Chat with me to make changes</p>
                                    </div>
                                </div>

                                {/* Suggested Prompts */}
                                {chatHistory.length === 0 && (
                                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-gray-600 mb-2 font-medium">Try asking:</p>
                                        <ul className="space-y-2">
                                            {["Add Spanish language to my skills", "Remove my trainee experience", "Update my summary to emphasize leadership"].map((prompt, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-blue-600 bg-white px-3 py-2 rounded border border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors inline-block mr-2 mb-2"
                                                    onClick={() => setChatInput(prompt)}
                                                >
                                                    "{prompt}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Chat Messages */}
                                <div className="bg-slate-50 rounded-xl p-4 mb-4 max-h-[400px] overflow-y-auto border border-slate-200">
                                    {chatHistory.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 italic">
                                            No messages yet. Start chatting to update your resume!
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {chatHistory.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-xl p-3 ${msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-white border border-slate-200 text-gray-800 rounded-bl-none shadow-sm'
                                                        }`}>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {chatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none p-3 shadow-sm">
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="flex gap-2">
                                    <textarea
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Tell me what to change..."
                                        className="flex-1 border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none resize-none h-[60px] text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleChatSubmit();
                                            }
                                        }}
                                        disabled={chatLoading}
                                    />
                                    <button
                                        onClick={handleChatSubmit}
                                        disabled={!chatInput.trim() || chatLoading}
                                        className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    onClick={handleGenerateResume}
                                    className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Briefcase className="w-5 h-5" />
                                    Generate Tailored Resume
                                </button>
                                <button
                                    onClick={() => setShowUnderstanding(false)}
                                    className="flex-1 bg-white text-gray-600 border-2 border-gray-200 px-8 py-4 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold text-lg"
                                >
                                    Upload New Resume
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                // ==========================
                // UPLOAD / PREVIEW CARD
                // ==========================
                <div className="bg-white rounded-xl shadow-lg p-10 max-w-2xl w-full">
                    {showExistingUI ? (
                        // EXISTING RESUME FOUND
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
                                You already have a master resume on file. You can view the AI analysis or upload a new one.
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
                                    onClick={handleViewAnalysis}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-5 h-5" />
                                    View AI Analysis
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
                        // UPLOAD FORM
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
                        // SIMPLE SUCCESS / PROCESSING UI (Before AI finishes)
                        <>
                            {/* Success State */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-800 text-center mb-3">
                                ✅ Resume Uploaded!
                            </h1>

                            <p className="text-gray-600 text-center mb-6">
                                {loadingMessage || "Processing with AI..."}
                            </p>

                            {/* Loading State in Success View */}
                            {loading && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        <p className="text-sm text-blue-800">{loadingMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <p className="text-xs text-gray-500 mb-2 font-semibold">PREVIEW (First 200 characters):</p>
                                <p className="text-sm text-gray-700 font-mono">
                                    {resumeText.length > 200 ? resumeText.substring(0, 200) + '...' : resumeText}
                                </p>
                            </div>

                            {/* Start Over Button */}
                            {!loading && (
                                <button
                                    onClick={handleStartOver}
                                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    ← {hasExistingResume ? "Back to Resume" : "Start Over"}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

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