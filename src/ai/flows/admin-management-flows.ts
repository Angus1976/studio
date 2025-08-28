
'use server';
/**
 * @fileOverview A set of flows for administrators to manage tenants, users, and platform assets.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import type { Tenant, IndividualUser, LlmConnection, SoftwareAsset, Order, OrderStatus, ExpertDomain, LlmProvider } from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';


// --- Get All Data for Admin Dashboard ---
export async function getTenantsAndUsers(): Promise<{ tenants: Tenant[], users: IndividualUser[], totalRevenue: number }> {
    const db = admin.firestore();
    try {
        const tenantsSnapshot = await db.collection('tenants').get();
        const usersSnapshot = await db.collection('users').get();
        const ordersSnapshot = await db.collection('orders').where('status', '==', '已完成').get();

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

        const totalRevenue = ordersSnapshot.docs.reduce((acc, doc) => {
            return acc + (doc.data().totalAmount || 0);
        }, 0);
        

        return { tenants, users, totalRevenue };

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


// --- Asset Management Flows ---

export async function getPlatformAssets(): Promise<{ llmConnections: LlmConnection[], softwareAssets: SoftwareAsset[], llmProviders: LlmProvider[] }> {
    const db = admin.firestore();
    try {
        const [llmSnapshot, softwareSnapshot, providersSnapshot] = await Promise.all([
            db.collection('llm_connections').get(),
            db.collection('software_assets').get(),
            db.collection('llm_providers').get()
        ]);

        const llmConnections: LlmConnection[] = llmSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            return {
                id: doc.id,
                ...data,
                createdAt: createdAt,
            } as LlmConnection;
        });

        const softwareAssets: SoftwareAsset[] = softwareSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            return {
                id: doc.id,
                ...data,
                createdAt: createdAt,
            } as SoftwareAsset;
        });

        const llmProviders: LlmProvider[] = providersSnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data(),
            } as LlmProvider;
        });
        
        return { llmConnections, softwareAssets, llmProviders };
    } catch (error: any) {
        console.error("Error fetching platform assets:", error);
        throw new Error('无法从数据库加载平台资产。');
    }
}

const llmConnectionSchema = z.object({
    id: z.string().optional(),
    modelName: z.string().min(1),
    provider: z.string().min(1),
    apiKey: z.string().min(10),
    scope: z.enum(["通用", "专属"]),
    category: z.enum(["文本", "图像", "推理", "多模态"]),
    status: z.enum(["活跃", "已禁用"]),
    priority: z.number().min(1).max(100).optional(),
});

export async function saveLlmConnection(input: z.infer<typeof llmConnectionSchema>): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        const dataToSave = { ...data };
        if (!dataToSave.priority) {
            dataToSave.priority = 99; // Default priority
        }

        if (id) {
            await db.collection('llm_connections').doc(id).set(dataToSave, { merge: true });
            return { success: true, message: 'LLM 连接已更新。' };
        } else {
            await db.collection('llm_connections').add({ ...dataToSave, createdAt: admin.firestore.FieldValue.serverTimestamp() });
            return { success: true, message: 'LLM 连接已创建。' };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteLlmConnection(input: { id: string }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        await db.collection('llm_connections').doc(input.id).delete();
        return { success: true, message: 'LLM 连接已删除。' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function testLlmConnection(input: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
        const result = await executePrompt({
            modelId: input.id,
            messages: [{ role: 'user', content: '你好' }],
            temperature: 0.1,
            // DO NOT request json_object for a simple connectivity test
        });
        // Truncate the response to avoid showing a very long message in the toast.
        const shortResponse = result.response.substring(0, 80);
        return { success: true, message: `连接成功，模型返回: "${shortResponse}..."` };
    } catch (error: any) {
        console.error(`Connection test failed for ${input.id}:`, error);
        // Return the specific error message from the underlying API call.
        return { success: false, message: `连接失败: ${error.message}` };
    }
}


const softwareAssetSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    type: z.string().min(2),
    licenseKey: z.string().optional(),
});

export async function saveSoftwareAsset(input: z.infer<typeof softwareAssetSchema>): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        if (id) {
            await db.collection('software_assets').doc(id).set(data, { merge: true });
            return { success: true, message: '软件资产已更新。' };
        } else {
            await db.collection('software_assets').add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
            return { success: true, message: '软件资产已创建。' };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteSoftwareAsset(input: { id: string }): Promise<{ success: boolean; message: string }> {
    const db = admin.firestore();
    try {
        await db.collection('software_assets').doc(input.id).delete();
        return { success: true, message: '软件资产已删除。' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


// --- Transaction Management Flows ---

export async function getAllOrders(): Promise<Order[]> {
    const db = admin.firestore();
    try {
        const ordersSnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        
        const orders: Order[] = await Promise.all(ordersSnapshot.docs.map(async (doc) => {
            const orderData = doc.data();
            let tenantName = '未知租户';
            if (orderData.tenantId) {
                const tenantDoc = await db.collection('tenants').doc(orderData.tenantId).get();
                if (tenantDoc.exists) {
                    tenantName = tenantDoc.data()?.companyName || '未知租户';
                }
            }

            return {
                id: doc.id,
                tenantId: orderData.tenantId,
                tenantName: tenantName,
                items: orderData.items || [],
                totalAmount: orderData.totalAmount || 0,
                status: orderData.status || '待平台确认',
                createdAt: orderData.createdAt?.toDate().toISOString() || new Date().toISOString(),
                updatedAt: orderData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
            };
        }));
        
        return orders;
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw new Error('无法从数据库加载订单列表。');
    }
}

export async function updateOrderStatus(input: { orderId: string, status: OrderStatus }): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    try {
        await db.collection('orders').doc(input.orderId).update({
            status: input.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: '订单状态已更新。' };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, message: '更新订单状态时出错。' };
    }
}


// --- Database Maintenance Flows ---
export async function findOrphanedUsers(): Promise<IndividualUser[]> {
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const tenantsRef = db.collection('tenants');

    const usersSnapshot = await usersRef.where('tenantId', '!=', null).get();
    if (usersSnapshot.empty) return [];

    const tenantIds = new Set<string>();
    const tenantsSnapshot = await tenantsRef.select().get();
    tenantsSnapshot.forEach(doc => tenantIds.add(doc.id));

    const orphanedUsers: IndividualUser[] = [];
    usersSnapshot.forEach(doc => {
        const user = doc.data() as IndividualUser;
        user.id = doc.id;
        if (user.tenantId && !tenantIds.has(user.tenantId)) {
            orphanedUsers.push(user);
        }
    });

    return orphanedUsers;
}

export async function findIncompleteOrders(): Promise<Order[]> {
    const db = admin.firestore();
    const ordersSnapshot = await db.collection('orders').get();
    const incompleteOrders: Order[] = [];

    ordersSnapshot.forEach(doc => {
        const order = doc.data() as Order;
        order.id = doc.id;
        // Example check: an order is incomplete if it has no items or no tenantId
        if (!order.items || order.items.length === 0 || !order.tenantId) {
            incompleteOrders.push(order);
        }
    });
    return incompleteOrders;
}


const CleanDatabaseInputSchema = z.object({
    ids: z.array(z.string()),
    type: z.enum(['Orphaned User', 'Incomplete Order']),
});
type CleanDatabaseInput = z.infer<typeof CleanDatabaseInputSchema>;

export async function cleanDatabase(input: CleanDatabaseInput): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    const batch = db.batch();
    
    let collectionName = '';
    if (input.type === 'Orphaned User') {
        collectionName = 'users';
    } else if (input.type === 'Incomplete Order') {
        collectionName = 'orders';
    } else {
        throw new Error('Invalid cleanup type specified.');
    }

    try {
        input.ids.forEach(id => {
            const docRef = db.collection(collectionName).doc(id);
            batch.delete(docRef);
        });
        await batch.commit();
        return { success: true, message: `成功删除了 ${input.ids.length} 个 ${input.type} 记录。` };
    } catch (error: any) {
        console.error(`Error cleaning ${input.type}:`, error);
        return { success: false, message: `清理 ${input.type} 时发生错误。` };
    }
}


// --- Expert Domain Management ---

export async function getExpertDomains(): Promise<ExpertDomain[]> {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('expert_domains').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpertDomain));
    } catch (error: any) {
        console.error("Error fetching expert domains:", error);
        throw new Error("无法获取专家领域列表。");
    }
}

const ExpertDomainInputSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    domainId: z.string(),
});

export async function saveExpertDomain(input: z.infer<typeof ExpertDomainInputSchema>): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    try {
        const { id, ...data } = input;
        if (id) {
            await db.collection('expert_domains').doc(id).set(data, { merge: true });
            return { success: true, message: "领域已更新。" };
        } else {
            // Check for duplicate domainId before creating
            const existing = await db.collection('expert_domains').where('domainId', '==', data.domainId).get();
            if(!existing.empty) {
                return { success: false, message: "该领域ID已存在。" };
            }
            await db.collection('expert_domains').add(data);
            return { success: true, message: "领域已创建。" };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteExpertDomain(input: { id: string }): Promise<{ success: boolean, message: string }> {
    const db = admin.firestore();
    try {
        await db.collection('expert_domains').doc(input.id).delete();
        return { success: true, message: "领域已删除。" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

    