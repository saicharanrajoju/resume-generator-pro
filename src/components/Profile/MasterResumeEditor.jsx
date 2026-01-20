import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import resumeParserService from '../../services/resumeParserService';

function MasterResumeEditor({ masterResume, onSave }) {
    // Transform Firebase data structure to editor structure
    const transformToEditorFormat = (data) => {
        if (!data) return data;

        return {
            ...data,
            education: data.education?.map(edu => ({
                school: edu.institution || edu.school || '',
                degree: edu.degree || '',
                field: edu.fieldOfStudy || edu.field || '',
                year: edu.endDate || edu.year || '',
                gpa: edu.gpa || '',
                relevantCoursework: edu.relevantCoursework || ''
            })) || [],
            workExperience: data.workExperience?.map(job => ({
                position: job.position || '',
                company: job.company || '',
                location: job.location || '',
                period: job.period || (job.startDate && job.endDate ? `${job.startDate} - ${job.endDate}` : ''),
                achievements: job.achievements || job.responsibilities || []
            })) || [],
            projects: data.projects?.map(project => ({
                name: project.name || '',
                date: project.date || (project.endDate ? project.endDate : ''),
                description: project.description || '',
                technologies: project.technologies || []
            })) || [],
            certifications: data.certifications?.map(cert => ({
                name: cert.name || '',
                date: cert.date || cert.year || ''
            })) || []
        };
    };

    //Transform editor format back to Firebase format for saving
    const transformToFirebaseFormat = (editorData) => {
        return {
            ...editorData,
            education: editorData.education?.map(edu => ({
                institution: edu.school,
                degree: edu.degree,
                fieldOfStudy: edu.field,
                endDate: edu.year,
                gpa: edu.gpa,
                relevantCoursework: edu.relevantCoursework,
                startDate: ''
            })) || [],
            workExperience: editorData.workExperience?.map(job => {
                const periodParts = job.period?.split(' - ') || [];
                return {
                    company: job.company,
                    position: job.position,
                    location: job.location,
                    startDate: periodParts[0] || '',
                    endDate: periodParts[1] || '',
                    responsibilities: Array.isArray(job.achievements) ? job.achievements : (job.achievements?.split('\n') || []),
                    employmentType: 'Full-time'
                };
            }) || [],
            projects: editorData.projects?.map(project => ({
                name: project.name,
                description: project.description,
                technologies: Array.isArray(project.technologies)
                    ? project.technologies
                    : (project.technologies?.split(',').map(t => t.trim()) || []),
                startDate: '',
                endDate: project.date || ''
            })) || [],
            certifications: editorData.certifications?.map(cert => ({
                name: cert.name,
                date: cert.date
            })) || []
        };
    };

    const [formData, setFormData] = useState(transformToEditorFormat(masterResume.parsedData));
    const [additionalInstructions, setAdditionalInstructions] = useState(
        masterResume.additionalInstructions || ''
    );
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRef = useRef(null);

    // Collapsible state
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        experience: false,
        projects: false,
        certifications: false,
        education: false,
        additional: false
    });

    // Auto-dismiss messages
    useEffect(() => {
        if (validationError) {
            const timer = setTimeout(() => setValidationError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [validationError]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setValidationError('');
            setSuccessMessage('');

            const parsedData = await resumeParserService.parseResumeFile(file);
            setFormData(transformToEditorFormat(parsedData));
            setSuccessMessage('Resume uploaded and parsed successfully! Please review changes and save.');
            
            // Expand all sections to show new data
            setExpandedSections({
                personal: true,
                experience: true,
                projects: true,
                certifications: true,
                education: true,
                additional: true
            });
            
        } catch (error) {
            console.error('Upload error:', error);
            setValidationError('Failed to parse resume. Please ensure it is a valid DOCX file.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Personal Info Updates
    const updatePersonalInfo = (field, value) => {
        setFormData(prev => ({
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                [field]: value
            }
        }));
    };

    const updateAddress = (field, value) => {
        setFormData(prev => ({
            ...prev,
            personalInfo: {
                ...prev.personalInfo,
                address: {
                    ...prev.personalInfo.address,
                    [field]: value
                }
            }
        }));
    };

    // Work Experience CRUD
    const updateWorkExperience = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((job, i) =>
                i === index ? { ...job, [field]: value } : job
            )
        }));
    };

    const addWorkExperience = () => {
        setFormData(prev => ({
            ...prev,
            workExperience: [
                ...(prev.workExperience || []),
                {
                    position: '',
                    company: '',
                    location: '',
                    period: '',
                    achievements: ''
                }
            ]
        }));
        setExpandedSections(prev => ({ ...prev, experience: true }));
    };

    const deleteWorkExperience = (index) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.filter((_, i) => i !== index)
        }));
    };

    // Projects CRUD
    const updateProject = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.map((project, i) =>
                i === index ? { ...project, [field]: value } : project
            )
        }));
    };

    const addProject = () => {
        setFormData(prev => ({
            ...prev,
            projects: [
                ...(prev.projects || []),
                {
                    name: '',
                    date: '',
                    description: '',
                    technologies: ''
                }
            ]
        }));
        setExpandedSections(prev => ({ ...prev, projects: true }));
    };

    const deleteProject = (index) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };

    // Education CRUD
    const updateEducation = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.map((edu, i) =>
                i === index ? { ...edu, [field]: value } : edu
            )
        }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [
                ...(prev.education || []),
                {
                    school: '',
                    degree: '',
                    field: '',
                    year: '',
                    gpa: '',
                    relevantCoursework: ''
                }
            ]
        }));
        setExpandedSections(prev => ({ ...prev, education: true }));
    };

    const deleteEducation = (index) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Certifications CRUD
    const updateCertification = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            certifications: (prev.certifications || []).map((cert, i) =>
                i === index ? { ...cert, [field]: value } : cert
            )
        }));
    };

    const addCertification = () => {
        setFormData(prev => ({
            ...prev,
            certifications: [
                ...(prev.certifications || []),
                { name: '', date: '' }
            ]
        }));
        setExpandedSections(prev => ({ ...prev, certifications: true }));
    };

    const deleteCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: (prev.certifications || []).filter((_, i) => i !== index)
        }));
    };

    // Validation
    const validateForm = () => {
        const { personalInfo } = formData;

        if (!personalInfo?.firstName?.trim()) {
            return 'First Name is required';
        }
        if (!personalInfo?.lastName?.trim()) {
            return 'Last Name is required';
        }
        if (!personalInfo?.email?.trim()) {
            return 'Email is required';
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personalInfo.email)) {
            return 'Please enter a valid email address';
        }

        if (!personalInfo?.phone?.trim()) {
            return 'Phone is required';
        }

        return null;
    };

    // Save Handler
    const handleSave = async () => {
        setValidationError('');
        setSuccessMessage('');

        const error = validateForm();
        if (error) {
            setValidationError(error);
            return;
        }

        setSaving(true);
        try {
            const updatedResume = {
                ...masterResume,
                parsedData: transformToFirebaseFormat(formData),
                additionalInstructions
            };
            await onSave(updatedResume);
            setSuccessMessage('✓ Changes saved successfully!');
        } catch (err) {
            setValidationError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                        📄 Master Resume Editor
                    </h2>
                    <p className="text-sm text-gray-600">
                        Edit your master resume details. All changes will be saved to your account.
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        accept=".docx"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? 'Parsing...' : 'Upload New Resume'}
                    </button>
                </div>
            </div>

            {/* Toast Messages */}
            {validationError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    ❌ {validationError}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Personal Information */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('personal')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.personal ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Personal Information
                </button>

                {expandedSections.personal && (
                    <div className="ml-7 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.personalInfo?.firstName || ''}
                                    onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.personalInfo?.lastName || ''}
                                    onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.personalInfo?.email || ''}
                                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.personalInfo?.phone || ''}
                                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.personalInfo?.address?.city || ''}
                                    onChange={(e) => updateAddress('city', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State
                                </label>
                                <input
                                    type="text"
                                    value={formData.personalInfo?.address?.state || ''}
                                    onChange={(e) => updateAddress('state', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Zipcode
                                </label>
                                <input
                                    type="text"
                                    value={formData.personalInfo?.address?.zipCode || ''}
                                    onChange={(e) => updateAddress('zipCode', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                LinkedIn URL
                            </label>
                            <input
                                type="url"
                                value={formData.onlinePresence?.linkedin || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    onlinePresence: { ...prev.onlinePresence, linkedin: e.target.value }
                                }))}
                                placeholder="https://linkedin.com/in/yourname"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Work Experience */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('experience')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.experience ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Work Experience ({formData.workExperience?.length || 0} jobs)
                </button>

                {expandedSections.experience && (
                    <div className="ml-7 space-y-6">
                        {formData.workExperience?.map((job, index) => (
                            <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative">
                                <button
                                    onClick={() => deleteWorkExperience(index)}
                                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Delete this job"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <p className="text-sm font-semibold text-gray-700 mb-4">
                                    Job {index + 1}
                                </p>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Position
                                            </label>
                                            <input
                                                type="text"
                                                value={job.position || ''}
                                                onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                                                placeholder="Software Engineer"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Company
                                            </label>
                                            <input
                                                type="text"
                                                value={job.company || ''}
                                                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                                placeholder="Company Name"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={job.location || ''}
                                                onChange={(e) => updateWorkExperience(index, 'location', e.target.value)}
                                                placeholder="Remote / City, State"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Period
                                            </label>
                                            <input
                                                type="text"
                                                value={job.period || ''}
                                                onChange={(e) => updateWorkExperience(index, 'period', e.target.value)}
                                                placeholder="June 2023 - July 2024"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Achievements <span className="text-gray-500 text-xs">(one per line)</span>
                                        </label>
                                        <textarea
                                            value={Array.isArray(job.achievements) ? job.achievements.join('\n') : job.achievements || ''}
                                            onChange={(e) => updateWorkExperience(index, 'achievements', e.target.value)}
                                            placeholder="Built feature X using technology Y&#10;Improved performance by 50%&#10;Led team of 5 engineers"
                                            rows={6}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addWorkExperience}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Job
                        </button>
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Projects */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('projects')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.projects ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Projects ({formData.projects?.length || 0} projects)
                </button>

                {expandedSections.projects && (
                    <div className="ml-7 space-y-6">
                        {formData.projects?.map((project, index) => (
                            <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative">
                                <button
                                    onClick={() => deleteProject(index)}
                                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Delete this project"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <p className="text-sm font-semibold text-gray-700 mb-4">
                                    Project {index + 1}
                                </p>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Project Name
                                            </label>
                                            <input
                                                type="text"
                                                value={project.name || ''}
                                                onChange={(e) => updateProject(index, 'name', e.target.value)}
                                                placeholder="E-commerce Platform"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="text"
                                                value={project.date || ''}
                                                onChange={(e) => updateProject(index, 'date', e.target.value)}
                                                placeholder="January 2024 - May 2024"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={project.description || ''}
                                            onChange={(e) => updateProject(index, 'description', e.target.value)}
                                            placeholder="Developed a full-stack e-commerce platform with real-time inventory management..."
                                            rows={4}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Technologies <span className="text-gray-500 text-xs">(comma-separated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies || ''}
                                            onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                                            placeholder="React, Node.js, MongoDB, AWS"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addProject}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Project
                        </button>
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Certifications */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('certifications')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.certifications ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Certifications ({formData.certifications?.length || 0} certifications)
                </button>

                {expandedSections.certifications && (
                    <div className="ml-7 space-y-4">
                        {formData.certifications?.map((cert, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                <button
                                    onClick={() => deleteCertification(index)}
                                    className="absolute top-3 right-3 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Delete this certification"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-2 gap-4 pr-10">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Certification Name
                                        </label>
                                        <input
                                            type="text"
                                            value={cert.name || ''}
                                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                            placeholder="AWS Certified Solutions Architect"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="text"
                                            value={cert.date || ''}
                                            onChange={(e) => updateCertification(index, 'date', e.target.value)}
                                            placeholder="2025"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addCertification}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Certification
                        </button>
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Education */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('education')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.education ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Education ({formData.education?.length || 0} degrees)
                </button>

                {expandedSections.education && (
                    <div className="ml-7 space-y-6">
                        {formData.education?.map((edu, index) => (
                            <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative">
                                <button
                                    onClick={() => deleteEducation(index)}
                                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Delete this degree"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <p className="text-sm font-semibold text-gray-700 mb-4">
                                    Degree {index + 1}
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            School
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.school || ''}
                                            onChange={(e) => updateEducation(index, 'school', e.target.value)}
                                            placeholder="University Name"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Degree
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.degree || ''}
                                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                placeholder="Master of Science"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Field
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.field || ''}
                                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                                placeholder="Data Science"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                GPA
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.gpa || ''}
                                                onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                                placeholder="4.0/4.0"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Year
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.year || ''}
                                                onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                                placeholder="Expected May 2026"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Relevant Coursework <span className="text-gray-500 text-xs">(comma-separated, optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.relevantCoursework || ''}
                                            onChange={(e) => updateEducation(index, 'relevantCoursework', e.target.value)}
                                            placeholder="Deep Learning, Machine Learning, Data Modeling"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addEducation}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Degree
                        </button>
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Additional Instructions */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('additional')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900 transition-colors"
                >
                    {expandedSections.additional ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Additional Instructions for AI 📝
                </button>

                {expandedSections.additional && (
                    <div className="ml-7">
                        <textarea
                            value={additionalInstructions}
                            onChange={(e) => setAdditionalInstructions(e.target.value)}
                            placeholder="Example:&#10;- Always use 'Python programming' instead of just 'Python'&#10;- Emphasize 'database design' and 'data migration' for all data engineering roles&#10;- Mention 'programming logic' in technical skills&#10;- Use specific metrics from my experience (e.g., 120M+ records, 99.8% accuracy)"
                            rows={8}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            💡 These instructions will be sent to the AI when generating your tailored resumes
                        </p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        <>💾 Save All Changes</>
                    )}
                </button>
            </div>
        </div>
    );
}

export default MasterResumeEditor;