import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import resumeParserService from '../../services/resumeParserService';
import CollapsibleSection from '../Common/CollapsibleSection';

function ProfileSetup({ onComplete }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadMode, setUploadMode] = useState(true);
    const [parsing, setParsing] = useState(false);
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
    const [resumeText, setResumeText] = useState('');

    const [formData, setFormData] = useState({
        personalInfo: {
            firstName: user?.displayName?.split(' ')[0] || '',
            lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            phone: '',
            address: {
                city: '',
                state: '',
                country: ''
            }
        },
        onlinePresence: {
            linkedin: '',
            github: '',
            portfolio: '',
            website: ''
        },
        professionalSummary: '',
        workExperience: [
            {
                company: '',
                position: '',
                employmentType: 'Full-time',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                achievements: ['']
            }
        ],
        education: [
            {
                institution: '',
                degree: '',
                fieldOfStudy: '',
                gpa: '',
                startDate: '',
                endDate: '',
                location: ''
            }
        ],
        skills: {
            technical: [],
            soft: []
        },
        projects: [],
        certifications: [],
        awards: [],
        publications: [],
        volunteerExperience: [],
        languages: [],
        memberships: [],
        interests: []
    });

    // File upload handler
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        if (!validTypes.includes(file.type)) {
            alert('Please upload a DOCX file');
            return;
        }

        setParsing(true);

        try {
            const parsedData = await resumeParserService.parseResumeFile(file);
            setFormData(parsedData);
            setUploadMode(false);
            alert('Resume parsed successfully! Review and edit the information below, then save. ✅');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to parse resume. Please try again or fill manually.');
        } finally {
            setParsing(false);
        }
    };
    const handleTextParse = async () => {
        if (!resumeText.trim()) {
            alert('Please paste your resume text');
            return;
        }

        if (resumeText.trim().length < 100) {
            alert('Please paste more content. The text seems too short.');
            return;
        }

        setParsing(true);

        try {
            const parsedData = await resumeParserService.parseResumeText(resumeText);
            setFormData(parsedData);
            setUploadMode(false);
            alert('Resume parsed successfully! Review and edit the information below, then save. ✅');
        } catch (error) {
            console.error('Parse error:', error);
            alert('Failed to parse resume. Please try again or fill manually.');
        } finally {
            setParsing(false);
        }
    };
    // Personal Info handlers
    const updatePersonalInfo = (field, value) => {
        setFormData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
        }));
    };

    const updateAddress = (field, value) => {
        setFormData(prev => ({
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                address: { ...prev.personalInfo.address, [field]: value }
            }
        }));
    };

    const updateOnlinePresence = (field, value) => {
        setFormData(prev => ({
            ...prev,
            onlinePresence: { ...prev.onlinePresence, [field]: value }
        }));
    };

    // Work Experience handlers
    const addWorkExperience = () => {
        setFormData(prev => ({
            ...prev,
            workExperience: [
                ...prev.workExperience,
                {
                    company: '',
                    position: '',
                    employmentType: 'Full-time',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    achievements: ['']
                }
            ]
        }));
    };

    const updateWorkExperience = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((exp, i) =>
                i === index ? { ...exp, [field]: value } : exp
            )
        }));
    };

    const removeWorkExperience = (index) => {
        if (formData.workExperience.length === 1) {
            alert('You must have at least one work experience');
            return;
        }
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.filter((_, i) => i !== index)
        }));
    };

    const addAchievement = (expIndex) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((exp, i) =>
                i === expIndex
                    ? { ...exp, achievements: [...exp.achievements, ''] }
                    : exp
            )
        }));
    };

    const updateAchievement = (expIndex, achIndex, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((exp, i) =>
                i === expIndex
                    ? {
                        ...exp,
                        achievements: exp.achievements.map((ach, j) =>
                            j === achIndex ? value : ach
                        )
                    }
                    : exp
            )
        }));
    };

    const removeAchievement = (expIndex, achIndex) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((exp, i) =>
                i === expIndex
                    ? { ...exp, achievements: exp.achievements.filter((_, j) => j !== achIndex) }
                    : exp
            )
        }));
    };

    // Education handlers
    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [
                ...prev.education,
                {
                    institution: '',
                    degree: '',
                    fieldOfStudy: '',
                    gpa: '',
                    startDate: '',
                    endDate: '',
                    location: ''
                }
            ]
        }));
    };

    const updateEducation = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.map((edu, i) =>
                i === index ? { ...edu, [field]: value } : edu
            )
        }));
    };

    const removeEducation = (index) => {
        if (formData.education.length === 1) {
            alert('You must have at least one education entry');
            return;
        }
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Skills handlers
    const handleSkillsChange = (type, value) => {
        const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData(prev => ({
            ...prev,
            skills: { ...prev.skills, [type]: skillsArray }
        }));
    };

    // Projects handlers
    const addProject = () => {
        setFormData(prev => ({
            ...prev,
            projects: [
                ...prev.projects,
                {
                    name: '',
                    description: '',
                    technologies: [],
                    startDate: '',
                    endDate: '',
                    current: false,
                    githubLink: '',
                    liveLink: ''
                }
            ]
        }));
    };

    const updateProject = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.map((proj, i) =>
                i === index ? { ...proj, [field]: value } : proj
            )
        }));
    };

    const removeProject = (index) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    const handleProjectTechChange = (index, value) => {
        const techArray = value.split(',').map(s => s.trim()).filter(s => s);
        updateProject(index, 'technologies', techArray);
    };

    // Certifications handlers
    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [
                ...prev.certifications,
                {
                    name: '',
                    issuingOrganization: '',
                    issueDate: '',
                    expiryDate: '',
                    credentialId: '',
                    credentialUrl: ''
                }
            ]
        }));
    };

    const updateCertification = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.map((cert, i) =>
                i === index ? { ...cert, [field]: value } : cert
            )
        }));
    };

    const removeCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    // Awards handlers
    const addAward = () => {
        setFormData(prev => ({
            ...prev,
            awards: [
                ...prev.awards,
                {
                    title: '',
                    issuer: '',
                    date: '',
                    description: ''
                }
            ]
        }));
    };

    const updateAward = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            awards: prev.awards.map((award, i) =>
                i === index ? { ...award, [field]: value } : award
            )
        }));
    };

    const removeAward = (index) => {
        setFormData(prev => ({
            ...prev,
            awards: prev.awards.filter((_, i) => i !== index)
        }));
    };

    // Languages handlers
    const addLanguage = () => {
        setFormData(prev => ({
            ...prev,
            languages: [
                ...prev.languages,
                { language: '', proficiency: 'Intermediate' }
            ]
        }));
    };

    const updateLanguage = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.map((lang, i) =>
                i === index ? { ...lang, [field]: value } : lang
            )
        }));
    };

    const removeLanguage = (index) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
        }));
    };

    // Volunteer handlers
    const addVolunteer = () => {
        setFormData(prev => ({
            ...prev,
            volunteerExperience: [
                ...prev.volunteerExperience,
                {
                    organization: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: ''
                }
            ]
        }));
    };

    const updateVolunteer = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            volunteerExperience: prev.volunteerExperience.map((vol, i) =>
                i === index ? { ...vol, [field]: value } : vol
            )
        }));
    };

    const removeVolunteer = (index) => {
        setFormData(prev => ({
            ...prev,
            volunteerExperience: prev.volunteerExperience.filter((_, i) => i !== index)
        }));
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await profileService.saveProfile(user.uid, formData);
            alert('Profile saved successfully! ✅');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Create Your Master Profile
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Upload your existing resume or fill manually - all fields are optional except name and email
                    </p>

                    {/* Upload or Manual Toggle */}
                    {uploadMode ? (
                        <div className="mb-8">
                            {/* Tabs for Upload Methods */}
                            <div className="flex gap-2 mb-6 border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('file')}
                                    className={`px-6 py-3 font-medium transition-colors ${uploadMethod === 'file'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📄 Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('text')}
                                    className={`px-6 py-3 font-medium transition-colors ${uploadMethod === 'text'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📋 Paste Text
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                                {parsing ? (
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Parsing your resume with AI...</p>
                                        <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
                                    </div>
                                ) : uploadMethod === 'file' ? (
                                    <>
                                        <div className="text-5xl mb-4 text-center">📄</div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                                            Upload Your Resume File
                                        </h3>
                                        <p className="text-gray-600 mb-6 text-center">
                                            AI will automatically extract all your information
                                        </p>
                                        <input
                                            type="file"
                                            accept=".doc,.docx"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="resume-upload"
                                        />
                                        <label
                                            htmlFor="resume-upload"
                                            className="block mx-auto w-fit bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                                        >
                                            Choose File (DOCX only)
                                        </label>
                                        <p className="text-sm text-gray-500 mt-4 text-center">
                                            Supported format: DOCX (Word documents)
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-5xl mb-4 text-center">📋</div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                                            Paste Your Resume Text
                                        </h3>
                                        <p className="text-gray-600 mb-6 text-center">
                                            Copy all text from your resume and paste it here
                                        </p>

                                        <textarea
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            placeholder="Paste your entire resume here...

Example: Open your PDF/Word resume → Select All (Ctrl/Cmd+A) → Copy (Ctrl/Cmd+C) → Paste here"
                                            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                                        />

                                        <button
                                            onClick={handleTextParse}
                                            disabled={!resumeText.trim()}
                                            className="block mx-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ✨ Parse Resume with AI
                                        </button>

                                        <p className="text-sm text-gray-500 mt-4 text-center">
                                            Works with text from PDF, DOCX, or any format
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode(false)}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Or fill manually instead →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode(true)}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    ← Upload resume instead
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* PERSONAL INFORMATION */}
                                <CollapsibleSection title="Personal Information" isOpen={true} required={true}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.personalInfo.firstName}
                                                onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.personalInfo.lastName}
                                                onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.personalInfo.email}
                                                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.personalInfo.phone}
                                                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.personalInfo.address.city}
                                                onChange={(e) => updateAddress('city', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                State/Province
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.personalInfo.address.state}
                                                onChange={(e) => updateAddress('state', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.personalInfo.address.country}
                                                onChange={(e) => updateAddress('country', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* ONLINE PRESENCE */}
                                <CollapsibleSection title="Online Presence">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.onlinePresence.linkedin}
                                                onChange={(e) => updateOnlinePresence('linkedin', e.target.value)}
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                GitHub
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.onlinePresence.github}
                                                onChange={(e) => updateOnlinePresence('github', e.target.value)}
                                                placeholder="https://github.com/yourusername"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Portfolio
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.onlinePresence.portfolio}
                                                onChange={(e) => updateOnlinePresence('portfolio', e.target.value)}
                                                placeholder="https://yourportfolio.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.onlinePresence.website}
                                                onChange={(e) => updateOnlinePresence('website', e.target.value)}
                                                placeholder="https://yourwebsite.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* PROFESSIONAL SUMMARY */}
                                <CollapsibleSection title="Professional Summary">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Write a brief professional summary (2-3 sentences)
                                        </label>
                                        <textarea
                                            value={formData.professionalSummary}
                                            onChange={(e) => setFormData(prev => ({ ...prev, professionalSummary: e.target.value }))}
                                            placeholder="Experienced software engineer with 5+ years of expertise in full-stack development..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="4"
                                        />
                                    </div>
                                </CollapsibleSection>
                                {/* WORK EXPERIENCE */}
                                <CollapsibleSection title="Work Experience" isOpen={true} required={true}>
                                    <div className="space-y-6">
                                        {formData.workExperience.map((exp, expIndex) => (
                                            <div key={expIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                {formData.workExperience.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWorkExperience(expIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}

                                                <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                    Experience {expIndex + 1}
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Company *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={exp.company}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'company', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Position *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={exp.position}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'position', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Employment Type
                                                        </label>
                                                        <select
                                                            value={exp.employmentType}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'employmentType', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        >
                                                            <option value="Full-time">Full-time</option>
                                                            <option value="Part-time">Part-time</option>
                                                            <option value="Contract">Contract</option>
                                                            <option value="Freelance">Freelance</option>
                                                            <option value="Internship">Internship</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Location
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exp.location}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'location', e.target.value)}
                                                            placeholder="City, State"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Start Date *
                                                        </label>
                                                        <input
                                                            type="month"
                                                            required
                                                            value={exp.startDate}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'startDate', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            End Date
                                                        </label>
                                                        <input
                                                            type="month"
                                                            value={exp.endDate}
                                                            onChange={(e) => updateWorkExperience(expIndex, 'endDate', e.target.value)}
                                                            disabled={exp.current}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                        />
                                                        <label className="flex items-center mt-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={exp.current}
                                                                onChange={(e) => updateWorkExperience(expIndex, 'current', e.target.checked)}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm text-gray-600">Currently working here</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Key Achievements *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => addAchievement(expIndex)}
                                                            className="text-blue-500 text-sm hover:text-blue-600"
                                                        >
                                                            + Add Achievement
                                                        </button>
                                                    </div>
                                                    {exp.achievements.map((achievement, achIndex) => (
                                                        <div key={achIndex} className="flex gap-2 mb-2">
                                                            <textarea
                                                                required
                                                                value={achievement}
                                                                onChange={(e) => updateAchievement(expIndex, achIndex, e.target.value)}
                                                                placeholder="• Led a team of 5 engineers to deliver..."
                                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                rows="2"
                                                            />
                                                            {exp.achievements.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAchievement(expIndex, achIndex)}
                                                                    className="text-red-500 hover:text-red-700 px-2"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addWorkExperience}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Another Experience
                                        </button>
                                    </div>
                                </CollapsibleSection>
                                {/* EDUCATION */}
                                <CollapsibleSection title="Education" isOpen={true} required={true}>
                                    <div className="space-y-6">
                                        {formData.education.map((edu, eduIndex) => (
                                            <div key={eduIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                {formData.education.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEducation(eduIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}

                                                <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                    Education {eduIndex + 1}
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Institution *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={edu.institution}
                                                            onChange={(e) => updateEducation(eduIndex, 'institution', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Degree *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={edu.degree}
                                                            onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                                                            placeholder="Bachelor's, Master's, PhD, etc."
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Field of Study *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={edu.fieldOfStudy}
                                                            onChange={(e) => updateEducation(eduIndex, 'fieldOfStudy', e.target.value)}
                                                            placeholder="Computer Science, Business, etc."
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            GPA
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={edu.gpa}
                                                            onChange={(e) => updateEducation(eduIndex, 'gpa', e.target.value)}
                                                            placeholder="3.8/4.0"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Start Date
                                                        </label>
                                                        <input
                                                            type="month"
                                                            value={edu.startDate}
                                                            onChange={(e) => updateEducation(eduIndex, 'startDate', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            End Date / Expected
                                                        </label>
                                                        <input
                                                            type="month"
                                                            value={edu.endDate}
                                                            onChange={(e) => updateEducation(eduIndex, 'endDate', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Location
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={edu.location}
                                                            onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
                                                            placeholder="City, State"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addEducation}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Another Education
                                        </button>
                                    </div>
                                </CollapsibleSection>

                                {/* SKILLS */}
                                <CollapsibleSection title="Skills">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Technical Skills (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={formData.skills.technical.join(', ')}
                                                onChange={(e) => handleSkillsChange('technical', e.target.value)}
                                                placeholder="React, Node.js, Python, AWS, Docker, SQL"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Soft Skills (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={formData.skills.soft.join(', ')}
                                                onChange={(e) => handleSkillsChange('soft', e.target.value)}
                                                placeholder="Leadership, Communication, Problem Solving, Team Collaboration"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                                {/* PROJECTS */}
                                <CollapsibleSection title="Projects">
                                    <div className="space-y-6">
                                        {formData.projects.length === 0 ? (
                                            <p className="text-gray-500 text-sm mb-4">No projects added yet. Click below to add your first project.</p>
                                        ) : (
                                            formData.projects.map((proj, projIndex) => (
                                                <div key={projIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProject(projIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                        Project {projIndex + 1}
                                                    </h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Project Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={proj.name}
                                                                onChange={(e) => updateProject(projIndex, 'name', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Description
                                                            </label>
                                                            <textarea
                                                                value={proj.description}
                                                                onChange={(e) => updateProject(projIndex, 'description', e.target.value)}
                                                                rows="3"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Technologies Used (comma-separated)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={proj.technologies.join(', ')}
                                                                onChange={(e) => handleProjectTechChange(projIndex, e.target.value)}
                                                                placeholder="React, Node.js, MongoDB"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Start Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={proj.startDate}
                                                                onChange={(e) => updateProject(projIndex, 'startDate', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                End Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={proj.endDate}
                                                                onChange={(e) => updateProject(projIndex, 'endDate', e.target.value)}
                                                                disabled={proj.current}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                            />
                                                            <label className="flex items-center mt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={proj.current}
                                                                    onChange={(e) => updateProject(projIndex, 'current', e.target.checked)}
                                                                    className="mr-2"
                                                                />
                                                                <span className="text-sm text-gray-600">Currently working on this</span>
                                                            </label>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                GitHub Link
                                                            </label>
                                                            <input
                                                                type="url"
                                                                value={proj.githubLink}
                                                                onChange={(e) => updateProject(projIndex, 'githubLink', e.target.value)}
                                                                placeholder="https://github.com/..."
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Live Demo Link
                                                            </label>
                                                            <input
                                                                type="url"
                                                                value={proj.liveLink}
                                                                onChange={(e) => updateProject(projIndex, 'liveLink', e.target.value)}
                                                                placeholder="https://..."
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <button
                                            type="button"
                                            onClick={addProject}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Project
                                        </button>
                                    </div>
                                </CollapsibleSection>

                                {/* CERTIFICATIONS */}
                                <CollapsibleSection title="Certifications">
                                    <div className="space-y-6">
                                        {formData.certifications.length === 0 ? (
                                            <p className="text-gray-500 text-sm mb-4">No certifications added yet.</p>
                                        ) : (
                                            formData.certifications.map((cert, certIndex) => (
                                                <div key={certIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCertification(certIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                        Certification {certIndex + 1}
                                                    </h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Certification Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cert.name}
                                                                onChange={(e) => updateCertification(certIndex, 'name', e.target.value)}
                                                                placeholder="AWS Certified Solutions Architect"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Issuing Organization
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cert.issuingOrganization}
                                                                onChange={(e) => updateCertification(certIndex, 'issuingOrganization', e.target.value)}
                                                                placeholder="Amazon Web Services"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Issue Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={cert.issueDate}
                                                                onChange={(e) => updateCertification(certIndex, 'issueDate', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Expiry Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={cert.expiryDate}
                                                                onChange={(e) => updateCertification(certIndex, 'expiryDate', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Credential ID
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cert.credentialId}
                                                                onChange={(e) => updateCertification(certIndex, 'credentialId', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Credential URL
                                                            </label>
                                                            <input
                                                                type="url"
                                                                value={cert.credentialUrl}
                                                                onChange={(e) => updateCertification(certIndex, 'credentialUrl', e.target.value)}
                                                                placeholder="https://..."
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <button
                                            type="button"
                                            onClick={addCertification}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Certification
                                        </button>
                                    </div>
                                </CollapsibleSection>
                                {/* AWARDS & HONORS */}
                                <CollapsibleSection title="Awards & Honors">
                                    <div className="space-y-6">
                                        {formData.awards.length === 0 ? (
                                            <p className="text-gray-500 text-sm mb-4">No awards added yet.</p>
                                        ) : (
                                            formData.awards.map((award, awardIndex) => (
                                                <div key={awardIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAward(awardIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                        Award {awardIndex + 1}
                                                    </h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Award Title
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={award.title}
                                                                onChange={(e) => updateAward(awardIndex, 'title', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Issuer
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={award.issuer}
                                                                onChange={(e) => updateAward(awardIndex, 'issuer', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={award.date}
                                                                onChange={(e) => updateAward(awardIndex, 'date', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Description
                                                            </label>
                                                            <textarea
                                                                value={award.description}
                                                                onChange={(e) => updateAward(awardIndex, 'description', e.target.value)}
                                                                rows="2"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <button
                                            type="button"
                                            onClick={addAward}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Award
                                        </button>
                                    </div>
                                </CollapsibleSection>

                                {/* LANGUAGES */}
                                <CollapsibleSection title="Languages">
                                    <div className="space-y-6">
                                        {formData.languages.length === 0 ? (
                                            <p className="text-gray-500 text-sm mb-4">No languages added yet.</p>
                                        ) : (
                                            formData.languages.map((lang, langIndex) => (
                                                <div key={langIndex} className="flex gap-4 items-start">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Language
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={lang.language}
                                                                onChange={(e) => updateLanguage(langIndex, 'language', e.target.value)}
                                                                placeholder="English, Spanish, etc."
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Proficiency
                                                            </label>
                                                            <select
                                                                value={lang.proficiency}
                                                                onChange={(e) => updateLanguage(langIndex, 'proficiency', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                <option value="Native">Native</option>
                                                                <option value="Fluent">Fluent</option>
                                                                <option value="Professional">Professional</option>
                                                                <option value="Intermediate">Intermediate</option>
                                                                <option value="Basic">Basic</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLanguage(langIndex)}
                                                        className="text-red-500 hover:text-red-700 mt-8"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}

                                        <button
                                            type="button"
                                            onClick={addLanguage}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Language
                                        </button>
                                    </div>
                                </CollapsibleSection>

                                {/* VOLUNTEER EXPERIENCE */}
                                <CollapsibleSection title="Volunteer Experience">
                                    <div className="space-y-6">
                                        {formData.volunteerExperience.length === 0 ? (
                                            <p className="text-gray-500 text-sm mb-4">No volunteer experience added yet.</p>
                                        ) : (
                                            formData.volunteerExperience.map((vol, volIndex) => (
                                                <div key={volIndex} className="border border-gray-200 rounded-lg p-6 relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVolunteer(volIndex)}
                                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                                                        Volunteer {volIndex + 1}
                                                    </h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Organization
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={vol.organization}
                                                                onChange={(e) => updateVolunteer(volIndex, 'organization', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Role
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={vol.role}
                                                                onChange={(e) => updateVolunteer(volIndex, 'role', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Start Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={vol.startDate}
                                                                onChange={(e) => updateVolunteer(volIndex, 'startDate', e.target.value)}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                End Date
                                                            </label>
                                                            <input
                                                                type="month"
                                                                value={vol.endDate}
                                                                onChange={(e) => updateVolunteer(volIndex, 'endDate', e.target.value)}
                                                                disabled={vol.current}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                            />
                                                            <label className="flex items-center mt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={vol.current}
                                                                    onChange={(e) => updateVolunteer(volIndex, 'current', e.target.checked)}
                                                                    className="mr-2"
                                                                />
                                                                <span className="text-sm text-gray-600">Currently volunteering</span>
                                                            </label>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Description
                                                            </label>
                                                            <textarea
                                                                value={vol.description}
                                                                onChange={(e) => updateVolunteer(volIndex, 'description', e.target.value)}
                                                                rows="3"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <button
                                            type="button"
                                            onClick={addVolunteer}
                                            className="w-full bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            + Add Volunteer Experience
                                        </button>
                                    </div>
                                </CollapsibleSection>

                                {/* INTERESTS */}
                                <CollapsibleSection title="Interests & Hobbies">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Interests (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.interests.join(', ')}
                                            onChange={(e) => {
                                                const interestsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                                setFormData(prev => ({ ...prev, interests: interestsArray }));
                                            }}
                                            placeholder="Photography, Hiking, Reading, Chess"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </CollapsibleSection>

                                {/* SUBMIT BUTTON */}
                                <div className="flex justify-end gap-4 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileSetup;