export const claudeService = {
    async generateTailoredResume(masterResume, jobDescription, summary, skills, experience) {
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
                    userProvidedExperience: experience
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

    async refineResume(currentResume, refinementRequest, jobDescription, masterResume) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

        try {
            const response = await fetch('/api/refine-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentResume,
                    refinementRequest,
                    jobDescription,
                    masterResume
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('Failed to refine resume');
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
};