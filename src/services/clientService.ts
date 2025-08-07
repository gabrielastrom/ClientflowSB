import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Client } from '@/lib/types';

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

export async function getClients(): Promise<Client[]> {
    try {
        const clientSnapshot = await getDocs(collection(getDb(), 'clients'));
        if (clientSnapshot.empty) {
            console.log('No clients found in Firestore.');
            return [];
        }
        const clientList = clientSnapshot.docs.map(doc => doc.data() as Client);
        return clientList;
    } catch (error) {
        console.error("Error fetching clients: ", error);
        throw new Error("Could not fetch clients from the database.");
    }
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
    try {
        const dbInstance = getDb();
        const newId = doc(collection(dbInstance, 'clients')).id;
        const newClient: Client = { ...client, id: newId };
        await setDoc(doc(dbInstance, "clients", newId), newClient);
        return newClient;
    } catch (error) {
        console.error("Error adding client: ", error);
        throw new Error("Failed to add client.");
    }
}

export async function updateClient(client: Client): Promise<void> {
    try {
        const clientRef = doc(getDb(), "clients", client.id);
        await setDoc(clientRef, client, { merge: true });
    } catch (error) {
        console.error("Error updating client: ", error);
        throw new Error("Failed to update client.");
    }
}

export async function deleteClient(clientId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "clients", clientId));
    } catch (error) {
        console.error("Error deleting client: ", error);
        throw new Error("Failed to delete client.");
    }
}
