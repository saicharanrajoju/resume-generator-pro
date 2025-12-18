import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { masterResumeService } from '../../services/masterResumeService';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import MasterResumeEditor from './MasterResumeEditor';

function MasterResumeUpload({ existingResume, onComplete }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [masterResume, setMasterResume] = useState(existingResume || null);
    const [error, setError] = useState(null);

    // Profile completion state
    const [showMasterDetails, setShowMasterDetails] = useState(false);
    const [showJsonEdit, setShowJsonEdit] = useState(false);
    const [showProfileDetails, setShowProfileDetails] = useState(false);
    const [fillZipcode, setFillZipcode] = useState(false);
    const [fillEducation, setFillEducation] = useState(false);
    const [fillLinkedIn, setFillLinkedIn] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [profileData, setProfileData] = useState({
        zipcode: '',
        educationFields: {},
        linkedinShort: ''
    });

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            setError('Please upload a .docx file');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Extract text using mammoth
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;

            // Parse the resume (you'll need to implement this parsing logic)
            const parsedData = parseResume(text);

            const masterResumeData = {
                rawText: text,
                parsedData: parsedData,
                uploadDate: new Date().toISOString()
            };

            // Save to Firestore
            await masterResumeService.saveMasterResume(user.uid, masterResumeData);


            setMasterResume(masterResumeData);

            const missing = getMissingProfileData(masterResumeData); // Pass data directly
            if (missing && missing.length > 0) {
                setShowProfileDetails(true);
            }

        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload resume. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getMissingProfileData = (resumeData) => {
        const resume = resumeData || masterResume;
        if (!resume) return [];

        const missing = [];

        // Check all personal info fields
        if (!resume.parsedData.personalInfo?.firstName) {
            missing.push('firstName');
        }
        if (!resume.parsedData.personalInfo?.lastName) {
            missing.push('lastName');
        }
        if (!resume.parsedData.personalInfo?.email) {
            missing.push('email');
        }
        if (!resume.parsedData.personalInfo?.phone) {
            missing.push('phone');
        }
        if (!resume.parsedData.personalInfo?.address?.city) {
            missing.push('city');
        }
        if (!resume.parsedData.personalInfo?.address?.state) {
            missing.push('state');
        }
        if (!resume.parsedData.personalInfo?.address?.zipCode) {
            missing.push('zipcode');
        }

        // Check education fields
        if (resume.parsedData.education) {
            resume.parsedData.education.forEach((edu, index) => {
                if (!edu.field) {
                    missing.push(`education_field_${index}`);
                }
                if (!edu.gpa) {
                    missing.push(`education_gpa_${index}`);
                }
            });
        }

        // Check work experience locations and periods
        if (resume.parsedData.workExperience) {
            resume.parsedData.workExperience.forEach((job, index) => {
                if (!job.location) {
                    missing.push(`job_location_${index}`);
                }
                if (!job.period) {
                    missing.push(`job_period_${index}`);
                }
            });
        }

        // Check project dates
        if (resume.parsedData.projects) {
            resume.parsedData.projects.forEach((project, index) => {
                if (!project.date) {
                    missing.push(`project_date_${index}`);
                }
            });
        }

        // Check LinkedIn optimization
        const linkedin = resume.parsedData.onlinePresence?.linkedin;
        if (!linkedin || linkedin.length > 40) {
            missing.push('linkedin');
        }

        return missing;
    };
    const parseResume = (text) => {
        // Basic parsing - you should implement proper parsing logic
        return {
            personalInfo: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: {
                    city: '',
                    state: '',
                    zipCode: ''
                }
            },
            onlinePresence: {
                linkedin: ''
            },
            education: [],
            workExperience: [],
            projects: [],
            certifications: []
        };
    };

    const updateEducationField = (index, value) => {
        setProfileData(prev => ({
            ...prev,
            educationFields: {
                ...prev.educationFields,
                [index]: value
            }
        }));
    };

    const saveProfileData = async () => {
        if (!user?.uid) return;

        try {
            setUpdating(true);

            // Prepare updates
            const updates = {};

            if (fillZipcode && profileData.zipcode) {
                updates.zipcode = profileData.zipcode;
            }

            if (fillLinkedIn && profileData.linkedinShort) {
                updates.linkedinShort = profileData.linkedinShort;
            }

            if (fillEducation && Object.keys(profileData.educationFields).length > 0) {
                updates.educationFields = profileData.educationFields;
            }

            // Update master resume
            const updated = await masterResumeService.updateProfileFields(user.uid, updates);

            setMasterResume(updated);
            setShowProfileDetails(false);

            alert('✅ Profile updated successfully!');

        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const calculateCompleteness = () => {
        if (!masterResume) return 0;

        let score = 0;
        let total = 0;

        // Personal Info (7 fields - most important)
        const personalFields = [
            masterResume.parsedData.personalInfo?.firstName,
            masterResume.parsedData.personalInfo?.lastName,
            masterResume.parsedData.personalInfo?.email,
            masterResume.parsedData.personalInfo?.phone,
            masterResume.parsedData.personalInfo?.address?.city,
            masterResume.parsedData.personalInfo?.address?.state,
            masterResume.parsedData.personalInfo?.address?.zipCode
        ];

        personalFields.forEach(field => {
            total++;
            if (field) score++;
        });

        // Education fields (field and GPA for each degree)
        if (masterResume.parsedData.education) {
            masterResume.parsedData.education.forEach(edu => {
                total += 2; // field + gpa
                if (edu.field) score++;
                if (edu.gpa) score++;
            });
        }

        // Work Experience (location and period for each job)
        if (masterResume.parsedData.workExperience) {
            masterResume.parsedData.workExperience.forEach(job => {
                total += 2; // location + period
                if (job.location) score++;
                if (job.period) score++;
            });
        }

        // Projects (date for each project)
        if (masterResume.parsedData.projects) {
            total += masterResume.parsedData.projects.length;
            score += masterResume.parsedData.projects.filter(p => p.date).length;
        }

        // LinkedIn
        total++;
        const linkedin = masterResume.parsedData.onlinePresence?.linkedin;
        if (linkedin && linkedin.length <= 40) score++;

        return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    const hasAnySelected = fillZipcode || fillEducation || fillLinkedIn;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                {existingResume ? 'Update Master Resume' : 'Upload Master Resume'}
            </h1>

            {/* Upload Section */}
            {!masterResume && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">📄</div>
                        <h2 className="text-2xl font-semibold mb-2">Upload Your Master Resume</h2>
                        <p className="text-gray-600">
                            Upload your complete resume once. We'll use AI to tailor it for every job.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <label className="block">
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
                            {uploading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="text-gray-600">Processing resume...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="text-4xl mb-2">⬆️</div>
                                    <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                                    <p className="text-sm text-gray-500">Only .docx files supported</p>
                                </>
                            )}
                        </div>
                    </label>
                </div>
            )}
            {/* Master Resume Details Viewer - ADD THIS ENTIRE BLOCK */}
            {masterResume && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Master Resume Details</h3>
                        <button
                            onClick={() => setShowMasterDetails(!showMasterDetails)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showMasterDetails ? '▼ Hide' : '▶ View Details'}
                        </button>
                    </div>

                    {showMasterDetails && (
                        <MasterResumeEditor
                            masterResume={masterResume}
                            onSave={async (updatedResume) => {
                                await masterResumeService.saveMasterResume(user.uid, updatedResume);
                                setMasterResume(updatedResume);
                                setShowMasterDetails(false);
                                alert('✅ Changes saved successfully!');
                            }}
                        />
                    )}
                </div>
            )}
            {/* Profile Completion (Step 1) */}
            {masterResume && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                📊 Profile Completeness: {calculateCompleteness()}%
                            </h3>
                            {calculateCompleteness() < 100 ? (
                                <p className="text-sm text-gray-600">
                                    Add these details to improve all future resumes
                                </p>
                            ) : (
                                <p className="text-sm text-green-600">
                                    ✓ Your profile is complete!
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowProfileDetails(!showProfileDetails)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showProfileDetails ? '▼ Hide' : '▶ Show Details'}
                        </button>
                    </div>

                    {showProfileDetails && (
                        <div className="space-y-4 mt-4 border-t border-blue-200 pt-4">
                            {/* Show summary of missing items */}
                            {getMissingProfileData().length > 0 ? (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm font-medium text-yellow-800 mb-2">
                                        Missing {getMissingProfileData().length} item(s):
                                    </p>
                                    <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                                        {!masterResume.parsedData.personalInfo?.firstName && <li>First Name</li>}
                                        {!masterResume.parsedData.personalInfo?.lastName && <li>Last Name</li>}
                                        {!masterResume.parsedData.personalInfo?.email && <li>Email</li>}
                                        {!masterResume.parsedData.personalInfo?.phone && <li>Phone Number</li>}
                                        {!masterResume.parsedData.personalInfo?.address?.city && <li>City</li>}
                                        {!masterResume.parsedData.personalInfo?.address?.state && <li>State</li>}
                                        {!masterResume.parsedData.personalInfo?.address?.zipCode && <li>Zipcode</li>}
                                        {masterResume.parsedData.education?.some(edu => !edu.field) && <li>Education Field(s)</li>}
                                        {masterResume.parsedData.education?.some(edu => !edu.gpa) && <li>GPA(s)</li>}
                                        {masterResume.parsedData.workExperience?.some(job => !job.location) && <li>Job Location(s)</li>}
                                        {masterResume.parsedData.workExperience?.some(job => !job.period) && <li>Job Period(s)</li>}
                                        {masterResume.parsedData.projects?.some(proj => !proj.date) && <li>Project Date(s)</li>}
                                        {(!masterResume.parsedData.onlinePresence?.linkedin ||
                                            masterResume.parsedData.onlinePresence.linkedin.length > 40) && <li>LinkedIn URL (optimize)</li>}
                                    </ul>
                                </div>
                            ) : (
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm text-green-700">
                                        ✓ All fields are complete! Your profile is optimized.
                                    </p>
                                </div>
                            )}

                            {/* Keep existing checkbox fields for filling data */}
                            {/* Zipcode */}
                            {!masterResume.parsedData.personalInfo.address?.zipCode && (
                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                        <input
                                            type="checkbox"
                                            className="mr-2 w-4 h-4"
                                            checked={fillZipcode}
                                            onChange={(e) => setFillZipcode(e.target.checked)}
                                        />
                                        Add Zipcode
                                    </label>
                                    {fillZipcode && (
                                        <input
                                            type="text"
                                            placeholder="76210"
                                            className="ml-6 w-full max-w-xs border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            value={profileData.zipcode}
                                            onChange={(e) => setProfileData({ ...profileData, zipcode: e.target.value })}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Education Fields */}
                            {masterResume.parsedData.education?.some(edu => !edu.field) && (
                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                        <input
                                            type="checkbox"
                                            className="mr-2 w-4 h-4"
                                            checked={fillEducation}
                                            onChange={(e) => setFillEducation(e.target.checked)}
                                        />
                                        Add Education Fields
                                    </label>
                                    {fillEducation && (
                                        <div className="space-y-2 ml-6">
                                            {masterResume.parsedData.education.map((edu, index) => (
                                                !edu.field && (
                                                    <div key={index}>
                                                        <label className="text-xs text-gray-600 block mb-1">
                                                            {edu.degree} at {edu.school}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Data Science, Mechanical Engineering"
                                                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                            value={profileData.educationFields[index] || ''}
                                                            onChange={(e) => updateEducationField(index, e.target.value)}
                                                        />
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LinkedIn Optimization */}
                            {masterResume.parsedData.onlinePresence?.linkedin &&
                                masterResume.parsedData.onlinePresence.linkedin.length > 40 && (
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                            <input
                                                type="checkbox"
                                                className="mr-2 w-4 h-4"
                                                checked={fillLinkedIn}
                                                onChange={(e) => setFillLinkedIn(e.target.checked)}
                                            />
                                            Optimize LinkedIn URL
                                        </label>
                                        {fillLinkedIn && (
                                            <div className="ml-6">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    Current: {masterResume.parsedData.onlinePresence.linkedin}
                                                </p>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600">linkedin.com/in/</span>
                                                    <input
                                                        type="text"
                                                        placeholder="saicharan"
                                                        className="flex-1 max-w-xs border rounded px-3 py-2 ml-2 focus:ring-2 focus:ring-blue-500"
                                                        value={profileData.linkedinShort}
                                                        onChange={(e) => setProfileData({ ...profileData, linkedinShort: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            {/* Action Buttons */}
                            {hasAnySelected && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={saveProfileData}
                                        disabled={updating}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {updating ? 'Saving...' : 'Save to Profile'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileDetails(false);
                                            setFillZipcode(false);
                                            setFillEducation(false);
                                            setFillLinkedIn(false);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Continue Button */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                if (onComplete) onComplete();
                                navigate('/dashboard/generate');
                            }}
                            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                            Continue to Resume Generator →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MasterResumeUpload;