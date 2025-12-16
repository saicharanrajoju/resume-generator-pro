const resumeParserService = {
    // Parse from uploaded file
    async parseResumeFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse resume');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Resume parsing error:', error);
            throw error;
        }
    },

    // Parse from pasted text
    async parseResumeText(resumeText) {
        try {
            const response = await fetch('/api/parse-resume-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resumeText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse resume');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Resume parsing error:', error);
            throw error;
        }
    }
};

export default resumeParserService;