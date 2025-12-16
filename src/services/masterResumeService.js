import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const masterResumeService = {
    // Save master resume (raw text + parsed data)
    async saveMasterResume(userId, resumeData) {
        try {
            const masterResumeDoc = {
                rawText: resumeData.rawText, // Full resume as text
                parsedData: resumeData.parsedData, // Structured data from AI
                uploadDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                fileType: resumeData.fileType || 'text', // 'docx' or 'text'
            };

            await setDoc(doc(db, 'masterResumes', userId), masterResumeDoc);

            // Also cache locally
            localStorage.setItem(`masterResume_${userId}`, JSON.stringify(masterResumeDoc));

            return masterResumeDoc;
        } catch (error) {
            console.error('Error saving master resume:', error);
            throw error;
        }
    },

    // Get master resume
    async getMasterResume(userId) {
        try {
            // Try cache first
            const cached = localStorage.getItem(`masterResume_${userId}`);
            if (cached) {
                return JSON.parse(cached);
            }

            // Fetch from Firebase
            const docRef = doc(db, 'masterResumes', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Cache it
                localStorage.setItem(`masterResume_${userId}`, JSON.stringify(data));
                return data;
            }

            return null;
        } catch (error) {
            console.error('Error getting master resume:', error);
            throw error;
        }
    },

    // Update specific fields via chat
    async updateMasterResume(userId, updates) {
        try {
            const existing = await this.getMasterResume(userId);
            if (!existing) {
                throw new Error('No master resume found');
            }

            const updated = {
                ...existing,
                parsedData: {
                    ...existing.parsedData,
                    ...updates
                },
                lastUpdated: new Date().toISOString()
            };

            await setDoc(doc(db, 'masterResumes', userId), updated);
            localStorage.setItem(`masterResume_${userId}`, JSON.stringify(updated));

            return updated;
        } catch (error) {
            console.error('Error updating master resume:', error);
            throw error;
        }
    },

    // Check if user has master resume
    async hasMasterResume(userId) {
        try {
            const resume = await this.getMasterResume(userId);
            return !!resume;
        } catch (error) {
            return false;
        }
    }
};