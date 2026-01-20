import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const usageService = {
    /**
     * Add a usage record
     */
    async addUsage(userId, usageData) {
        if (!userId) return;

        try {
            const usageRef = collection(db, 'token_usage');
            await addDoc(usageRef, {
                userId,
                timestamp: Timestamp.now(),
                input_tokens: usageData.input_tokens || 0,
                output_tokens: usageData.output_tokens || 0,
                ...usageData
            });
        } catch (error) {
            console.error('Error adding usage:', error);
            // Don't throw, just log. Analytics failures shouldn't break the app.
        }
    },

    /**
     * Get usage history for a user
     */
    async getUsageHistory(userId) {
        if (!userId) return [];

        try {
            const usageRef = collection(db, 'token_usage');
            const q = query(
                usageRef,
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to ISO string for frontend consistency
                    timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
                };
            });
        } catch (error) {
            console.error('Error getting usage history:', error);
            return [];
        }
    }
};
