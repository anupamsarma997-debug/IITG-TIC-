import admin from 'firebase-admin';

let initialized = false;

export function getFirebaseAdmin() {
  if (!initialized) {
    if (admin.apps && admin.apps.length > 0) {
      initialized = true;
      return admin;
    }

    // Prefer explicit service account JSON stored in FIREBASE_SERVICE_ACCOUNT env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(sa),
        });
        initialized = true;
        return admin;
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
        throw e;
      }
    }

    // Fall back to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      initialized = true;
      return admin;
    }

    throw new Error('Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  return admin;
}

export async function verifyIdTokenFromHeader(authorizationHeader?: string) {
  if (!authorizationHeader) throw new Error('Missing Authorization header');
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') throw new Error('Invalid Authorization header format');
  const idToken = parts[1];
  const adminSdk = getFirebaseAdmin();
  return adminSdk.auth().verifyIdToken(idToken);
}
