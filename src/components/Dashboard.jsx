import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { masterResumeService } from '../services/masterResumeService';
import MasterResumeUpload from './Profile/MasterResumeUpload';
import ResumeGenerator from './Generator/ResumeGenerator';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [masterResume, setMasterResume] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMasterResume();
    }, [user]);

    const loadMasterResume = async () => {
        try {
            const resume = await masterResumeService.getMasterResume(user.uid);
            setMasterResume(resume);
        } catch (error) {
            console.error('Error loading master resume:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-xl font-bold text-blue-600 hover:text-blue-700"
                            >
                                Resume Generator Pro
                            </button>

                            {masterResume && (
                                <div className="hidden md:flex gap-4">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Home
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/generate')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Generate Resume
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/update-resume')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Update Master Resume
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 text-sm">
                                {user.displayName || user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <Routes>
                <Route
                    index
                    element={
                        <DashboardHome
                            masterResume={masterResume}
                            navigate={navigate}
                        />
                    }
                />
                <Route
                    path="upload-resume"
                    element={
                        <MasterResumeUpload
                            onComplete={() => {
                                loadMasterResume();
                                navigate('/dashboard');
                            }}
                        />
                    }
                />
                <Route
                    path="update-resume"
                    element={
                        <MasterResumeUpload
                            existingResume={masterResume}
                            onComplete={() => {
                                loadMasterResume();
                                navigate('/dashboard');
                            }}
                        />
                    }
                />
                <Route
                    path="generate"
                    element={
                        masterResume ? (
                            <ResumeGenerator masterResume={masterResume} />
                        ) : (
                            <Navigate to="/dashboard/upload-resume" replace />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    );
}

// Dashboard Home Component
function DashboardHome({ masterResume, navigate }) {
    if (!masterResume) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="text-6xl mb-6">📄</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Welcome to Resume Generator Pro!
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Upload your master resume once, and we'll use AI to generate perfectly tailored resumes for every job you apply to. No more manual editing!
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 text-left max-w-2xl mx-auto">
                        <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
                        <ol className="space-y-2 text-gray-700 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600">1.</span>
                                <span>Upload your complete master resume (one time)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600">2.</span>
                                <span>Paste any job description</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600">3.</span>
                                <span>AI generates a tailored, ATS-optimized resume instantly</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-bold text-blue-600">4.</span>
                                <span>Download as professional DOCX and apply!</span>
                            </li>
                        </ol>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/upload-resume')}
                        className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                    >
                        Upload Master Resume
                    </button>
                </div>
            </div>
        );
    }

    // Extract basic info from parsed data
    const parsedData = masterResume.parsedData || {};
    const personalInfo = parsedData.personalInfo || {};
    const workExperience = parsedData.workExperience || [];
    const projects = parsedData.projects || [];
    const certifications = parsedData.certifications || [];
    const uploadDate = new Date(masterResume.uploadDate).toLocaleDateString();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Master Resume Status Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Welcome back, {personalInfo.firstName || 'there'}!
                        </h2>
                        <div className="space-y-2 text-blue-100">
                            <p className="flex items-center gap-2">
                                <span className="text-2xl">✓</span>
                                <span className="text-lg">Master Resume Active</span>
                            </p>
                            <p className="text-sm">Uploaded on {uploadDate}</p>
                            {personalInfo.email && <p className="text-sm">📧 {personalInfo.email}</p>}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/update-resume')}
                        className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                    >
                        Update Resume
                    </button>
                </div>
            </div>

            {/* Quick Action - Generate Resume */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl">🎯</div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">Generate Tailored Resume</h3>
                        <p className="text-gray-600">Paste a job description and get an optimized resume in seconds</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard/generate')}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                    Start Generating →
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">💼</div>
                        <div className="text-3xl font-bold text-blue-600">
                            {workExperience.length}
                        </div>
                    </div>
                    <div className="text-gray-600 font-medium">Work Experiences</div>
                    <div className="text-sm text-gray-500 mt-1">in your master resume</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">🚀</div>
                        <div className="text-3xl font-bold text-green-600">
                            {projects.length}
                        </div>
                    </div>
                    <div className="text-gray-600 font-medium">Projects</div>
                    <div className="text-sm text-gray-500 mt-1">ready to showcase</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">🏆</div>
                        <div className="text-3xl font-bold text-purple-600">
                            {certifications.length}
                        </div>
                    </div>
                    <div className="text-gray-600 font-medium">Certifications</div>
                    <div className="text-sm text-gray-500 mt-1">to highlight</div>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-4xl mb-3">📋</div>
                        <div className="font-semibold text-gray-800 mb-2">1. Paste Job Description</div>
                        <div className="text-sm text-gray-600">Copy the job posting you want to apply for</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3">🤖</div>
                        <div className="font-semibold text-gray-800 mb-2">2. AI Analyzes</div>
                        <div className="text-sm text-gray-600">Claude understands requirements and keywords</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3">✨</div>
                        <div className="font-semibold text-gray-800 mb-2">3. Resume Tailored</div>
                        <div className="text-sm text-gray-600">Your experience optimized for the role</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3">📥</div>
                        <div className="font-semibold text-gray-800 mb-2">4. Download & Apply</div>
                        <div className="text-sm text-gray-600">Professional DOCX ready to submit</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;