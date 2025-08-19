
'use server';

import { config } from 'dotenv';
config();
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin SDK if not already initialized
// This ensures that the admin SDK is ready for use in this server-side flow.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // The private key must be correctly formatted. Replace escaped newlines.
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
        });
    } catch (error: any) {
        // Log any initialization errors.
        console.error('Firebase admin initialization error in user-auth-flow', error.stack);
    }
}


const CreateUserRecordSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  role: z.string(),
  name: z.string(),
});
export type CreateUserRecordInput = z.infer<typeof CreateUserRecordSchema>;


export async function createUserRecord(input: CreateUserRecordInput): Promise<{ success: boolean }> {
    try {
        await admin.firestore().collection('users').doc(input.uid).set({
            email: input.email,
            role: input.role,
            name: input.name,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: '活跃', // Set a default status
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error in createUserRecord flow: ", error);
        // We can't easily delete the auth user here if this fails,
        // so we just log the error. A more robust solution might involve a cleanup function.
        throw new Error(error.message || '在数据库中创建用户记录失败。');
    }
}


const LoginUserSchema = z.object({
  uid: z.string(),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;


export type LoginUserOutput = {
    uid: string;
    email: string | null;
    role: string;
    name: string;
    message: string;
};


export async function loginUser(input: LoginUserInput): Promise<LoginUserOutput> {
  try {
    const userDocRef = admin.firestore().collection('users').doc(input.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // This case might happen if Firestore record creation failed after auth creation.
      // We should probably create the record here as a fallback.
      const userRecord = await admin.auth().getUser(input.uid);
      const userData = {
        email: userRecord.email!,
        name: userRecord.displayName || '新用户',
        role: 'Individual User', // Default role
        status: '活跃',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userDocRef.set(userData);

      return {
        uid: input.uid,
        email: userRecord.email || null,
        role: 'Individual User',
        name: userRecord.displayName || '新用户',
        message: 'Login successful, created missing user record.',
      };
    }
    
    const userData = userDoc.data()!;
    
    return {
      uid: input.uid,
      email: userData.email || null,
      role: userData.role,
      name: userData.name || 'N/A',
      message: 'Login successful',
    };

  } catch (error: any) {
    console.error('Error in loginUser flow:', error.code, error.message);
    throw new Error(error.message || '登录时发生未知错误。');
  }
}
