
'use server';
/**
 * @fileOverview A flow for an AI to understand a user's command, decompose it into tasks,
 * and present a plan for execution.
 *
 * - taskDispatchFlow - The main flow function.
 */

import { 
    TaskDispatchInputSchema,
    TaskDispatchOutputSchema,
    type TaskDispatchInput,
    type TaskDispatchOutput,
    TaskSchema
} from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';
import admin from '@/lib/firebase-admin';
import type { LlmConnection } from '@/lib/data-types';


// Helper function to find the highest-priority, general-purpose LLM connection
async function getGeneralLlmConnection(): Promise<LlmConnection | null> {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .orderBy('priority', 'asc')
            .limit(1)
            .get();
            
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as LlmConnection;
        }
        return null;
    } catch (error) {
        console.error("Error fetching LLM connection from database:", error);
        return null;
    }
}


export async function taskDispatch(input: TaskDispatchInput): Promise<TaskDispatchOutput> {

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
- **输出格式**: 你的整个输出必须是一个符合指定 TypeScript 类型的、格式正确的 JSON 对象。

**示例**:
用户指令: "帮我分析Q3销售数据并给销售团队前三名发一封祝贺邮件"
你的输出 (必须是可被JSON.parse解析的字符串):
\`\`\`json
{
  "planSummary": "好的，收到指令。我将首先分析第三季度的销售数据，找出前三名销售冠军；然后为他们起草一封祝贺邮件；最后将邮件发送给他们。您确认后即可开始执行。",
  "tasks": [
    { "id": "task-1", "agent": "数据分析Agent", "description": "连接CRM，分析Q3销售数据，识别销售额前三名的员工。", "status": "pending", "dependencies": [] },
    { "id": "task-2", "agent": "文案撰写Agent", "description": "根据销售冠军名单，撰写一封热情洋溢的祝贺邮件。", "status": "pending", "dependencies": ["task-1"] },
    { "id": "task-3", "agent": "邮件发送Agent", "description": "将祝贺邮件发送给销售团队的前三名成员。", "status": "pending", "dependencies": ["task-2"] }
  ],
  "isClarificationNeeded": false
}
\`\`\`
`;
    
    // Find the highest priority, available, general-purpose LLM.
    const llmConnection = await getGeneralLlmConnection();
    if (!llmConnection) {
       return {
            planSummary: "抱歉，当前平台没有配置可用的AI模型，无法为您规划任务。请联系管理员。",
            tasks: [],
            isClarificationNeeded: true,
       }
    }
    
    const finalUserPrompt = `User command: "${input.userCommand}"\n\nPlease provide your response as a single JSON object.`;

    const result = await executePrompt({
        modelId: llmConnection.id, // Use the highest-priority model found.
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: finalUserPrompt }
        ],
        temperature: 0.3,
        responseFormat: 'json_object', // Request JSON output explicitly.
    });
    
    try {
        // The model might return the JSON inside a markdown block, so we need to extract it.
        const jsonMatch = result.response.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.response;
        const parsedJson = JSON.parse(jsonString);
        return TaskDispatchOutputSchema.parse(parsedJson);
    } catch (error) {
        console.error("Failed to parse AI task dispatch response:", error);
        console.error("Raw AI response:", result.response);
        // This error is thrown if the AI response is not valid JSON at all.
        throw new Error("AI返回的任务计划格式无效，无法解析。");
    }
}
