
'use server';

import admin from '@/lib/firebase-admin';
import { z } from 'zod';

const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  name: z.string(),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;


export async function createUserRecord(input: { uid: string, email: string, role: string, name: string }): Promise<{ success: boolean }> {
  try {
    await admin.firestore().collection('users').doc(input.uid).set({
      email: input.email,
      role: input.role,
      name: input.name,
      status: '待审核', // Set default status to Pending for review
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in createUserRecord flow: ", error);
    throw new Error('无法在数据库中创建用户记录。');
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
    status: string;
    message: string;
};

export async function loginUser(input: LoginUserInput): Promise<LoginUserOutput> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(input.uid).get();
    if (!userDoc.exists) {
      throw new Error('用户数据不存在。');
    }
    const userData = userDoc.data()!;
    
    return {
      uid: input.uid,
      email: userData.email || null,
      role: userData.role,
      name: userData.name || 'N/A',
      status: userData.status || '待审核',
      message: 'Login successful',
    };

  } catch (error: any) {
    console.error('Error in loginUser flow:', error.code, error.message);
    throw new Error(error.message || '登录时发生未知错误。');
  }
}

// This is deprecated and should not be used from the client. Kept for potential admin panel usage.
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
      status: '待审核',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error in registerUser flow: ", error.code, error.message);
    // You can create more specific error messages based on the error.code
    throw new Error(error.message || '在服务器上注册用户失败。');
  }
}
