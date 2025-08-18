'use server';
/**
 * @fileOverview A flow for an AI to understand a user's command, decompose it into tasks,
 * and present a plan for execution.
 *
 * - taskDispatchFlow - The main flow function.
 * - TaskDispatchInput - The input schema for the flow.
 * - TaskDispatchOutput - The output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string().describe('一个唯一的任务ID，例如 "task-1"。'),
  agent: z.string().describe('执行此任务所需的虚拟AI Agent，例如 "数据分析Agent" 或 "邮件撰写Agent"。'),
  description: z.string().describe('对此具体任务步骤的清晰描述。'),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).describe('任务的当前状态。'),
  dependencies: z.array(z.string()).optional().describe('执行此任务前需要先完成的其他任务的ID列表。'),
  output_type: z.string().optional().describe('此任务预期的输出类型, 例如 "报告" 或 "邮件"。'),
});

export const TaskDispatchInputSchema = z.object({
  userCommand: z.string().describe("用户的原始自然语言指令。"),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe("如果需要，可以提供之前的对话历史。"),
});
export type TaskDispatchInput = z.infer<typeof TaskDispatchInputSchema>;


export const TaskDispatchOutputSchema = z.object({
  planSummary: z.string().describe('对整个任务计划的自然语言总结，用于和用户确认。例如：“好的，我将首先...然后...最后...您确认后立即执行。”'),
  tasks: z.array(TaskSchema).describe('分解后的任务列表。'),
  isClarificationNeeded: z.boolean().describe('如果用户信息不足以制定计划，则设置为 true，并在 planSummary 中提出澄清问题。'),
});
export type TaskDispatchOutput = z.infer<typeof TaskDispatchOutputSchema>;


export async function taskDispatch(input: TaskDispatchInput): Promise<TaskDispatchOutput> {
  return taskDispatchFlow(input);
}


const taskDispatchFlow = ai.defineFlow(
  {
    name: 'taskDispatchFlow',
    inputSchema: TaskDispatchInputSchema,
    outputSchema: TaskDispatchOutputSchema,
  },
  async ({ userCommand }) => {

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

**示例**:
用户指令: "帮我分析Q3销售数据并给销售团队前三名发一封祝贺邮件"
你的输出 (planSummary): "好的，收到指令。我将首先分析第三季度的销售数据，找出前三名销售冠军；然后为他们起草一封祝贺邮件；最后将邮件发送给他们。您确认后即可开始执行。"
你的输出 (tasks):
[
  { id: 'task-1', agent: '数据分析Agent', description: '连接CRM，分析Q3销售数据，识别销售额前三名的员工。', status: 'pending', dependencies: [] },
  { id: 'task-2', agent: '文案撰写Agent', description: '根据销售冠军名单，撰写一封热情洋溢的祝贺邮件。', status: 'pending', dependencies: ['task-1'] },
  { id: 'task-3', agent: '邮件发送Agent', description: '将祝贺邮件发送给销售团队的前三名成员。', status: 'pending', dependencies: ['task-2'] }
]
`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: {
        system: systemPrompt,
        messages: [{ role: 'user', content: userCommand }],
      },
      output: {
        schema: TaskDispatchOutputSchema,
      },
      config: {
        temperature: 0.3,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("AI未能生成有效的任务计划。");
    }

    return output;
  }
);
