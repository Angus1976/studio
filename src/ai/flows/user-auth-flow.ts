
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
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(1).get();

    let finalRole = input.role;
    let finalStatus = '待审核';

    // Check if this is the very first user being created.
    if (snapshot.empty) {
      finalRole = 'Platform Admin';
      finalStatus = '活跃'; // The first user (super admin) should be active immediately.
    }

    await usersRef.doc(input.uid).set({
      email: input.email,
      role: finalRole,
      name: input.name,
      status: finalStatus,
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
    tenantId?: string;
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
      tenantId: userData.tenantId,
    };

  } catch (error: any) {
    console.error('Error in loginUser flow:', error.code, error.message);
    throw new Error(error.message || '登录时发生未知错误。');
  }
}
