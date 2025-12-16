export const initialProfileState = {
    // Personal Information
    personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
            city: '',
            state: '',
            country: ''
        }
    },

    // Online Presence
    onlinePresence: {
        linkedin: '',
        github: '',
        portfolio: '',
        website: ''
    },

    // Professional Summary
    professionalSummary: '',

    // Work Experience (at least 1 required)
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

    // Education
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

    // Skills
    skills: {
        technical: [],
        soft: []
    },

    // Projects
    projects: [],

    // Certifications
    certifications: [],

    // Awards
    awards: [],

    // Publications
    publications: [],

    // Volunteer Experience
    volunteerExperience: [],

    // Languages
    languages: [],

    // Professional Memberships
    memberships: [],

    // Interests
    interests: []
};

export const emptyWorkExperience = {
    company: '',
    position: '',
    employmentType: 'Full-time',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: ['']
};

export const emptyEducation = {
    institution: '',
    degree: '',
    fieldOfStudy: '',
    gpa: '',
    startDate: '',
    endDate: '',
    location: ''
};

export const emptyProject = {
    name: '',
    description: '',
    technologies: [],
    startDate: '',
    endDate: '',
    current: false,
    githubLink: '',
    liveLink: ''
};

export const emptyCertification = {
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: ''
};

export const emptyAward = {
    title: '',
    issuer: '',
    date: '',
    description: ''
};

export const emptyPublication = {
    title: '',
    publisher: '',
    date: '',
    url: '',
    description: ''
};

export const emptyVolunteer = {
    organization: '',
    role: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
};

export const emptyLanguage = {
    language: '',
    proficiency: 'Intermediate'
};

export const emptyMembership = {
    organization: '',
    role: '',
    startDate: '',
    current: false
};