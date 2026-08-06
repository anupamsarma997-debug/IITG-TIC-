import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Safely attempt to load firebase-applet-config.json if present
let config: Record<string, any> = {};
try {
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const keys = Object.keys(configs);
  if (keys.length > 0) {
    config = ((configs[keys[0]] as any).default || configs[keys[0]]) as Record<string, any>;
  }
} catch {
  // Config file omitted or ignored in Git
}

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId;

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = Boolean(apiKey && projectId);

const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain || '',
  projectId: projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId || '',
};

let app: any = null;
let db: any = null;
let auth: any = null;
let firebaseConfigError: string | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId;
    if (databaseId && databaseId !== '(default)') {
      try {
        db = getFirestore(app, databaseId);
      } catch {
        db = initializeFirestore(app, {}, databaseId);
      }
    } else {
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } catch (e: any) {
    firebaseConfigError = e?.message || String(e);
    console.error('Firebase initialization error:', e);
  }
} else {
  firebaseConfigError = 'Firebase configuration is missing or incomplete.';
}

export { app, db, auth, firebaseConfigError };
export const googleProvider = new GoogleAuthProvider();
export default app;


