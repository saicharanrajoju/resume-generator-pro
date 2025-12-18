import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

function MasterResumeEditor({ masterResume, onSave }) {
    const [formData, setFormData] = useState(masterResume.parsedData);
    const [additionalInstructions, setAdditionalInstructions] = useState(
        masterResume.additionalInstructions || ''
    );

    // Collapsible state
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        experience: false,
        projects: false,
        education: false,
        additional: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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

    const updateWorkExperience = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((job, i) =>
                i === index ? { ...job, [field]: value } : job
            )
        }));
    };

    const updateProject = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            projects: prev.projects.map((project, i) =>
                i === index ? { ...project, [field]: value } : project
            )
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

    const handleSave = () => {
        const updatedResume = {
            ...masterResume,
            parsedData: formData,
            additionalInstructions
        };
        onSave(updatedResume);
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                📄 Master Resume Details
            </h2>
            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Personal Information */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('personal')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900"
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.personalInfo.firstName || ''}
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
                                value={formData.personalInfo.lastName || ''}
                                onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.personalInfo.email || ''}
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
                                value={formData.personalInfo.phone || ''}
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
                                    value={formData.personalInfo.address?.city || ''}
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
                                    value={formData.personalInfo.address?.state || ''}
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
                                    value={formData.personalInfo.address?.zipCode || ''}
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
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900"
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
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                    Job {index + 1}: {job.position} at {job.company}
                                </p>

                                <div className="space-y-3">
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
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Projects */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('projects')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900"
                >
                    {expandedSections.projects ? (
                        <ChevronDown className="w-5 h-5 mr-2" />
                    ) : (
                        <ChevronRight className="w-5 h-5 mr-2" />
                    )}
                    Projects ({formData.projects?.length || 0} projects)
                </button>

                {expandedSections.projects && (
                    <div className="ml-7 space-y-4">
                        {formData.projects?.map((project, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                    {project.name}
                                </p>

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
                        ))}
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Education */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('education')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900"
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
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">
                                    School {index + 1}: {edu.school}
                                </p>

                                <div className="space-y-3">
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
                                            Relevant Coursework <span className="text-gray-500 text-xs">(optional)</span>
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
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-200 mb-6"></div>

            {/* Additional Instructions */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('additional')}
                    className="flex items-center w-full text-left text-lg font-medium text-gray-700 mb-4 hover:text-gray-900"
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
                            placeholder="Example:
- Always use 'Python programming' instead of just 'Python'
- Emphasize 'database design' and 'data migration' for all data engineering roles
- Mention 'programming logic' in technical skills
- Use specific metrics from my experience (e.g., 120M+ records, 99.8% accuracy)"
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
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                    💾 Save All Changes
                </button>
            </div>
        </div>
    );
}

export default MasterResumeEditor;