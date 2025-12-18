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
                // Prefer specific message over generic error
                const errorMessage = errorData.message || errorData.error || 'API error';
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }
};