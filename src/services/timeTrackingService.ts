
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { TimeEntry } from '@/lib/types';

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
    try {
        const snapshot = await getDocs(collection(getDb(), 'time-entries'));
        if (snapshot.empty) {
            console.log('No time entries found in Firestore.');
            return [];
        }
        const list = snapshot.docs.map(doc => doc.data() as TimeEntry);
        // Filter out entries without a date before sorting
        return list
            .filter(entry => entry.date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("Error fetching time entries: ", error);
        throw new Error("Could not fetch time entries.");
    }
}

export async function addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    try {
        const dbInstance = getDb();
        const newId = doc(collection(dbInstance, 'time-entries')).id;
        const newEntry: TimeEntry = { ...entry, id: newId };
        await setDoc(doc(dbInstance, "time-entries", newId), newEntry);
        return newEntry;
    } catch (error) {
        console.error("Error adding time entry: ", error);
        throw new Error("Failed to add time entry.");
    }
}

export async function updateTimeEntry(entry: TimeEntry): Promise<void> {
    try {
        const entryRef = doc(getDb(), "time-entries", entry.id);
        await setDoc(entryRef, entry, { merge: true });
    } catch (error) {
        console.error("Error updating time entry: ", error);
        throw new Error("Failed to update time entry.");
    }
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "time-entries", entryId));
    } catch (error) {
        console.error("Error deleting time entry: ", error);
        throw new Error("Failed to delete time entry.");
    }
}

    
