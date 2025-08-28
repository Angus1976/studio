
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
    modelName: z.string().min(1, "模型名称不能为空"),
    provider: z.string().min(1, "请选择一个厂商"),
    apiKey: z.string().min(10, "API Key不合法"),
    scope: z.enum(["通用", "专属"]),
    category: z.enum(["文本", "图像", "推理", "多模态"]),
    status: z.enum(["活跃", "已禁用"]),
    priority: z.coerce.number().min(1).max(100).optional(),
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
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'This is a connection test. Please respond with a short confirmation message.' }
            ],
            temperature: 0.1,
            // Do NOT request json_object for a simple connectivity test
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

    
```
  </change>
  <change>
    <file>src/lib/data-types.ts</file>
    <content><![CDATA[
/**
 * @fileOverview This file contains the core data types and Zod schemas used across the application.
 * Separating these from server-side logic files prevents 'use server' directive violations.
 */

import { z } from 'zod';

// --- Tenant & User Management ---

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
  status: z.enum(["活跃", "待审核", "已禁用", "邀请中"]),
  tenantId: z.string().optional(),
  registeredDate: z.string(),
  departmentId: z.string().nullable().optional(),
  positionId: z.string().nullable().optional(),
});
export type IndividualUser = z.infer<typeof IndividualUserSchema>;

export const RoleSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    permissions: z.array(z.string()),
});
export type Role = z.infer<typeof RoleSchema>;

export const DepartmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable().optional(),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const PositionSchema = z.object({
    id: z.string(),
    name: z.string(),
    departmentId: z.string(),
});
export type Position = z.infer<typeof PositionSchema>;

export const ExpertDomainSchema = z.object({
    id: z.string(),
    name: z.string(),
    domainId: z.string(),
});
export type ExpertDomain = z.infer<typeof ExpertDomainSchema>;

// --- Message format for AI models (OpenAI compatible) ---
export const MessageSchema = z.object({
    role: z.enum(['system', 'user', 'model', 'assistant']),
    content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;


// --- AI Requirements Navigator ---

export const RequirementsNavigatorInputSchema = z.object({
  conversationHistory: z.array(MessageSchema).describe("The history of the conversation so far."),
  userName: z.string().nullable().optional().describe("The name of the current user, if available."),
});
export type RequirementsNavigatorInput = z.infer<typeof RequirementsNavigatorInputSchema>;

export const RequirementsNavigatorOutputSchema = z.object({
  response: z.string().describe("The AI's next response in the conversation."),
  isFinished: z.boolean().describe("Set to true only when the AI has gathered all necessary information and the user has confirmed."),
  suggestedPromptId: z.string().optional().describe("If isFinished is true, this should contain the ID of the expert prompt that best matches the user's needs."),
});
export type RequirementsNavigatorOutput = z.infer<typeof RequirementsNavigatorOutputSchema>;


// --- Prompt Management (Get/Save/Delete) ---

export const PromptSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    userPrompt: z.string(),
    expertId: z.string(),
    scope: z.enum(["通用", "专属"]).optional(),
    tenantId: z.string().optional(),
    systemPrompt: z.string().optional(),
    context: z.string().optional(),
    negativePrompt: z.string().optional(),
    industry: z.string().optional(),
    task: z.string().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
    archived: z.boolean().optional(),
    metadata: z.any().optional(),
});
export type Prompt = z.infer<typeof PromptSchema>;
export const GetPromptsOutputSchema = z.array(PromptSchema);
export type GetPromptsOutput = z.infer<typeof GetPromptsOutputSchema>;


export const SavePromptInputSchema = PromptSchema.omit({ id: true }).extend({
  id: z.string().optional(),
});
export type SavePromptInput = z.infer<typeof SavePromptInputSchema>;


export const SavePromptOutputSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  message: z.string(),
});
export type SavePromptOutput = z.infer<typeof SavePromptOutputSchema>;


export const DeletePromptInputSchema = z.object({
  id: z.string(),
});
export type DeletePromptInput = z.infer<typeof DeletePromptInputSchema>;


export const DeletePromptOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeletePromptOutput = z.infer<typeof DeletePromptOutputSchema>;


// --- Prompt Execution (The Unified Gateway) ---

export const PromptExecutionInputSchema = z.object({
  modelId: z.string().describe('The ID of the LLM connection to use.'),
  messages: z.array(MessageSchema).describe('A list of messages conforming to the OpenAI API structure.'),
  temperature: z.number().min(0).max(1).optional().describe('The temperature for the model.'),
  responseFormat: z.enum(['text', 'json_object']).optional().describe('The desired response format from the model.'),
});
export type PromptExecutionInput = z.infer<typeof PromptExecutionInputSchema>;


export const PromptExecutionOutputSchema = z.object({
  response: z.string().describe('The generated response from the AI.'),
});
export type PromptExecutionOutput = z.infer<typeof PromptExecutionOutputSchema>;


// --- Digital Employee ---

export const DigitalEmployeeInputSchema = z.object({
  promptId: z.string().optional().describe("The ID of the prompt scenario to execute from the library."),
  modelId: z.string().optional().describe("The ID of the LLM connection to use for execution."),
  variables: z.record(z.any()).optional().describe("Key-value pairs for variables in the prompt."),
  temperature: z.number().min(0).max(1).optional().describe("The temperature for the model."),
  // The following are used for testing prompts that haven't been saved yet.
  userPrompt: z.string().optional(),
}).refine(data => data.promptId || data.userPrompt, {
    message: "Either promptId or userPrompt must be provided.",
});
export type DigitalEmployeeInput = z.infer<typeof DigitalEmployeeInputSchema>;


// --- Prompt Metadata Analysis ---

export const AnalyzePromptMetadataInputSchema = z.object({
  systemPrompt: z.string().optional(),
  userPrompt: z.string(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
});
export type AnalyzePromptMetadataInput = z.infer<typeof AnalyzePromptMetadataInputSchema>;


export const AnalyzePromptMetadataOutputSchema = z.object({
  scope: z.string().describe('分析提示词的适用范围，例如：“客户服务”、“代码生成”、“营销文案”等。'),
  recommendedModel: z.string().describe('根据提示词的复杂度和任务类型，推荐最适合的 LLM 模型，例如：“gemini-1.5-flash”或“gemini-1.5-pro”。'),
  constraints: z.string().describe('分析并列出使用此提示词时需要注意的约束条件或潜在限制。'),
  scenario: z.string().describe('描述一个或多个具体的业务场景，说明此提示词可以在何种情况下发挥作用。'),
});
export type AnalyzePromptMetadataOutput = z.infer<typeof AnalyzePromptMetadataOutputSchema>;


// --- Task Dispatch ---

export const TaskSchema = z.object({
  id: z.string().describe('一个唯一的任务ID，例如 "task-1"。'),
  agent: z.string().describe('执行此任务所需的虚拟AI Agent，例如 "数据分析Agent" 或 "邮件撰写Agent"。'),
  description: z.string().describe('对此具体任务步骤的清晰描述。'),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).describe('任务的当前状态。'),
  dependencies: z.array(z.string()).optional().describe('执行此任务前需要先完成的其他任务的ID列表。'),
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskDispatchInputSchema = z.object({
  userCommand: z.string().describe("用户的原始自然语言指令。"),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe("如果需要，可以提供之前的对话历史。"),
});
export type TaskDispatchInput = z.infer<typeof TaskDispatchInputSchema>;


export const TaskDispatchOutputSchema = z.object({
  planSummary: z.string().describe('对整个任务计划的总结，用于和用户确认。例如：“好的，我将首先...然后...最后...您确认后立即执行。”'),
  tasks: z.array(TaskSchema).describe('分解后的任务列表。'),
  isClarificationNeeded: z.boolean().describe('如果用户信息不足以制定计划，则设置为 true，并在 planSummary 中提出澄清问题。'),
});
export type TaskDispatchOutput = z.infer<typeof TaskDispatchOutputSchema>;


// --- Platform Asset Management ---

export const LlmProviderSchema = z.object({
    id: z.string(),
    providerName: z.string(),
    apiKeyEnvVar: z.string(),
    apiKeyHelpText: z.string(),
    models: z.array(z.string()),
});
export type LlmProvider = z.infer<typeof LlmProviderSchema>;

export const LlmConnectionSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  provider: z.string(), // Corresponds to LlmProvider's providerName
  apiKey: z.string(),
  scope: z.enum(["通用", "专属"]),
  category: z.enum(["文本", "图像", "推理", "多模态"]),
  tenantId: z.string().optional(),
  status: z.enum(["活跃", "已禁用"]),
  priority: z.number().min(1).max(100).optional(),
  lastChecked: z.string().optional(),
  createdAt: z.string(),
});
export type LlmConnection = z.infer<typeof LlmConnectionSchema>;

export const TokenAllocationSchema = z.object({
    id: z.string(),
    key: z.string(),
    assignedTo: z.string(), // tenantId or userId
    usageLimit: z.number(),
    used: z.number(),
    createdAt: z.string(),
});
export type TokenAllocation = z.infer<typeof TokenAllocationSchema>;

export const SoftwareAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  licenseKey: z.string().optional(),
  type: z.string(),
  createdAt: z.string(),
});
export type SoftwareAsset = z.infer<typeof SoftwareAssetSchema>;

// --- Procurement & Orders ---
export const ProcurementItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    tag: z.string(),
    icon: z.string(),
    price: z.number(),
    unit: z.string(),
});
export type ProcurementItem = z.infer<typeof ProcurementItemSchema>;

export const OrderStatusSchema = z.enum(["待平台确认", "待支付", "配置中", "已完成", "已取消"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    tenantName: z.string().optional(),
    items: z.array(z.any()),
    totalAmount: z.number(),
    status: OrderStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;


// --- API Keys ---
export const ApiKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    createdAt: z.string(),
    status: z.enum(['活跃', '已撤销']),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;
