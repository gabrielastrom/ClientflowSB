
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import type { KnowledgeBaseArticle as Article } from '@/lib/types';

function getDb() {
    if (!db) {
        throw new Error('Firestore has not been initialized');
    }
    return db;
}

function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
}

export function listenToArticles(callback: (articles: Article[]) => void): () => void {
    try {
        const unsubscribe = onSnapshot(collection(getDb(), 'knowledge-base'), (snapshot) => {
            if (snapshot.empty) {
                callback([]);
                return;
            }
            const list = snapshot.docs.map(doc => doc.data() as Article);
            callback(list);
        });
        return unsubscribe;
    } catch (error) {
        console.error("Error setting up articles listener: ", error);
        throw new Error("Could not listen to articles.");
    }
}

export async function addArticle(articleData: Omit<Article, 'id' | 'slug'>): Promise<Article> {
    try {
        const dbInstance = getDb();
        const newId = doc(collection(dbInstance, 'knowledge-base')).id;
        const slug = createSlug(articleData.title);
        const newArticle: Article = { ...articleData, id: newId, slug };
        await setDoc(doc(dbInstance, "knowledge-base", newId), newArticle);
        return newArticle;
    } catch (error) {
        console.error("Error adding article: ", error);
        throw new Error("Failed to add article.");
    }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const q = query(collection(getDb(), 'knowledge-base'), where("slug", "==", slug));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log('No matching article found.');
            return null;
        }
        return snapshot.docs[0].data() as Article;
    } catch (error) {
        console.error("Error fetching article by slug: ", error);
        throw new Error("Could not fetch article.");
    }
}

export async function updateArticle(article: Article): Promise<void> {
    try {
        // If the title changed, the slug might need to change.
        const newSlug = createSlug(article.title);
        const articleWithSlug = { ...article, slug: newSlug };
        const articleRef = doc(getDb(), "knowledge-base", article.id);
        await setDoc(articleRef, articleWithSlug, { merge: true });
    } catch (error) {
        console.error("Error updating article: ", error);
        throw new Error("Failed to update article.");
    }
}

export async function deleteArticle(articleId: string): Promise<void> {
    try {
        await deleteDoc(doc(getDb(), "knowledge-base", articleId));
    } catch (error) {
        console.error("Error deleting article: ", error);
        throw new Error("Failed to delete article.");
    }
}
