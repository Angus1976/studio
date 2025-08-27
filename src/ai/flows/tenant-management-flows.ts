
'use server';

import { z } from 'zod';
import admin from '@/lib/firebase-admin';
import type { IndividualUser, Role, Order, ProcurementItem, ApiKey, Department, Position } from '@/lib/data-types';

const tenantIdSchema = z.object({
    tenantId: z.string(),
});

export async function getTenantData(input: z.infer<typeof tenantIdSchema>): Promise<{ users: IndividualUser[], orders: Order[], roles: Role[], departments: Department[], positions: Position[], tokenUsage: any[] }> {
    const db = admin.firestore();
    try {
        const tenantRef = db.collection('tenants').doc(input.tenantId);

        const usersSnapshot = await db.collection('users').where('tenantId', '==', input.tenantId).get();
        const ordersSnapshot = await db.collection('orders').where('tenantId', '==', input.tenantId).orderBy('createdAt', 'desc').get();
        const rolesSnapshot = await tenantRef.collection('roles').get();
        const departmentsSnapshot = await tenantRef.collection('departments').get();
        const positionsSnapshot = await tenantRef.collection('positions').get();

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IndividualUser));
        const orders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString(),
            } as Order;
        });
        const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
        const departments = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const positions = positionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Position));

        // Mock token usage data
        const tokenUsage = [
          { month: '一月', tokens: Math.floor(Math.random() * 5000) + 1000 },
          { month: '二月', tokens: Math.floor(Math.random() * 5000) + 1000 },
          { month: '三月', tokens: Math.floor(Math.random() * 5000) + 1000 },
          { month: '四月', tokens: Math.floor(Math.random() * 5000) + 1000 },
          { month: '五月', tokens: Math.floor(Math.random() * 5000) + 1000 },
          { month: '六月', tokens: Math.floor(Math.random() * 5000) + 1000 },
        ];

        return { users, orders, roles, departments, positions, tokenUsage };
    } catch (error) {
        console.error(`Error fetching data for tenant ${input.tenantId}:`, error);
        throw new Error('无法从数据库加载租户数据。');
    }
}

// --- Member Management ---
const inviteUsersSchema = z.object({
    tenantId: z.string(),
    users: z.array(z.object({
        email: z.string().email(),
        role: z.string(),
        name: z.string(),
        status: z.string(),
    })),
});

export async function inviteUsers(input: z.infer<typeof inviteUsersSchema>): Promise<{ success: boolean }> {
    const db = admin.firestore();
    const batch = db.batch();
    const usersRef = db.collection('users');

    input.users.forEach(user => {
        const newUserRef = usersRef.doc();
        batch.set(newUserRef, { ...user, tenantId: input.tenantId });
    });

    await batch.commit();
    return { success: true };
}

const updateTenantUserSchema = z.object({
    tenantId: z.string(),
    userId: z.string(),
    role: z.string(),
    departmentId: z.string().nullable().optional(),
    positionId: z.string().nullable().optional(),
});
export async function updateTenantUser(input: z.infer<typeof updateTenantUserSchema>): Promise<{ success: boolean }> {
    const { tenantId, userId, role, departmentId, positionId } = input;
    await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({ 
            role: role,
            departmentId: departmentId,
            positionId: positionId,
        });
    return { success: true };
}

// --- Role & Permission Management ---

const saveTenantRoleSchema = z.object({
    tenantId: z.string(),
    role: z.custom<Role>(),
});

export async function saveTenantRole(input: z.infer<typeof saveTenantRoleSchema>): Promise<{ success: boolean }> {
    const { id, ...roleData } = input.role;
    await admin.firestore()
        .collection('tenants')
        .doc(input.tenantId)
        .collection('roles')
        .doc(id)
        .set(roleData, { merge: true });
    return { success: true };
}

const deleteTenantRoleSchema = z.object({
    tenantId: z.string(),
    roleId: z.string(),
});
export async function deleteTenantRole(input: z.infer<typeof deleteTenantRoleSchema>): Promise<{ success: boolean }> {
    await admin.firestore()
        .collection('tenants')
        .doc(input.tenantId)
        .collection('roles')
        .doc(input.roleId)
        .delete();
    return { success: true };
}

// --- Organization Structure Management ---
export async function getOrganizationStructure(input: { tenantId: string }): Promise<{ departments: Department[], positions: Position[] }> {
    const db = admin.firestore();
    const tenantRef = db.collection('tenants').doc(input.tenantId);

    const departmentsSnapshot = await tenantRef.collection('departments').get();
    const positionsSnapshot = await tenantRef.collection('positions').get();

    const departments = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
    const positions = positionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Position));
    
    return { departments, positions };
}

