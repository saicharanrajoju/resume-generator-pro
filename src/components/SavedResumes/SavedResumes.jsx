import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import savedResumesService from '../../services/savedResumesService';

function SavedResumes() {
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.uid) loadResumes();
    }, [user]);

    const loadResumes = async () => {
        setLoading(true);
        try {
            const data = await savedResumesService.getSavedResumes(user.uid);
            setResumes(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load saved resumes.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (resume) => {
        if (!confirm(`Delete resume for ${resume.role} at ${resume.company}?`)) return;
        setDeletingId(resume.id);
        try {
            await savedResumesService.deleteResume(user.uid, resume.id, resume.storagePath);
            setResumes(prev => prev.filter(r => r.id !== resume.id));
        } catch (err) {
            console.error(err);
            setError('Failed to delete. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = resumes.filter(r => {
        const q = search.toLowerCase();
        return (
            r.company?.toLowerCase().includes(q) ||
            r.role?.toLowerCase().includes(q)
        );
    });

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getScoreColor = (score) => {
        if (!score) return 'text-gray-400';
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-yellow-600';
        return 'text-red-500';
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Saved Resumes</h1>
            <p className="text-gray-500 mb-6">All resumes you've saved while applying to jobs.</p>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by company or role..."
                    className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-4">📂</div>
                    <p className="text-gray-600 text-lg">
                        {search ? 'No resumes match your search.' : 'No saved resumes yet. Generate and save one!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(resume => (
                        <div key={resume.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold text-gray-800 text-lg leading-tight">{resume.company}</p>
                                    <p className="text-blue-600 font-medium text-sm mt-0.5">{resume.role}</p>
                                </div>
                                {resume.atsScore != null && (
                                    <span className={`text-xl font-bold shrink-0 ${getScoreColor(resume.atsScore)}`}>
                                        {resume.atsScore}%
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-400">{formatDate(resume.savedAt)}</p>

                            <div className="flex gap-2 mt-auto pt-2">
                                <a
                                    href={resume.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={resume.fileName}
                                    className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                >
                                    Download
                                </a>
                                <button
                                    onClick={() => handleDelete(resume)}
                                    disabled={deletingId === resume.id}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {deletingId === resume.id ? '...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SavedResumes;
