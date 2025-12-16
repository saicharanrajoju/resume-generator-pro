import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import ProfileSetup from './Profile/ProfileSetup';
import ResumeGenerator from './Generator/ResumeGenerator';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        try {
            const userProfile = await profileService.getProfile(user.uid);
            setProfile(userProfile);
        } catch (error) {
            console.error('Error loading profile:', error);
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

                            {profile && (
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
                                        onClick={() => navigate('/dashboard/profile')}
                                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Update Profile
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
                <Route index element={<DashboardHome profile={profile} navigate={navigate} />} />
                <Route path="profile" element={<ProfileSetup onComplete={loadProfile} />} />
                <Route path="generate" element={<ResumeGenerator />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </div>
    );
}

// Dashboard Home Component
function DashboardHome({ profile, navigate }) {
    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Please set up your profile first to start generating resumes.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/dashboard/profile')}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Set Up Profile
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Profile Summary Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Welcome back, {profile.personalInfo?.firstName}!
                        </h2>
                        <div className="text-gray-600 space-y-1">
                            <p>📧 {profile.personalInfo?.email}</p>
                            {profile.personalInfo?.phone && <p>📱 {profile.personalInfo?.phone}</p>}
                            <p className="text-sm text-green-600 font-medium mt-2">
                                ✓ Master Resume Uploaded
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/profile')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        Update Profile →
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={() => navigate('/dashboard/generate')}
                    className="bg-blue-600 text-white p-8 rounded-lg hover:bg-blue-700 transition-colors text-left group"
                >
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-xl font-bold mb-2">Generate Tailored Resume</h3>
                    <p className="text-blue-100">
                        Paste a job description and get an ATS-optimized resume instantly
                    </p>
                    <div className="mt-4 text-blue-200 group-hover:text-white">
                        Get started →
                    </div>
                </button>

                <button
                    onClick={() => navigate('/dashboard/profile')}
                    className="bg-purple-600 text-white p-8 rounded-lg hover:bg-purple-700 transition-colors text-left group"
                >
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-xl font-bold mb-2">Update Master Resume</h3>
                    <p className="text-purple-100">
                        Upload a new resume or update your existing information
                    </p>
                    <div className="mt-4 text-purple-200 group-hover:text-white">
                        Update now →
                    </div>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                        {profile.workExperience?.length || 0}
                    </div>
                    <div className="text-gray-600 text-sm">Work Experiences</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                        {profile.projects?.length || 0}
                    </div>
                    <div className="text-gray-600 text-sm">Projects</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                        {profile.certifications?.length || 0}
                    </div>
                    <div className="text-gray-600 text-sm">Certifications</div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;