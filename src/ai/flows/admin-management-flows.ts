
'use server';
/**
 * @fileOverview A set of flows for administrators to manage tenants and users.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import type { Tenant, IndividualUser, Role, ApiKey, Order, ProcurementItem, PreOrder, LlmConnection, TokenAllocation, SoftwareAsset } from '@/lib/data-types';

// --- Get All Data for Platform Admin ---
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


// --- Get Data for a specific Tenant ---
export async function getTenantData(input: { tenantId: string }): Promise<{ users: IndividualUser[], orders: Order[], roles: Role[] }> {
    const db = admin.firestore();
    const { tenantId } = input;

    try {
        // In a real, large-scale app, you'd paginate these queries.
        const usersSnapshot = await db.collection('users').where('tenantId', '==', tenantId).get();
        const ordersSnapshot = await db.collection('orders').where('tenantId', '==', tenantId).get();
        const rolesSnapshot = await db.collection('roles').where('tenantId', '==', tenantId).get();

        const users: IndividualUser[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            const registeredDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            return {
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                role: data.role || '成员',
                status: data.status || '活跃',
                tenantId: data.tenantId,
                registeredDate: registeredDate,
            };
        });

        const orders: Order[] = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                items: data.items || [],
                totalAmount: data.totalAmount || 0,
                status: data.status || '已取消',
                tenantId: data.tenantId,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : '',
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString().split('T')[0] : '',
            };
        });

        const roles: Role[] = rolesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                permissions: data.permissions || [],
            }
        });
        
        // If no roles exist for the tenant, create a default 'Member' role
        if (roles.length === 0) {
            const defaultRole = {
                name: "成员",
                description: "默认角色，拥有基础权限。",
                permissions: ["view_dashboard", "view_orders"],
                tenantId: tenantId
            };
            const roleRef = await db.collection('roles').add(defaultRole);
            roles.push({ id: roleRef.id, ...defaultRole });
        }


        return { users, orders, roles };

    } catch (error) {
        console.error(`Error fetching data for tenant ${tenantId}:`, error);
        throw new Error('无法从数据库加载租户数据。');
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

// --- Tenant-specific Flows ---

// This is a simplified version. A real app would have more robust logic.
export async function inviteUsers(input: { tenantId: string, users: { email: string, role: string, name: string, status: string }[] }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    const batch = db.batch();
    
    input.users.forEach(user => {
        const userRef = db.collection('users').doc(); // Create a new doc with a random ID
        batch.set(userRef, {
            ...user,
            tenantId: input.tenantId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    try {
        await batch.commit();
        return { success: true, message: `${input.users.length} 位成员已成功邀请。` };
    } catch (error) {
        console.error("Error inviting users:", error);
        throw new Error("批量邀请成员时发生错误。");
    }
}

export async function updateTenantUser(input: { tenantId: string, userId: string, role: string }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        const userRef = db.collection('users').doc(input.userId);
        // Ensure user belongs to the tenant before updating
        const doc = await userRef.get();
        if (!doc.exists || doc.data()?.tenantId !== input.tenantId) {
            throw new Error("User not found or does not belong to this tenant.");
        }
        await userRef.update({
            role: input.role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: "成员角色已更新。" };
    } catch (error) {
        console.error("Error updating tenant user:", error);
        throw new Error("更新成员信息时发生错误。");
    }
}

export async function saveTenantRole(input: { tenantId: string, role: Role }): Promise<{ success: boolean; message: string, id: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input.role;
        const dataToSave = { ...data, tenantId: input.tenantId };
        if (id) {
            await db.collection('roles').doc(id).set(dataToSave, { merge: true });
            return { success: true, message: '角色已更新。', id };
        } else {
            const ref = await db.collection('roles').add(dataToSave);
            return { success: true, message: '角色已创建。', id: ref.id };
        }
    } catch (error) {
        console.error("Error saving tenant role:", error);
        throw new Error("保存角色时出错。");
    }
}

export async function deleteTenantRole(input: { tenantId: string, roleId: string }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        const roleRef = db.collection('roles').doc(input.roleId);
        const doc = await roleRef.get();
        if (!doc.exists || doc.data()?.tenantId !== input.tenantId) {
            throw new Error("Role not found or does not belong to this tenant.");
        }
        await roleRef.delete();
        return { success: true, message: '角色已删除。' };
    } catch (error) {
        console.error("Error deleting tenant role:", error);
        throw new Error("删除角色时出错。");
    }
}

export async function createPreOrder(input: { tenantId: string, item: ProcurementItem, quantity: number, notes?: string }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        const orderData: PreOrder = {
            tenantId: input.tenantId,
            items: [{ ...input.item, quantity: input.quantity }],
            notes: input.notes,
            totalAmount: input.item.price * input.quantity,
            status: "待平台确认",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('orders').add(orderData);
        return { success: true, message: "预购单已成功提交。" };
    } catch (error) {
        console.error("Error creating pre-order:", error);
        throw new Error("创建预购单时出错。");
    }
}

export async function createApiKey(input: { tenantId: string, name: string }): Promise<{ success: true, key: ApiKey }> {
    const db = admin.firestore();
    const apiKey = `sk_live_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
    const keyData: Omit<ApiKey, 'id'> = {
        name: input.name,
        key: apiKey,
        tenantId: input.tenantId,
        createdAt: new Date().toISOString().split('T')[0],
        status: '活跃'
    };
    const ref = await db.collection('api_keys').add(keyData);
    return { success: true, key: { id: ref.id, ...keyData }};
}

export async function revokeApiKey(input: { tenantId: string, keyId: string }): Promise<{ success: true }> {
    const db = admin.firestore();
    const keyRef = db.collection('api_keys').doc(input.keyId);
    const doc = await keyRef.get();
    if (!doc.exists || doc.data()?.tenantId !== input.tenantId) {
        throw new Error("API Key not found or does not belong to this tenant.");
    }
    await keyRef.update({ status: '已撤销' });
    return { success: true };
}

export async function getApiKeys(input: { tenantId: string }): Promise<ApiKey[]> {
    const db = admin.firestore();
    const snapshot = await db.collection('api_keys').where('tenantId', '==', input.tenantId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiKey));
}

// --- Platform Asset Management ---
const toISODate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString();

export async function getPlatformAssets(): Promise<{ llmConnections: LlmConnection[], tokenAllocations: TokenAllocation[], softwareAssets: SoftwareAsset[] }> {
    const db = admin.firestore();
    try {
        const llmSnapshot = await db.collection('llm_connections').get();
        const tokenSnapshot = await db.collection('token_allocations').get();
        const assetSnapshot = await db.collection('software_assets').get();

        const llmConnections: LlmConnection[] = llmSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: toISODate(doc.data().createdAt) } as LlmConnection));
        const tokenAllocations: TokenAllocation[] = tokenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: toISODate(doc.data().createdAt) } as TokenAllocation));
        const softwareAssets: SoftwareAsset[] = assetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: toISODate(doc.data().createdAt) } as SoftwareAsset));

        return { llmConnections, tokenAllocations, softwareAssets };
    } catch (error) {
        console.error("Error fetching platform assets:", error);
        throw new Error('无法从数据库加载平台资产。');
    }
}

const SaveLlmConnectionSchema = z.object({
    id: z.string().optional(),
    modelName: z.string(), provider: z.string(), apiKey: z.string(), type: z.enum(["通用", "专属"]), tenantId: z.string().optional()
});
export async function saveLlmConnection(input: z.infer<typeof SaveLlmConnectionSchema>): Promise<{ success: boolean; message: string; }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        if (id) {
            await db.collection('llm_connections').doc(id).set(data, { merge: true });
        } else {
            await db.collection('llm_connections').add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        return { success: true, message: "LLM连接已保存" };
    } catch (e: any) { return { success: false, message: e.message }; }
}

export async function deleteLlmConnection(input: { id: string }): Promise<{ success: boolean, message: string }> {
    try {
        await admin.firestore().collection('llm_connections').doc(input.id).delete();
        return { success: true, message: "LLM连接已删除" };
    } catch (e: any) { return { success: false, message: e.message }; }
}

const SaveTokenAllocationSchema = z.object({
    id: z.string().optional(),
    key: z.string(), assignedTo: z.string(), usageLimit: z.number()
});
export async function saveTokenAllocation(input: z.infer<typeof SaveTokenAllocationSchema>): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        if (id) {
            await db.collection('token_allocations').doc(id).set(data, { merge: true });
        } else {
            await db.collection('token_allocations').add({ ...data, used: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        return { success: true, message: "Token已分配" };
    } catch (e: any) { return { success: false, message: e.message }; }
}

export async function deleteTokenAllocation(input: { id: string }): Promise<{ success: boolean, message: string }> {
    try {
        await admin.firestore().collection('token_allocations').doc(input.id).delete();
        return { success: true, message: "Token分配已删除" };
    } catch (e: any) { return { success: false, message: e.message }; }
}

const SaveSoftwareAssetSchema = z.object({
    id: z.string().optional(),
    name: z.string(), type: z.string(), licenseKey: z.string().optional()
});
export async function saveSoftwareAsset(input: z.infer<typeof SaveSoftwareAssetSchema>): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        if (id) {
            await db.collection('software_assets').doc(id).set(data, { merge: true });
        } else {
            await db.collection('software_assets').add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        return { success: true, message: "软件资产已保存" };
    } catch (e: any) { return { success: false, message: e.message }; }
}

export async function deleteSoftwareAsset(input: { id: string }): Promise<{ success: boolean, message: string }> {
    try {
        await admin.firestore().collection('software_assets').doc(input.id).delete();
        return { success: true, message: "软件资产已删除" };
    } catch (e: any) { return { success: false, message: e.message }; }
}
