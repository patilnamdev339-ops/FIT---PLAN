import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY = "fitplan_firebase_config";

// Read from env or local override
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envKey && envProject) {
    return {
      apiKey: envKey,
      authDomain: envDomain || `${envProject}.firebaseapp.com`,
      projectId: envProject,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!appInstance) {
      if (getApps().length > 0) {
        appInstance = getApp();
      } else {
        appInstance = initializeApp(config);
      }
    }
    if (!authInstance && appInstance) {
      authInstance = getAuth(appInstance);
    }
    return authInstance;
  } catch (err) {
    console.error("Failed to initialize Firebase Auth:", err);
    return null;
  }
}

/**
 * Triggers Google Sign-In Popup via Firebase
 */
export async function signInWithGoogle(): Promise<{
  idToken: string;
  user: FirebaseUser;
}> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase is not configured yet. Please configure your Firebase credentials.",
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

/**
 * Signs in with Firebase Email & Password
 */
export async function signInWithFirebaseEmail(
  email: string,
  pass: string,
): Promise<{
  idToken: string;
  user: FirebaseUser;
}> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase is not configured yet.");
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

/**
 * Creates user with Firebase Email & Password
 */
export async function registerWithFirebaseEmail(
  email: string,
  pass: string,
  displayName: string,
): Promise<{
  idToken: string;
  user: FirebaseUser;
}> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase is not configured yet.");
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}
