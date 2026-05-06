export const claudeService = {
    async generateTailoredResume(masterResume, jobDescription, summary, skills, experience, projects) {
        try {
            const response = await fetch('/api/generate-tailored-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parsedData: masterResume.parsedData,
                    jobDescription: jobDescription,
                    userProvidedSummary: summary,
                    userProvidedSkills: skills,
                    userProvidedExperience: experience,
                    userProvidedProjects: projects
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate resume');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating tailored resume:', error);
            throw error;
        }
    },

};