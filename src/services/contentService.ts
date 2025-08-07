import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Content } from '@/lib/types';

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

export async function getContent(): Promise<Content[]> {
    try {
        const snapshot = await getDocs(collection(getDb(), 'content'));
        if (snapshot.empty) {
            console.log('No content found in Firestore.');
            return [];
        }
        const list = snapshot.docs.map(doc => doc.data() as Content);
        return list;
    } catch (error) {
        console.error("Error fetching content: ", error);
        throw new Error("Could not fetch content.");
    }
}

export async function addContent(content: Omit<Content, 'id'>): Promise<Content> {
    try {
        const dbInstance = getDb();
        const newId = doc(collection(dbInstance, 'content')).id;
        const newContent: Content = { ...content, id: newId };
        await setDoc(doc(dbInstance, "content", newId), newContent);
        return newContent;
    } catch (error) {
        console.error("Error adding content: ", error);
        throw new Error("Failed to add content.");
    }
}

export async function updateContent(content: Content): Promise<void> {
    try {
        const contentRef = doc(getDb(), "content", content.id);
        await setDoc(contentRef, content, { merge: true });
    } catch (error) {
        console.error("Error updating content: ", error);
        throw new Error("Failed to update content.");
    }
}

export async function deleteContent(contentId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "content", contentId));
    } catch (error) {
        console.error("Error deleting content: ", error);
        throw new Error("Failed to delete content.");
    }
}
