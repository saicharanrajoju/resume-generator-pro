import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const profileService = {
    // Get user profile
    async getProfile(userId) {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    },

    // Save user profile
    async saveProfile(userId, profileData) {
        try {
            const docRef = doc(db, 'users', userId);
            await setDoc(docRef, {
                ...profileData,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Also save to localStorage for offline access
            localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));

            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    },

    // Get from localStorage (cache)
    getLocalProfile(userId) {
        const cached = localStorage.getItem(`profile_${userId}`);
        return cached ? JSON.parse(cached) : null;
    }
};