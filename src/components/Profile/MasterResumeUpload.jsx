import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function MasterResumeUpload({ existingResume, onComplete }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl w-full text-center">
                {/* Icon */}
                <div className="mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Master Resume AI Assistant
                </h1>

                {/* Subtitle */}
                <p className="text-xl text-gray-600 mb-8">
                    Coming Soon
                </p>

                {/* Description */}
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    We're building an intelligent conversational interface to help you manage your master resume.
                    Stay tuned for a revolutionary resume management experience.
                </p>

                {/* Loading Animation */}
                <div className="flex justify-center items-center gap-2 mb-8">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}

export default MasterResumeUpload;