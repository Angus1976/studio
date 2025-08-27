
'use server';
/**
 * @fileOverview A set of flows for administrators to manage tenants and users.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import type { Tenant, IndividualUser } from '@/lib/data-types';

// --- Get All Data for Admin Dashboard ---
export async function getTenantsAndUsers(): Promise<{ tenants: Tenant[], users: IndividualUser[] }> {
    const db = admin.firestore();
    try {
        const tenantsSnapshot = await db.collection('tenants').get();
        const usersSnapshot = await db.collection('users').get();

        const tenants: Tenant[] = tenantsSnapshot.docs.map(doc => {
            const data = doc.data();
            const registeredDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            return {
                id: doc.id,
                companyName: data.companyName || '',
                adminEmail: data.adminEmail || '',
                status: data.status || '待审核',
                registeredDate: registeredDate,
            };
        });

        const users: IndividualUser[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            const roleMap: { [key: string]: string } = {
                'Platform Admin': '平台管理员',
                'Tenant Admin': '租户管理员',
                'Prompt Engineer/Developer': '技术工程师',
                'Individual User': '个人用户',
            };
            const registeredDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();

            return {
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                role: roleMap[data.role] || data.role || '个人用户',
                status: data.status || '活跃',
                tenantId: data.tenantId,
                registeredDate: registeredDate,
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
    companyName: z.string().min(2),
    adminEmail: z.string().email(),
    status: z.enum(["活跃", "待审核", "已禁用"]),
});

export async function saveTenant(input: z.infer<typeof SaveTenantInputSchema>): Promise<{ success: boolean; message: string; id?: string }> {
  const db = admin.firestore();
  try {
    const { id, ...data } = input;
    const dataWithTimestamp = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (id) {
      await db.collection('tenants').doc(id).set(dataWithTimestamp, { merge: true });
      return { success: true, message: '租户已成功更新。', id };
    } else {
      const docRef = await db.collection('tenants').add({
          ...dataWithTimestamp,
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

// --- User Management Flows (for Admins) ---
const SaveUserInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["个人用户", "技术工程师", "租户管理员", "平台管理员"]),
  status: z.enum(["活跃", "待审核", "已禁用"]),
  tenantId: z.string().optional(),
});

export async function saveUser(input: z.infer<typeof SaveUserInputSchema>): Promise<{ success: boolean; message: string; id?: string }> {
  const db = admin.firestore();
  try {
    const { id, ...data } = input;
    const dataWithTimestamp = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Map role back to English for storage if needed for cross-system compatibility
    const roleReverseMap: { [key: string]: string } = {
        '平台管理员': 'Platform Admin',
        '租户管理员': 'Tenant Admin',
        '技术工程师': 'Prompt Engineer/Developer',
        '个人用户': 'Individual User',
    };
    const storedRole = roleReverseMap[data.role as keyof typeof roleReverseMap] || data.role;

    if (id) {
      await db.collection('users').doc(id).set({ ...dataWithTimestamp, role: storedRole }, { merge: true });
      return { success: true, message: '用户已更新。', id };
    } else {
      const docRef = await db.collection('users').add({
          ...dataWithTimestamp,
          role: storedRole,
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
