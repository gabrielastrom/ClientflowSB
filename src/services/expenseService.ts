
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import type { Expense } from '@/lib/types';

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

export function listenToExpenses(callback: (expenses: Expense[]) => void): () => void {
    try {
        const unsubscribe = onSnapshot(collection(getDb(), 'expenses'), (snapshot) => {
            if (snapshot.empty) {
                callback([]);
                return;
            }
            const list = snapshot.docs.map(doc => doc.data() as Expense);
            // Sort by month descending
            const sortedList = list.sort((a, b) => {
                const dateA = new Date(`1 ${a.month}`);
                const dateB = new Date(`1 ${b.month}`);
                return dateB.getTime() - dateA.getTime();
            });
            callback(sortedList);
        });
        return unsubscribe;
    } catch (error) {
        console.error("Error setting up expenses listener: ", error);
        throw new Error("Could not listen to expenses.");
    }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
        const dbInstance = getDb();
        const newId = doc(collection(dbInstance, 'expenses')).id;
        const newExpense: Expense = { ...expense, id: newId };
        await setDoc(doc(dbInstance, "expenses", newId), newExpense);
        return newExpense;
    } catch (error) {
        console.error("Error adding expense: ", error);
        throw new Error("Failed to add expense.");
    }
}

export async function updateExpense(expense: Expense): Promise<void> {
    try {
        const expenseRef = doc(getDb(), "expenses", expense.id);
        await setDoc(expenseRef, expense, { merge: true });
    } catch (error) {
        console.error("Error updating expense: ", error);
        throw new Error("Failed to update expense.");
    }
}

export async function deleteExpense(expenseId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "expenses", expenseId));
    } catch (error) {
        console.error("Error deleting expense: ", error);
        throw new Error("Failed to delete expense.");
    }
}
