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

const firebaseConfig = {
  apiKey: apiKey || 'AIzaSyC4NBXm7XoJKGvh5JY4OSHK7NYco2ntJsM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain || 'peak-ego-v224x.firebaseapp.com',
  projectId: projectId || 'peak-ego-v224x',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket || 'peak-ego-v224x.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId || '514524067934',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId || '1:514524067934:web:82e09fc2948bd107d89ccf',
};

let app: any;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initializeApp warning:', e);
  app = getApps().length ? getApp() : initializeApp({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
  }, 'fallback-app');
}

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId;

export let db: any;
try {
  db = databaseId && databaseId !== '(default)' ? initializeFirestore(app, {}, databaseId) : getFirestore(app);
} catch (e) {
  try {
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firestore initialization warning:', err);
  }
}

export let auth: any;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn('Auth initialization warning:', e);
}

export const googleProvider = new GoogleAuthProvider();
export default app;


