import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Briefcase, Rocket, Award, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { masterResumeService } from '../services/masterResumeService';
import MasterResumeUpload from './Profile/MasterResumeUpload';
import ResumeGenerator from './Generator/ResumeGenerator';
import CoverLetterGenerator from './Generator/CoverLetterGenerator';
import UsageTracker from './Generator/UsageTracker';
import SavedResumes from './SavedResumes/SavedResumes';
import MasterResumeEditor from './Profile/MasterResumeEditor';
import { usageService } from '../services/usageService';

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

    const handleEditorSave = async (updatedResume) => {
        await masterResumeService.saveMasterResume(user.uid, updatedResume);
        await loadMasterResume();
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
                                    <button
                                        onClick={() => navigate('/dashboard/cover-letter')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Cover Letter
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/saved-resumes')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Saved Resumes
                                    </button>
                                    <button
                                        onClick={() => navigate('/dashboard/edit-profile')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Edit Profile
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
                <Route
                    path="cover-letter"
                    element={<CoverLetterGenerator />}
                />
                <Route
                    path="saved-resumes"
                    element={<SavedResumes />}
                />
                <Route
                    path="edit-profile"
                    element={
                        masterResume ? (
                            <MasterResumeEditor
                                masterResume={masterResume}
                                onSave={handleEditorSave}
                            />
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

    // Expandable states
    const [expandedSections, setExpandedSections] = useState({
        experience: false,
        projects: false,
        certifications: false,
        education: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!masterResume) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-2xl font-semibold mb-4">No Master Resume Found</h2>
                <p className="text-gray-600 mb-6">
                    Upload your master resume to get started
                </p>
                <button
                    onClick={() => navigate('/dashboard/upload-resume')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    Upload Master Resume
                </button>
            </div>
        );
    }

    const stats = {
        experience: masterResume.parsedData.workExperience?.length || 0,
        projects: masterResume.parsedData.projects?.length || 0,
        certifications: masterResume.parsedData.certifications?.length || 0,
        education: masterResume.parsedData.education?.length || 0
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Welcome back, {masterResume.parsedData.personalInfo.firstName}! 👋
                </h1>
                <p className="text-gray-600">
                    Your master resume is ready. Let's create some tailored resumes!
                </p>
            </div>

            {/* Quick Actions & Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard/generate')}
                    className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-left"
                >
                    <div className="text-2xl mb-2">✨</div>
                    <h3 className="text-xl font-semibold mb-1">Generate Tailored Resume</h3>
                    <p className="text-blue-100">Create ATS-optimized resume for any job</p>
                </button>

                <button
                    onClick={() => navigate('/dashboard/cover-letter')}
                    className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-left"
                >
                    <div className="text-2xl mb-2">✉️</div>
                    <h3 className="text-xl font-semibold mb-1">Cover Letter</h3>
                    <p className="text-green-100">Generate a professional cover letter</p>
                </button>

                <button
                    onClick={() => navigate('/dashboard/update-resume')}
                    className="bg-gray-100 text-gray-800 p-6 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="text-xl font-semibold mb-1">Edit Master Resume</h3>
                    <p className="text-gray-600">Update your information</p>
                </button>

                <button
                    onClick={() => navigate('/dashboard/saved-resumes')}
                    className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-left"
                >
                    <div className="text-2xl mb-2">💾</div>
                    <h3 className="text-xl font-semibold mb-1">Saved Resumes</h3>
                    <p className="text-purple-100">Browse your saved applications</p>
                </button>

                <button
                    onClick={() => setShowFullAnalytics(true)}
                    className="bg-white border text-gray-800 p-6 rounded-lg hover:bg-gray-50 transition-colors text-left shadow-sm"
                >
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-xl font-semibold mb-1">Token Usage</h3>
                    <p className="text-gray-600">Track your AI consumption</p>
                </button>
            </div>

            {/* Master Resume Stats - Interactive */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Your Master Resume</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Work Experience Card */}
                    <div className="border rounded-lg overflow-hidden transition-all hover:shadow-md">
                        <button
                            onClick={() => toggleSection('experience')}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                                {expandedSections.experience ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                                {stats.experience}
                            </div>
                            <div className="text-sm text-gray-600">Work Experiences</div>
                            <div className="text-xs text-gray-500 mt-1">in your master resume</div>
                        </button>

                        {expandedSections.experience && (
                            <div className="border-t bg-gray-50 p-4 space-y-3 max-h-64 overflow-y-auto">
                                {masterResume.parsedData.workExperience?.map((job, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="font-semibold text-gray-800">
                                            {index + 1}. {job.position}
                                        </div>
                                        <div className="text-gray-600">
                                            {job.company}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {job.period} {job.location && `• ${job.location}`}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => navigate('/dashboard/update-resume')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                    View Full Details →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Projects Card */}
                    <div className="border rounded-lg overflow-hidden transition-all hover:shadow-md">
                        <button
                            onClick={() => toggleSection('projects')}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Rocket className="w-6 h-6 text-green-600" />
                                {expandedSections.projects ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                                {stats.projects}
                            </div>
                            <div className="text-sm text-gray-600">Projects</div>
                            <div className="text-xs text-gray-500 mt-1">ready to showcase</div>
                        </button>

                        {expandedSections.projects && (
                            <div className="border-t bg-gray-50 p-4 space-y-3 max-h-64 overflow-y-auto">
                                {masterResume.parsedData.projects?.map((project, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="font-semibold text-gray-800">
                                            {index + 1}. {project.name}
                                        </div>
                                        {project.date && (
                                            <div className="text-xs text-gray-500">{project.date}</div>
                                        )}
                                        {project.technologies && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                {project.technologies.slice(0, 3).join(', ')}
                                                {project.technologies.length > 3 && '...'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => navigate('/dashboard/update-resume')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                    View Full Details →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Certifications Card */}
                    <div className="border rounded-lg overflow-hidden transition-all hover:shadow-md">
                        <button
                            onClick={() => toggleSection('certifications')}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Award className="w-6 h-6 text-yellow-600" />
                                {expandedSections.certifications ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                                {stats.certifications}
                            </div>
                            <div className="text-sm text-gray-600">Certifications</div>
                            <div className="text-xs text-gray-500 mt-1">to highlight</div>
                        </button>

                        {expandedSections.certifications && (
                            <div className="border-t bg-gray-50 p-4 space-y-3 max-h-64 overflow-y-auto">
                                {masterResume.parsedData.certifications?.map((cert, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="font-semibold text-gray-800">
                                            {index + 1}. {cert.name}
                                        </div>
                                        {cert.date && (
                                            <div className="text-xs text-gray-500">{cert.date}</div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => navigate('/dashboard/update-resume')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                    View Full Details →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Education Card */}
                    <div className="border rounded-lg overflow-hidden transition-all hover:shadow-md">
                        <button
                            onClick={() => toggleSection('education')}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <GraduationCap className="w-6 h-6 text-purple-600" />
                                {expandedSections.education ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                                {stats.education}
                            </div>
                            <div className="text-sm text-gray-600">Education</div>
                            <div className="text-xs text-gray-500 mt-1">degrees earned</div>
                        </button>

                        {expandedSections.education && (
                            <div className="border-t bg-gray-50 p-4 space-y-3 max-h-64 overflow-y-auto">
                                {masterResume.parsedData.education?.map((edu, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="font-semibold text-gray-800">
                                            {edu.degree}
                                        </div>
                                        <div className="text-gray-600">{edu.school}</div>
                                        {edu.field && (
                                            <div className="text-xs text-gray-500">in {edu.field}</div>
                                        )}
                                        {edu.gpa && (
                                            <div className="text-xs text-gray-500">GPA: {edu.gpa}</div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => navigate('/dashboard/update-resume')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                                >
                                    View Full Details →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analytics Modal */}
            {showFullAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-2">
                            <UsageTracker
                                usageHistory={usageHistory}
                                onClose={() => setShowFullAnalytics(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;