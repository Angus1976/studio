
'use server';

import admin from '@/lib/firebase-admin';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  name: z.string(),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export async function registerUser(input: RegisterUserInput): Promise<{ uid: string }> {
    try {
        const userRecord = await admin.auth().createUser({
            email: input.email,
            password: input.password,
            displayName: input.name,
        });

        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email: input.email,
            role: input.role,
            name: input.name,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return { uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error in registerUser flow: ", error);
        // Bubble up specific error messages if they are helpful
        throw new Error(error.message || 'Failed to register user.');
    }
}


const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.string().optional(), // Role is optional for login check, but might be used
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
    // 1. Check if user exists in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(input.email);
    
    // 2. Verify password by signing in on the client-side SDK instance
    // This is a common pattern when using Admin SDK on the backend
    await signInWithEmailAndPassword(clientAuth, input.email, input.password);

    // 3. Get user role and other info from Firestore
    const userDocRef = admin.firestore().collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new Error('User data not found in database.');
    }
    
    const userData = userDoc.data()!;
    const userRole = userData.role;

    // Optional: If role is passed, verify it matches
    if (input.role && input.role !== userRole) {
        throw new Error(`Role mismatch. Expected ${input.role}, but user is a ${userRole}.`);
    }

    return {
      uid: userRecord.uid,
      email: userRecord.email || null,
      role: userRole,
      name: userData.name || 'N/A',
      message: 'Login successful',
    };

  } catch (error: any) {
    console.error('Error in loginUser flow:', error.code, error.message);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      throw new Error('用户不存在或密码错误。');
    }
    throw new Error(error.message || 'An unknown error occurred during login.');
  }
}
