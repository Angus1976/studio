
'use server';
/**
 * @fileOverview A flow for an AI to understand a user's command, decompose it into tasks,
 * and present a plan for execution.
 *
 * - taskDispatchFlow - The main flow function.
 */

import { 
    type TaskDispatchInput,
    type TaskDispatchOutput,
    TaskDispatchOutputSchema,
} from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';
import admin from '@/lib/firebase-admin';
import type { LlmConnection } from '@/lib/data-types';


// Helper function to find the highest-priority, general-purpose LLM that supports JSON output.
async function getJsonCapableLlmConnection(): Promise<{ model: LlmConnection, requiresManualParse: boolean } | null> {
    const db = admin.firestore();
    try {
        // Priority 1: Look for "Reasoning" or "Multimodal" models first, as they are more likely to support JSON mode.
        const reasoningSnapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .where('category', 'in', ['推理', '多模态'])
            .get();
        
        let connections = reasoningSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LlmConnection));
        
        if (connections.length > 0) {
            connections.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            return { model: connections[0], requiresManualParse: false }; // These models should handle JSON mode well.
        }

        // Priority 2: Fallback to a general "Text" model if no specialized ones are found.
        const textSnapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .where('category', '==', '文本')
            .get();

        if (textSnapshot.empty) {
             console.warn("No active, general-purpose LLM connection of any category found in database.");
             return null;
        }

        connections = textSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LlmConnection));
        connections.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return { model: connections[0], requiresManualParse: true }; // A standard text model will require us to parse its output.

    } catch (error) {
        console.error("Error fetching a JSON-capable LLM connection from database:", error);
        return null;
    }
}


export async function taskDispatch(input: TaskDispatchInput): Promise<TaskDispatchOutput> {
    try {
        const systemPrompt = `你是一个高级AI任务调度中心。你的核心职责是：
        1.  **深度理解**: 仔细分析用户的自然语言指令。
        2.  **任务分解**: 将复杂指令分解成一系列具体、有序、可执行的子任务。
        3.  **Agent匹配**: 为每个子任务匹配最合适的虚拟AI Agent。可用的Agent有：数据分析Agent, 报告生成Agent, 文案撰写Agent, 邮件发送Agent, 系统操作Agent。
        4.  **依赖关系**: 确定任务之间的执行顺序和依赖关系。
        5.  **计划呈现**: 以自然语言总结你的计划，并生成一个结构化的任务列表，等待用户确认。

        **规则**:
        - 如果用户指令清晰明确，直接制定计划，并将 \`isClarificationNeeded\` 设为 \`false\`。
        - 如果用户指令含糊不清或缺少必要信息（例如，发送邮件但没说发给谁），则必须提出澄清问题。此时，将 \`isClarificationNeeded\` 设为 \`true\`，并在 \`planSummary\` 中提出你的问题，\`tasks\` 列表可以为空。
        - 任务描述必须清晰、具体，易于理解。
        - 确保任务ID是唯一的。
        - **输出格式**: 你的整个输出必须是一个符合指定 TypeScript 类型的、格式正确的 JSON 对象。`;
        
        const llmInfo = await getJsonCapableLlmConnection();
        if (!llmInfo) {
           throw new Error("平台当前没有配置可用的AI模型，无法为您规划任务。请联系管理员。");
        }
        
        const finalUserPrompt = `User command: "${input.userCommand}"\n\nPlease provide your response as a single JSON object.`;

        const result = await executePrompt({
            modelId: llmInfo.model.id,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: finalUserPrompt }
            ],
            temperature: 0.3,
            responseFormat: llmInfo.requiresManualParse ? undefined : 'json_object',
        });
        
        const jsonMatch = result.response.match(/```(?:json)?\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.response;
        const parsedJson = JSON.parse(jsonString);
        return TaskDispatchOutputSchema.parse(parsedJson);

    } catch (error: any) {
        console.error("Failed to execute or parse AI task dispatch response:", error);
        // Return a structured error object that conforms to the expected output type.
        return {
            planSummary: `任务规划失败: ${error.message}`,
            tasks: [],
            isClarificationNeeded: true,
        };
    }
}