const saveDepartmentSchema = z.object({
    tenantId: z.string(),
    department: z.object({
        id: z.string().optional(),
        name: z.string(),
        parentId: z.string().nullable().optional(),
    }),
});
export async function saveDepartment(input: z.infer<typeof saveDepartmentSchema>): Promise<{ success: boolean }> {
    const { tenantId, department } = input;
    const { id, ...data } = department;
    const departmentsRef = admin.firestore().collection('tenants').doc(tenantId).collection('departments');
    if (id) {
        await departmentsRef.doc(id).set(data, { merge: true });
    } else {
        await departmentsRef.add(data);
    }
    return { success: true };
}

const deleteDepartmentSchema = z.object({
    tenantId: z.string(),
    departmentId: z.string(),
});
export async function deleteDepartment(input: z.infer<typeof deleteDepartmentSchema>): Promise<{ success: boolean }> {
    await admin.firestore().collection('tenants').doc(input.tenantId).collection('departments').doc(input.departmentId).delete();
    // In a real app, you'd also handle demoting sub-departments or deleting positions.
    return { success: true };
}

const savePositionSchema = z.object({
    tenantId: z.string(),
    position: z.object({
        id: z.string().optional(),
        name: z.string(),
        departmentId: z.string(),
    }),
});
export async function savePosition(input: z.infer<typeof savePositionSchema>): Promise<{ success: boolean }> {
    const { tenantId, position } = input;
    const { id, ...data } = position;
    const positionsRef = admin.firestore().collection('tenants').doc(tenantId).collection('positions');
    if (id) {
        await positionsRef.doc(id).set(data, { merge: true });
    } else {
        await positionsRef.add(data);
    }
    return { success: true };
}

const deletePositionSchema = z.object({
    tenantId: z.string(),
    positionId: z.string(),
});
export async function deletePosition(input: z.infer<typeof deletePositionSchema>): Promise<{ success: true }> {
    await admin.firestore().collection('tenants').doc(input.tenantId).collection('positions').doc(input.positionId).delete();
    return { success: true };
}


// --- Procurement & Order Management ---
export async function getProcurementItems(): Promise<ProcurementItem[]> {
    const snapshot = await admin.firestore().collection('procurement_items').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcurementItem));
}

const createPreOrderSchema = z.object({
    tenantId: z.string(),
    item: z.any(), // ProcurementItem is complex, any for simplicity
    quantity: z.number(),
    notes: z.string().optional(),
});
export async function createPreOrder(input: z.infer<typeof createPreOrderSchema>): Promise<{ success: boolean }> {
    const { tenantId, item, quantity, notes } = input;
    
    if (!tenantId) {
        throw new Error("无法创建订单，因为租户ID丢失。请重新登录后重试。");
    }

    const orderData = {
        tenantId,
        items: [{ ...item, quantity }],
        totalAmount: item.price * quantity,
        status: "待平台确认",
        notes,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Also add to global orders for admin view
    await admin.firestore().collection('orders').add(orderData); 
    
    return { success: true };
}

// --- API Key Management ---
const apiKeyInputSchema = z.object({
    tenantId: z.string(),
    name: z.string(),
});

export async function createApiKey(input: z.infer<typeof apiKeyInputSchema>): Promise<{ success: boolean; key: ApiKey }> {
    const db = admin.firestore();
    const apiKeyRef = db.collection('tenants').doc(input.tenantId).collection('api_keys').doc();
    // This is a mock key generation. In a real app, use a secure method.
    const key = `sk-${input.tenantId.substring(0,4)}-${apiKeyRef.id}-${Math.random().toString(36).substring(2, 10)}`;
    const keyData: ApiKey = {
        id: apiKeyRef.id,
        name: input.name,
        key: key,
        createdAt: new Date().toISOString(),
        status: '活跃',
    };
    await apiKeyRef.set(keyData);
    return { success: true, key: keyData };
}

const revokeApiKeySchema = z.object({
    tenantId: z.string(),
    keyId: z.string(),
});
export async function revokeApiKey(input: z.infer<typeof revokeApiKeySchema>): Promise<{ success: boolean }> {
    await admin.firestore()
        .collection('tenants').doc(input.tenantId)
        .collection('api_keys').doc(input.keyId)
        .update({ status: '已撤销' });
    return { success: true };
}

export async function getApiKeys(input: { tenantId: string }): Promise<ApiKey[]> {
    const snapshot = await admin.firestore()
        .collection('tenants').doc(input.tenantId)
        .collection('api_keys')
        .orderBy('createdAt', 'desc')
        .get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt,
        } as ApiKey;
    });
}
