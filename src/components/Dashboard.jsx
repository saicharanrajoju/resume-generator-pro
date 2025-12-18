import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { masterResumeService } from '../services/masterResumeService';
import MasterResumeUpload from './Profile/MasterResumeUpload';
import ResumeGenerator from './Generator/ResumeGenerator';
import UsageTracker from './Generator/UsageTracker';
import { usageService } from '../services/usageService';
import { StaggerContainer, StaggerItem, Panel, ScaleButton, FadeIn } from './ui/MotionWrapper';

function Dashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [masterResume, setMasterResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usageHistory, setUsageHistory] = useState([]);

    useEffect(() => {
        console.log('Dashboard useEffect - authLoading:', authLoading, 'user:', user);

        // Only load master resume if user is authenticated
        if (user && !authLoading) {
            console.log('Loading master resume for user:', user.uid);
            loadMasterResume();
            loadUsageHistory();
        } else if (!authLoading && !user) {
            // User is not authenticated, redirect to login
            console.log('No user, redirecting to login');
            navigate('/login', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const loadMasterResume = async () => {
        console.log('loadMasterResume called, user:', user);

        if (!user?.uid) {
            console.log('No user UID, exiting');
            setLoading(false);
            return;
        }

        console.log('Fetching master resume for:', user.uid);

        try {
            const resume = await masterResumeService.getMasterResume(user.uid);
            console.log('Master resume loaded:', resume);
            setMasterResume(resume);
        } catch (error) {
            console.error('Error loading master resume:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsageHistory = async () => {
        if (!user?.uid) return;
        try {
            const history = await usageService.getUsageHistory(user.uid);
            setUsageHistory(history);
        } catch (error) {
            console.error('Error loading usage history:', error);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    // Show loading while checking authentication or loading resume
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // If not authenticated after loading, don't render (will redirect)
    if (!user) {
        return null;
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
                            user={user}
                            usageHistory={usageHistory}
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
function DashboardHome({ masterResume, navigate, user, usageHistory = [] }) {
    const [showFullAnalytics, setShowFullAnalytics] = useState(false);
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
        <StaggerContainer className="max-w-7xl mx-auto px-4 py-8">
            {/* Master Resume Status Card */}
            <StaggerItem>
                <div className="bg-gray-900 text-white rounded-xl p-8 mb-8 border border-gray-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 tracking-tight">
                                Welcome back, {personalInfo.firstName || user.displayName || 'there'}
                            </h2>
                            <div className="space-y-2 text-gray-400">
                                <p className="flex items-center gap-2">
                                    <span className="text-emerald-500">●</span>
                                    <span className="text-sm font-medium">Master Resume Active</span>
                                </p>
                                <p className="text-xs opacity-60">Uploaded on {uploadDate}</p>
                                {personalInfo.email && <p className="text-xs opacity-60">{personalInfo.email}</p>}
                            </div>
                        </div>
                        <ScaleButton
                            onClick={() => navigate('/dashboard/update-resume')}
                            className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm"
                        >
                            Update Resume
                        </ScaleButton>
                    </div>
                </div>
            </StaggerItem>

            {/* Quick Action - Generate Resume */}
            <StaggerItem>
                <Panel className="bg-emerald-50 border-emerald-100 p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl">🎯</div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Generate Tailored Resume</h3>
                            <p className="text-gray-600">Paste a job description and get an optimized resume in seconds</p>
                        </div>
                    </div>
                    <ScaleButton
                        onClick={() => navigate('/dashboard/generate')}
                        className="w-full bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 font-bold text-lg shadow-sm"
                    >
                        Start Generating →
                    </ScaleButton>
                </Panel>
            </StaggerItem>

            {/* Stats Grid */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" staggerDelay={0.05}>
                <StaggerItem>
                    <Panel className="p-6 cursor-pointer hover:border-emerald-500 transition-colors group" onClick={() => setShowFullAnalytics(true)}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl group-hover:scale-110 transition-transform">📊</div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Spent</div>
                                <div className="text-xl font-bold text-gray-900">
                                    View Stats
                                </div>
                            </div>
                        </div>
                        <div className="text-emerald-600 font-semibold text-sm group-hover:underline decoration-2 underline-offset-4">Token Usage Analytics</div>
                    </Panel>
                </StaggerItem>

                <StaggerItem>
                    <Panel className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl">💼</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {workExperience.length}
                            </div>
                        </div>
                        <div className="text-gray-600 font-medium text-sm">Work Experiences</div>
                    </Panel>
                </StaggerItem>

                <StaggerItem>
                    <Panel className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl">🚀</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {projects.length}
                            </div>
                        </div>
                        <div className="text-gray-600 font-medium text-sm">Projects</div>
                    </Panel>
                </StaggerItem>

                <StaggerItem>
                    <Panel className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-2xl">🏆</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {certifications.length}
                            </div>
                        </div>
                        <div className="text-gray-600 font-medium text-sm">Certifications</div>
                    </Panel>
                </StaggerItem>
            </StaggerContainer>

            {/* Analytics Modal */}
            {showFullAnalytics && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <FadeIn className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-2">
                            <UsageTracker
                                usageHistory={usageHistory}
                                onClose={() => setShowFullAnalytics(false)}
                            />
                        </div>
                    </FadeIn>
                </div>
            )}

            {/* How It Works */}
            <StaggerItem>
                <Panel className="p-8 bg-gray-50 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-center">How It Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: "📋", title: "1. Paste Job", desc: "Copy the job posting" },
                            { icon: "🤖", title: "2. AI Analysis", desc: "Claude extracts keywords" },
                            { icon: "✨", title: "3. Tailoring", desc: "Experience optimized" },
                            { icon: "📥", title: "4. Download", desc: "DOCX ready to submit" }
                        ].map((step, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">{step.icon}</div>
                                <div className="font-bold text-gray-900 mb-2">{step.title}</div>
                                <div className="text-xs text-gray-500 font-medium">{step.desc}</div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </StaggerItem>
        </StaggerContainer>
    );
}

export default Dashboard;