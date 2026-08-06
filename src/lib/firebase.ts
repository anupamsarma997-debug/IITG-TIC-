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
export const isFirebaseConfigured = Boolean(
  apiKey &&
  projectId &&
  apiKey !== 'AIzaSyC4NBXm7XoJKGvh5JY4OSHK7NYco2ntJsM' &&
  projectId !== 'peak-ego-v224x'
);

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

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId;
    db = databaseId && databaseId !== '(default)' ? initializeFirestore(app, {}, databaseId) : getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.warn('Firebase initialization warning:', e);
  }
}

export { app, db, auth };
export const googleProvider = new GoogleAuthProvider();
export default app;


