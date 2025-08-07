
import { db, storage, auth } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import type { TeamMember } from '@/lib/types';
import { type User, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

function getStorage() {
    if (!storage) {
        throw new Error('Storage has not been initialized');
    }
    return storage;
}

function getAuthInstance() {
    if (!auth) {
        throw new Error('Auth has not been initialized');
    }
    return auth;
}

export function listenToTeamMembers(callback: (team: TeamMember[]) => void): () => void {
    try {
        const teamCol = collection(getDb(), 'team');
        const unsubscribe = onSnapshot(teamCol, (teamSnapshot) => {
            if (teamSnapshot.empty) {
                console.log('No team members found in Firestore.');
                callback([]);
                return;
            }
            const teamList = teamSnapshot.docs.map(doc => doc.data() as TeamMember);
            callback(teamList);
        });
        return unsubscribe;
    } catch (error) {
        console.error("Error setting up team members listener: ", error);
        throw new Error("Could not listen to team members.");
    }
}

export async function upsertTeamMemberFromUser(user: User): Promise<void> {
    try {
        const teamMemberRef = doc(getDb(), "team", user.uid);
        const docSnap = await getDoc(teamMemberRef);

        if (!docSnap.exists()) {
            const newTeamMember: TeamMember = {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'New User',
                email: user.email || '',
                phone: user.phoneNumber || '',
                role: 'Kreatör', // Default role
                assignedClients: [],
                hourlyRate: 150, // Default hourly rate
                photoURL: user.photoURL || '',
            };
            await setDoc(teamMemberRef, newTeamMember);
        } else {
            // Update photoURL if it's different
            const currentData = docSnap.data() as TeamMember;
            if (user.photoURL && user.photoURL !== currentData.photoURL) {
                await setDoc(teamMemberRef, { photoURL: user.photoURL }, { merge: true });
            }
        }
    } catch (error) {
        console.error("Error upserting team member: ", error);
        throw new Error("Failed to upsert team member.");
    }
}


export async function updateTeamMember(teamMember: TeamMember): Promise<void> {
    try {
        const teamMemberRef = doc(getDb(), "team", teamMember.id);
        await setDoc(teamMemberRef, teamMember, { merge: true });
    } catch (error) {
        console.error("Error updating team member: ", error);
        throw new Error("Failed to update team member.");
    }
}

export async function deleteTeamMember(teamMemberId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "team", teamMemberId));
    } catch (error) {
        console.error("Error deleting team member: ", error);
        throw new Error("Failed to delete team member.");
    }
}

export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
    const currentUser = getAuthInstance().currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        throw new Error("Authentication error: User is not authorized to perform this action.");
    }
    
    try {
        const storageRef = ref(getStorage(), `profile-pictures/${userId}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update Firebase Auth user profile
        await updateProfile(currentUser, { photoURL: downloadURL });
        
        // Update Firestore team member document
        const teamMemberRef = doc(getDb(), "team", userId);
        await setDoc(teamMemberRef, { photoURL: downloadURL }, { merge: true });

        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile picture: ", error);
        throw new Error("Failed to upload profile picture.");
    }
}
