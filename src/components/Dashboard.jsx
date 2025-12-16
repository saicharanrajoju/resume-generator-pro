import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import ProfileSetup from './Profile/ProfileSetup';
import ResumeGenerator from './Generator/ResumeGenerator';

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [currentView, setCurrentView] = useState('home'); // 'home', 'generate', 'tracker'

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const userProfile = await profileService.getProfile(user.uid);

            if (userProfile) {
                setProfile(userProfile);
            } else {
                setShowProfileSetup(true);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleProfileComplete = async () => {
        setShowProfileSetup(false);
        await loadProfile();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (showProfileSetup) {
        return <ProfileSetup onComplete={handleProfileComplete} />;
    }

    // Show Resume Generator view
    if (currentView === 'generate') {
        return (
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-6">
                                <h1
                                    className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600"
                                    onClick={() => setCurrentView('home')}
                                >
                                    Resume Generator Pro
                                </h1>
                                <button
                                    onClick={() => setCurrentView('home')}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    ← Back to Dashboard
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600">
                                    {profile?.fullName || user?.displayName}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <ResumeGenerator />
            </div>
        );
    }

    // Main dashboard home view
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-800">
                            Resume Generator Pro
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                                {profile?.fullName || user?.displayName}
                            </span>
                            <button
                                onClick={() => setShowProfileSetup(true)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Profile Summary Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Profile Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {profile?.fullName}</p>
                            <p><span className="font-medium">Email:</span> {profile?.email}</p>
                            <p><span className="font-medium">Phone:</span> {profile?.phone || 'Not set'}</p>
                            <p><span className="font-medium">Experience:</span> {profile?.experience?.length || 0} roles</p>
                            <p><span className="font-medium">Skills:</span> {(profile?.skills?.technical?.length || 0) + (profile?.skills?.soft?.length || 0)} total</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setCurrentView('generate')}
                                className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors text-left"
                            >
                                <div className="text-xl mb-1">📝</div>
                                <div className="font-semibold">Generate Resume</div>
                                <div className="text-sm opacity-90">Create tailored resume</div>
                            </button>
                            <button
                                onClick={() => setCurrentView('tracker')}
                                className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors text-left"
                            >
                                <div className="text-xl mb-1">📊</div>
                                <div className="font-semibold">View Tracker</div>
                                <div className="text-sm opacity-90">Track applications</div>
                            </button>
                            <button
                                onClick={() => setShowProfileSetup(true)}
                                className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors text-left"
                            >
                                <div className="text-xl mb-1">👤</div>
                                <div className="font-semibold">Edit Profile</div>
                                <div className="text-sm opacity-90">Update your info</div>
                            </button>
                            <button className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition-colors text-left">
                                <div className="text-xl mb-1">⚙️</div>
                                <div className="font-semibold">Settings</div>
                                <div className="text-sm opacity-90">Preferences</div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Recent Applications
                    </h3>
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-xl mb-2">📋</p>
                        <p>No applications yet. Generate your first resume to get started!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;