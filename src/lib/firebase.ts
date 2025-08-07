import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

// Initialize Firebase only in the browser and when config is available
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured()) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  } else {
    console.error(
      "Firebase configuration is missing. Please set the NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
}

export { app, db, auth, storage };
