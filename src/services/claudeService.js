export const claudeService = {
    async generateResume(jobDescription, userProfile) {
        try {
            // Call our Vercel API route instead of Claude directly
            const response = await fetch('/api/generate-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobDescription,
                    userProfile
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
    },

    async checkATS(resumeText, jobDescription) {
        const jdKeywords = this.extractKeywords(jobDescription);
        const resumeKeywords = this.extractKeywords(resumeText);

        const matched = jdKeywords.filter(kw =>
            resumeKeywords.some(rk => rk.toLowerCase().includes(kw.toLowerCase()))
        );

        const score = Math.round((matched.length / jdKeywords.length) * 100);

        return {
            score,
            matchedKeywords: matched,
            missingKeywords: jdKeywords.filter(kw => !matched.includes(kw))
        };
    },

    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);

        return [...new Set(words)].slice(0, 20);
    }
};