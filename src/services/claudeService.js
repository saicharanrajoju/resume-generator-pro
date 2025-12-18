export const claudeService = {
    // New method for master resume system
    async generateTailoredResume(jobDescription, masterResume) {
        try {
            const response = await fetch('/api/generate-tailored-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobDescription,
                    masterResumeText: masterResume.rawText,
                    parsedData: masterResume.parsedData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API error');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }
};