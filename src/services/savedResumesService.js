import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

const savedResumesService = {
    async saveResume(userId, { company, role, atsScore, resumeData, masterParsedData, fileNameBase }) {
        const docRef = await addDoc(
            collection(db, 'savedResumes', userId, 'resumes'),
            {
                company: company.trim(),
                role: role.trim(),
                atsScore: atsScore || null,
                fileNameBase,
                resumeData,
                masterParsedData,
                savedAt: serverTimestamp()
            }
        );
        return docRef.id;
    },

    async getSavedResumes(userId) {
        const q = query(
            collection(db, 'savedResumes', userId, 'resumes'),
            orderBy('savedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async deleteResume(userId, resumeId) {
        await deleteDoc(doc(db, 'savedResumes', userId, 'resumes', resumeId));
    }
};

export default savedResumesService;
