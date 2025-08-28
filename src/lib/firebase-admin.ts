
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Ensure environment variables are loaded for server-side code.
dotenv.config();

if (!admin.apps.length) {
  try {
    // This check is crucial for Vercel/Next.js serverless environments.
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID is not set in the environment variables.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must have its newline characters correctly interpreted.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error. Check your .env file and server environment variables.', error.stack);
  }
}

export default admin;
