
'use server';
/**
 * @fileOverview A set of flows for administrators to manage tenants and users.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';

// --- Data Types ---
export const TenantSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  adminEmail: z.string().email(),
  status: z.enum(["活跃", "待审核", "已禁用"]),
  registeredDate: z.string(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const IndividualUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.enum(["活跃", "待审核", "已禁用"]),
  tenantId: z.string().optional(),
  registeredDate: z.string(),
});
export type IndividualUser = z.infer<typeof IndividualUserSchema>;


// --- Get all Tenants and Users ---
export async function getTenantsAndUsers(): Promise<{ tenants: Tenant[], users: IndividualUser[] }> {
    const db = admin.firestore();
    try {
        const tenantsSnapshot = await db.collection('tenants').get();
        const usersSnapshot = await db.collection('users').get();

        const tenants: Tenant[] = tenantsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                companyName: data.companyName,
                adminEmail: data.adminEmail,
                status: data.status,
                registeredDate: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            };
        });

        const users: IndividualUser[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            // Map Firestore role to UI role if necessary, for now we assume they are the same
            const roleMap: { [key: string]: string } = {
                'Platform Admin': '平台管理员',
                'Tenant Admin': '租户管理员',
                'Prompt Engineer/Developer': '技术工程师',
                'Individual User': '个人用户',
            };

            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: roleMap[data.role] || data.role,
                status: data.status || '活跃', // Default status if not set
                tenantId: data.tenantId,
                registeredDate: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            };
        });

        return { tenants, users };

    } catch (error) {
        console.error("Error fetching tenants and users:", error);
        throw new Error('无法从数据库加载数据。');
    }
}


// --- Tenant Management Flows ---
const SaveTenantInputSchema = z.object({
    id: z.string().optional(),
    companyName: z.string(),
    adminEmail: z.string().email(),
    status: z.enum(["活跃", "待审核", "已禁用"]),
});

export async function saveTenant(input: z.infer<typeof SaveTenantInputSchema>): Promise<{ success: boolean; message: string; id?: string }> {
  const db = admin.firestore();
  try {
    const { id, ...data } = input;
    if (id) {
      await db.collection('tenants').doc(id).set(data, { merge: true });
      return { success: true, message: '租户已成功更新。', id };
    } else {
      const docRef = await db.collection('tenants').add({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: '租户已成功创建。', id: docRef.id };
    }
  } catch (error: any) {
    console.error("Error saving tenant:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteTenant(input: { id: string }): Promise<{ success: boolean; message: string }> {
  const db = admin.firestore();
  try {
    await db.collection('tenants').doc(input.id).delete();
    return { success: true, message: '租户已删除。' };
  } catch (error: any) {
    console.error("Error deleting tenant:", error);
    return { success: false, message: error.message };
  }
}

// --- User Management Flows ---
const SaveUserInputSchema = IndividualUserSchema.omit({ registeredDate: true }).partial({ id: true, tenantId: true });

export async function saveUser(input: z.infer<typeof SaveUserInputSchema>): Promise<{ success: boolean; message: string; id?: string }> {
  const db = admin.firestore();
  try {
    const { id, ...data } = input;
    if (id) {
      await db.collection('users').doc(id).set(data, { merge: true });
      return { success: true, message: '用户已更新。', id };
    } else {
      const docRef = await db.collection('users').add({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, message: '用户已创建。', id: docRef.id };
    }
  } catch (error: any) {
    console.error("Error saving user:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteUser(input: { id: string }): Promise<{ success: boolean; message: string }> {
  const db = admin.firestore();
  try {
    await db.collection('users').doc(input.id).delete();
    return { success: true, message: '用户已删除。' };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message };
  }
}

    