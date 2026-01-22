import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Legacy service object - kept for backward compatibility
export const masterResumeService = {
    /**
     * Get master resume for a user
     */
    async getMasterResume(userId) {
        if (!userId) {
            console.error('No userId provided to getMasterResume');
            return null;
        }

        try {
            // Check localStorage cache first
            const cached = localStorage.getItem(`masterResume_${userId}`);
            if (cached) {
                return JSON.parse(cached);
            }

            // Fetch from Firestore
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
            return null;
        }
    },

    /**
     * Save master resume
     */
    async saveMasterResume(userId, masterResumeData) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        try {
            const docRef = doc(db, 'masterResumes', userId);
            await setDoc(docRef, masterResumeData);

            // Update cache
            localStorage.setItem(`masterResume_${userId}`, JSON.stringify(masterResumeData));

            return masterResumeData;
        } catch (error) {
            console.error('Error saving master resume:', error);
            throw error;
        }
    },

    /**
     * Update existing master resume with profile data
     */
    async updateMasterResume(userId, updates) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        try {
            // Get existing master resume
            const existing = await this.getMasterResume(userId);

            if (!existing) {
                throw new Error('No master resume found to update');
            }

            // Deep merge updates
            const updated = {
                ...existing,
                parsedData: {
                    ...existing.parsedData,
                    personalInfo: {
                        ...existing.parsedData.personalInfo,
                        ...updates.personalInfo,
                        address: {
                            ...existing.parsedData.personalInfo?.address,
                            ...updates.personalInfo?.address
                        }
                    },
                    onlinePresence: {
                        ...existing.parsedData.onlinePresence,
                        ...updates.onlinePresence
                    },
                    education: updates.education || existing.parsedData.education
                },
                uploadDate: new Date().toISOString() // Update timestamp
            };

            // Save to Firestore
            const docRef = doc(db, 'masterResumes', userId);
            await setDoc(docRef, updated);

            // Update cache
            localStorage.setItem(`masterResume_${userId}`, JSON.stringify(updated));

            return updated;

        } catch (error) {
            console.error('Error updating master resume:', error);
            throw error;
        }
    },

    /**
     * Update specific profile fields
     */
    async updateProfileFields(userId, fieldUpdates) {
        const updates = {
            personalInfo: {},
            onlinePresence: {},
            education: null
        };

        // Zipcode
        if (fieldUpdates.zipcode) {
            updates.personalInfo.address = { zipCode: fieldUpdates.zipcode };
        }

        // LinkedIn
        if (fieldUpdates.linkedinShort) {
            updates.onlinePresence.linkedin = `https://linkedin.com/in/${fieldUpdates.linkedinShort}`;
        }

        // Education fields
        if (fieldUpdates.educationFields) {
            const existing = await this.getMasterResume(userId);
            updates.education = existing.parsedData.education?.map((edu, index) => ({
                ...edu,
                field: fieldUpdates.educationFields[index] || edu.field
            }));
        }

        return await this.updateMasterResume(userId, updates);
    }
};

// ==========================================
// NEW SCHEMA FUNCTIONS (Hybrid Approach)
// ==========================================

export const saveMasterResumeRawText = async (userId, resumeText) => {
    try {
        const masterResumeRef = doc(db, 'users', userId, 'masterResume', 'data');

        await setDoc(masterResumeRef, {
            rawText: resumeText,
            meta: {
                uploadedAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                version: '2.0',
                processingStatus: 'pending'
            }
        }, { merge: true });  // merge: true preserves existing fields

        return { success: true };
    } catch (error) {
        console.error('Error saving resume:', error);
        return { success: false, error: error.message };
    }
};

export const updateProcessingStatus = async (userId, status) => {
    try {
        const masterResumeRef = doc(db, 'users', userId, 'masterResume', 'data');

        await setDoc(masterResumeRef, {
            meta: {
                processingStatus: status,
                lastUpdated: serverTimestamp()
            }
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error updating status:', error);
        return { success: false, error: error.message };
    }
};

export const loadMasterResume = async (userId) => {
    try {
        const masterResumeRef = doc(db, 'users', userId, 'masterResume', 'data');
        const docSnap = await getDoc(masterResumeRef);

        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'No master resume found' };
        }
    } catch (error) {
        console.error('Error loading resume:', error);
        return { success: false, error: error.message };
    }
};

export const testFirebaseSave = async (userId) => {
    try {
        console.log('Testing Firebase with userId:', userId);
        const testRef = doc(db, 'users', userId, 'test', 'data');
        await setDoc(testRef, { test: 'Hello', timestamp: serverTimestamp() });
        console.log('✅ Test write successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Test write failed:', error);
        return { success: false, error: error.message };
    }
};

export const saveProcessedResume = async (userId, understanding, structured) => {
    try {
        const masterResumeRef = doc(db, 'users', userId, 'masterResume', 'data');

        await setDoc(masterResumeRef, {
            understanding: understanding,
            structured: structured,
            meta: {
                processingStatus: 'complete',
                lastUpdated: serverTimestamp()
            }
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error saving processed resume:', error);
        return { success: false, error: error.message };
    }
};

export const updateMasterResume = async (userId, updatedData) => {
    try {
        const masterResumeRef = doc(db, 'users', userId, 'masterResume', 'data');

        await setDoc(masterResumeRef, {
            understanding: updatedData.understanding,
            structured: updatedData.structured,
            meta: {
                lastUpdated: serverTimestamp()
            }
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error updating resume:', error);
        return { success: false, error: error.message };
    }
};