import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

function getAuthInstance() {
  if (!auth) {
    throw new Error("Firebase Auth has not been initialized");
  }
  return auth;
}

export async function signUp(
  email: string,
  password: string
): Promise<void> {
  await createUserWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function signIn(
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(getAuthInstance(), provider);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuthInstance());
}
