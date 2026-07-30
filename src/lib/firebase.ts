import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

// Initialize Firebase
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use named firestore database ID from firebase-applet-config.json if specified
export const db = config.firestoreDatabaseId
  ? initializeFirestore(app, {}, config.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export default app;
