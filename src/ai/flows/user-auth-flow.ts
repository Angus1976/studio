'use server';

import admin from '@/lib/firebase-admin';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';

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
        if (error.code === 'auth/email-already-exists') {
            throw new Error('此电子邮件地址已被注册。');
        }
        throw new Error(error.message || '注册失败，发生未知错误。');
    }
}


const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
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
    const userCredential = await signInWithEmailAndPassword(clientAuth, input.email, input.password);
    const user = userCredential.user;

    const userDocRef = admin.firestore().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new Error('用户数据不存在，请联系管理员。');
    }
    
    const userData = userDoc.data()!;
    
    return {
      uid: user.uid,
      email: user.email || null,
      role: userData.role,
      name: userData.name || 'N/A',
      message: 'Login successful',
    };

  } catch (error: any)
{
    console.error('Error in loginUser flow:', error.code, error.message);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('用户不存在或密码错误。');
    }
    throw new Error(error.message || '登录时发生未知错误。');
  }
}
