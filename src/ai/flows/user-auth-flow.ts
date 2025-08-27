
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
    
    // Use a transaction to ensure atomicity, although a simple check is likely fine for this use case.
    return await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(usersRef.limit(1));
        
        let finalRole = input.role;
        let finalStatus = '待审核';

        // Check if this is the very first user being created.
        if (snapshot.empty) {
          finalRole = 'Platform Admin';
          finalStatus = '活跃'; // The first user (super admin) should be active immediately.
        }
        
        const userDocRef = usersRef.doc(input.uid);
        transaction.set(userDocRef, {
          email: input.email,
          role: finalRole,
          name: input.name,
          status: finalStatus,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    });
    
  } catch (error: any) {
    console.error("Error in createUserRecord flow: ", error);
    throw new Error('无法在数据库中创建用户记录。');
  }
}


const LoginUserSchema = z.object({
  uid: z.string(),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

export async function loginUser(input: LoginUserInput) {
    try {
        const userDoc = await admin.firestore().collection('users').doc(input.uid).get();
        if (!userDoc.exists) {
            throw new Error('用户数据不存在。');
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new Error('无法加载用户数据。');
        }

        return {
            role: userData.role,
            name: userData.name,
            status: userData.status,
            tenantId: userData.tenantId,
        };
    } catch (error: any) {
        console.error("Error in loginUser flow: ", error);
        throw new Error('无法从数据库加载用户角色。');
    }
}
