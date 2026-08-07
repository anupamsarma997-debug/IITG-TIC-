# Firebase Emulator & Deployment (Firestore + Storage + Auth)

This document adds convenient local emulator configuration and explains how to deploy Firestore/Storage rules.

Files added
- `firebase.json` — references `firestore.rules` and `storage.rules` and configures local emulators (Firestore, Auth, Storage, Emulator UI).
- `.firebaserc` — placeholder for your Firebase project id. Replace `<YOUR_FIREBASE_PROJECT_ID>` with your actual project id.

Why this helps
- Run the Firebase Emulator locally to safely develop and test Storage uploads and Firestore reads/writes without touching production.
- Keep security rules in the repo and deploy them with the Firebase CLI when you're ready.

Quick setup

1. Install Firebase CLI (if not already):

   npm install -g firebase-tools

2. Log in and select your Firebase project:

   firebase login
   firebase use --add

   When prompted, pick the project that backs this app. This will write your project id into `.firebaserc`.

3. Start the emulators locally (Firestore, Auth, Storage + UI):

   firebase emulators:start

   - Emulator UI available at http://localhost:4000 (by default)
   - Firestore emulator: http://localhost:8080
   - Auth emulator: http://localhost:9099
   - Storage emulator: http://localhost:9199

Local development notes

- In local development you can set your Vite env variables in a `.env.local` file (not checked into Git):

  VITE_FIREBASE_API_KEY=demo
  VITE_FIREBASE_AUTH_DOMAIN=localhost
  VITE_FIREBASE_PROJECT_ID=demo-project
  VITE_FIREBASE_STORAGE_BUCKET=demo-bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=demo
  VITE_FIREBASE_APP_ID=demo

- If you want the app to talk to the emulators instead of production services, either:
  - Set the standard emulator environment variables before starting the app (the Firebase SDK will auto-detect when using the CLI emulators), or
  - In `src/lib/firebase.ts` wrap initialization to detect `process.env.FIREBASE_EMULATOR_HOST` and call the emulator-specific `connect` helpers (optional — the emulator CLI usually handles this).

Deploying rules to production

- To deploy Firestore + Storage rules to your configured Firebase project:

  firebase deploy --only firestore:rules,storage

  Or deploy one at a time:
  - firebase deploy --only firestore:rules
  - firebase deploy --only storage

- Make sure `.firebaserc` is set to the correct project or pass `--project <projectId>`.

Vercel / Production environment variables

- In your Vercel project settings, add the following environment variables (Production & Preview):
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID

- After setting these, trigger a redeploy on Vercel.

Notes & next steps

- Replace `<YOUR_FIREBASE_PROJECT_ID>` in `.firebaserc` with the actual project id or run `firebase use --add` to set it.
- If you want, I can add a small npm script to package.json (example) but I left package.json unchanged to avoid accidental conflicts. Example scripts to add:

  "scripts": {
    "emulators": "firebase emulators:start",
    "deploy:rules": "firebase deploy --only firestore:rules,storage"
  }

- I can also update `src/lib/firebase.ts` to automatically connect to emulators when running locally. Tell me if you'd like that and I can open a follow-up PR.

