
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
});
export type IndividualUser = z.infer<typeof IndividualUserSchema>;

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});
export type Role = z.infer<typeof RoleSchema>;


// --- AI Requirements Navigator ---

export const RequirementsNavigatorInputSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
        text: z.string(),
    })),
  })).describe("The history of the conversation so far."),
});
export type RequirementsNavigatorInput = z.infer<typeof RequirementsNavigatorInputSchema>;

export const RequirementsNavigatorOutputSchema = z.object({
  response: z.string().describe("The AI's next response in the conversation."),
  isFinished: z.boolean().describe("Set to true only when the AI has gathered all necessary information and the user has confirmed."),
  suggestedPromptId: z.string().optional().describe("If isFinished is true, this should contain the ID of the expert prompt that best matches the user's needs."),
});
export type RequirementsNavigatorOutput = z.infer<typeof RequirementsNavigatorOutputSchema>;


// --- Prompt Management (Get/Save/Delete) ---

export const ExpertDomainSchema = z.object({
    id: z.string(),
    name: z.string(),
});
export type ExpertDomain = z.infer<typeof ExpertDomainSchema>;

export const PromptSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    userPrompt: z.string(),
    expertId: z.string(),
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


// --- Prompt Execution ---

export const PromptExecutionInputSchema = z.object({
  modelId: z.string().optional().describe('The ID of the LLM connection to use.'),
  systemPrompt: z.string().optional().describe('The system prompt to guide the AI.'),
  userPrompt: z.string().describe('The main user prompt, which can contain Handlebars variables like {{variable}}.'),
  context: z.string().optional().describe('Additional context or examples for the AI.'),
  negativePrompt: z.string().optional().describe('Content that the model should avoid generating.'),
  variables: z.record(z.string()).optional().describe('A key-value object for replacing variables in the user prompt.'),
  temperature: z.number().min(0).max(1).optional().describe('The temperature for the model.'),
});
export type PromptExecutionInput = z.infer<typeof PromptExecutionInputSchema>;


export const PromptExecutionOutputSchema = z.object({
  response: z.string().describe('The generated response from the AI.'),
});
export type PromptExecutionOutput = z.infer<typeof PromptExecutionOutputSchema>;


// --- Digital Employee ---

export const DigitalEmployeeInputSchema = z.object({
  promptId: z.string().optional().describe("The ID of the prompt scenario to execute from the library."),
  variables: z.record(z.string()).optional().describe("Key-value pairs for variables in the prompt."),
  temperature: z.number().min(0).max(1).optional().describe("The temperature for the model."),
  // The following are used for testing prompts that haven't been saved yet.
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
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
    parts: z.array(z.object({
        text: z.string(),
    })),
  })).optional().describe("如果需要，可以提供之前的对话历史。"),
});
export type TaskDispatchInput = z.infer<typeof TaskDispatchInputSchema>;


export const TaskDispatchOutputSchema = z.object({
  planSummary: z.string().describe('对整个任务计划的自然语言总结，用于和用户确认。例如：“好的，我将首先...然后...最后...您确认后立即执行。”'),
  tasks: z.array(TaskSchema).describe('分解后的任务列表。'),
  isClarificationNeeded: z.boolean().describe('如果用户信息不足以制定计划，则设置为 true，并在 planSummary 中提出澄清问题。'),
});
export type TaskDispatchOutput = z.infer<typeof TaskDispatchOutputSchema>;

// --- Procurement & Orders ---

export const ProcurementItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    tag: z.string(),
    price: z.number(),
    unit: z.string(),
    category: z.string(),
});
export type ProcurementItem = z.infer<typeof ProcurementItemSchema>;


export const OrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  items: z.array(ProcurementItemSchema.extend({ quantity: z.number() })),
  totalAmount: z.number(),
  status: z.enum(["待平台确认", "待支付", "配置中", "已完成", "已取消"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const PreOrderSchema = OrderSchema.omit({id: true, createdAt: true, updatedAt: true}).extend({
    notes: z.string().optional(),
    createdAt: z.any(),
    updatedAt: z.any(),
});
export type PreOrder = z.infer<typeof PreOrderSchema>;


// --- API Keys ---
export const ApiKeySchema = z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    tenantId: z.string(),
    createdAt: z.string(),
    status: z.enum(["活跃", "已撤销"]),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

// --- Platform Asset Management ---

export const LlmConnectionSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  provider: z.string(),
  apiKey: z.string(),
  type: z.enum(["通用", "专属"]),
  tenantId: z.string().optional(),
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

    