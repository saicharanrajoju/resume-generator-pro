export const claudeService = {
    async generateTailoredResume(jobDescription, masterResume) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

        try {
            const response = await fetch('/api/generate-tailored-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobDescription,
                    masterResumeText: masterResume.rawText,
                    parsedData: masterResume.parsedData,
                    userId: masterResume.userId
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.message || errorData.error || 'Failed to generate resume');
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
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