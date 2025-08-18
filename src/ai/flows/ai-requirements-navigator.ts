
'use server';

/**
 * @fileOverview A flow to guide users in articulating their needs for AI-driven workflows.
 *
 * - aiRequirementsNavigator - A function that guides the user and extracts key requirements.
 * - AIRequirementsNavigatorInput - The input type for the aiRequirementsNavigator function.
 * - AIRequirementsNavigatorOutput - The return type for the aiRequirementsNavigator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

const AIRequirementsNavigatorInputSchema = z.object({
  conversationHistory: z
    .array(ConversationMessageSchema)
    .describe('The history of the conversation.'),
});

export type AIRequirementsNavigatorInput = z.infer<
  typeof AIRequirementsNavigatorInputSchema
>;

const AIRequirementsNavigatorOutputSchema = z.object({
  aiResponse: z.string().describe('The AI response to the user input.'),
  extractedRequirements: z
    .string()
    .optional()
    .describe('The extracted key requirements from the conversation.'),
  suggestedPromptId: z
    .string()
    .optional()
    .describe('The suggested prompt ID for the expert agent based on user needs.'),
  isFinished: z
    .boolean()
    .describe(
      'Whether the conversation is finished and the requirements are extracted.'
    ),
});

export type AIRequirementsNavigatorOutput = z.infer<
  typeof AIRequirementsNavigatorOutputSchema
>;

export async function aiRequirementsNavigator(
  input: AIRequirementsNavigatorInput
): Promise<AIRequirementsNavigatorOutput> {
  return aiRequirementsNavigatorFlow(input);
}

const systemPrompt = `You are a friendly and professional AI assistant. Your goal is to guide users in articulating their needs for AI-driven workflows by collecting a detailed user profile. You must ask questions one by one to gather the required information.

Follow these steps strictly:

1.  **Introduction**: If the conversation history is empty, start by introducing yourself with: "你好！我在这里帮助您定义 AI 驱动工作流的需求。" and then immediately ask the first question.

2.  **Sequential Questioning**: Ask questions to gather the following information for the user profile, one at a time. Do not ask the next question until the user has answered the previous one.
    - **Step 2.1: Industry and Business**: "请问您的行业是什么？以及您公司的主要业务是什么？"
    - **Step 2.2: Role**: "了解了。那么您在公司中担任什么职位或角色呢？（例如：人事、销售、运营）"
    - **Step 2.3: Task/Process**: "好的。请问您希望将哪个具体的任务或流程自动化，或者希望改进哪个环节呢？（例如：招聘流程、市场内容生成、客户支持邮件回复）"
    - **Step 2.4: Core Need**: "非常具体，谢谢！最后，能再详细描述一下您在这个场景下的核心需求吗？"

3.  **Summarize and Confirm**: Once you have gathered all the necessary information from the four questions above, you MUST summarize it for the user in the 'extractedRequirements' field. Then, ask for confirmation with a message like: "感谢您的详细说明！我已经收集了足够的信息来为您推荐解决方案。我将为您推荐一些招聘方面的专家场景。准备好了吗？".

4.  **Finish the Conversation**: If the user confirms the summary is correct (e.g., by saying "yes", "好", "可以", "准备好了"), you MUST set 'isFinished' to true.

5.  **Route to Expert**: Once 'isFinished' is set to true, analyze the user's core need and suggest the most appropriate expert agent. Set the 'suggestedPromptId' field to one of the following values based on the user's primary goal: 'recruitment-expert', 'marketing-guru', or 'code-optimizer'. Your final 'aiResponse' should be something like: "太棒了！根据您的需求，我为您推荐了以下能力场景。您可以在右侧查看并选择最适合您的方案。".

Analyze the provided conversation history and generate the next response based on the rules above.
`;

const aiRequirementsNavigatorFlow = ai.defineFlow(
  {
    name: 'aiRequirementsNavigatorFlow',
    inputSchema: AIRequirementsNavigatorInputSchema,
    outputSchema: AIRequirementsNavigatorOutputSchema,
  },
  async ({ conversationHistory }) => {
    // Map the input history to the format expected by the generate call
    const messages = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      content: [{ text: msg.content }],
    }));

    const llmResponse = await ai.generate({
      prompt: {
          system: systemPrompt,
          history: messages,
          // The last user message is already part of the history
      },
      output: {
          schema: AIRequirementsNavigatorOutputSchema,
      },
      model: 'googleai/gemini-1.5-flash',
    });
    
    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI model did not return a valid output.');
    }

    return output;
  }
);
