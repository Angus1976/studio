import * as admin from 'firebase-admin';

// Check if the Firebase Admin SDK has already been initialized.
// This is important to prevent re-initialization errors in a Next.js environment
// where modules can be re-evaluated during development (hot-reloading).
if (!admin.apps.length) {
  // Retrieve Firebase credentials from environment variables.
  // This is a secure way to handle sensitive information, avoiding hardcoding.
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key must be correctly formatted. When stored in an environment
    // variable, newline characters are often replaced with '\\n'. We need to
    // replace them back to the actual newline characters ('\n') for the SDK to parse it correctly.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Initialize the Firebase Admin SDK with the provided credentials.
  // This gives the backend server privileged access to Firebase services like
  // Authentication, Firestore, etc., allowing it to act as an administrator.
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export the initialized admin SDK instance.
// This instance can now be imported into any server-side file (e.g., API routes)
// to interact with Firebase services. For example, `admin.auth()` to manage users
// or `admin.firestore()` to access the database.
export default admin;
