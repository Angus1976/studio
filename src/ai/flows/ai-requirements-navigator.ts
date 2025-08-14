
'use server';

/**
 * @fileOverview A flow to guide users in articulating their needs for AI-driven workflows.
 *
 * - aiRequirementsNavigator - A function that guides the user and extracts key requirements.
 * - AIRequirementsNavigatorInput - The input type for the aiRequirementsNavigator function.
 * - AIRequirementsNavigatorOutput - The return type for the aiRequirementsNavigator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AIRequirementsNavigatorInputSchema = z.object({
  userInput: z.string().describe('The latest message from the user.'),
  conversationHistory: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .describe('The history of the conversation so far.'),
});
export type AIRequirementsNavigatorInput = z.infer<typeof AIRequirementsNavigatorInputSchema>;

const AIRequirementsNavigatorOutputSchema = z.object({
  aiResponse: z.string().describe('The next response from the AI assistant.'),
  isFinished: z
    .boolean()
    .describe(
      'A flag indicating if the conversation is complete and all necessary information has been gathered.'
    ),
  suggestedPromptId: z
    .string()
    .optional()
    .describe(
      'If the conversation is finished, the ID of the suggested expert prompt (e.g., "recruitment-expert").'
    ),
});
export type AIRequirementsNavigatorOutput = z.infer<typeof AIRequirementsNavigatorOutputSchema>;


export async function aiRequirementsNavigator(
  input: AIRequirementsNavigatorInput
): Promise<AIRequirementsNavigatorOutput> {
  return aiRequirementsNavigatorFlow(input);
}


const prompt = ai.definePrompt({
  name: 'aiRequirementsNavigatorPrompt',
  input: { schema: AIRequirementsNavigatorInputSchema },
  output: { schema: AIRequirementsNavigatorOutputSchema },
  prompt: `You are an AI assistant designed to help users discover the perfect AI workflow solution. Your goal is to conduct a friendly, guided conversation to understand the user's needs.

You must gather the following four pieces of information:
1.  **Enterprise Characteristics**: The user's industry or company type.
2.  **User Role**: The user's job title or role in the company.
3.  **Need Scene**: The business scenario where they need help (e.g., recruiting, marketing).
4.  **Core Demands**: The specific task they want to automate or improve.

Conversation Flow:
- Start by introducing yourself and your purpose.
- Ask one question at a time to gather the four key pieces of information.
- Keep your questions clear and concise.
- Once you have all four pieces of information, summarize them for the user and ask for their confirmation.
- If the user confirms, set 'isFinished' to true and provide a 'suggestedPromptId' based on their Need Scene. Use one of the following IDs:
    - For HR/Recruiting needs: 'recruitment-expert'
    - For Content/Marketing needs: 'content-creation-expert'
    - For Contract/Legal needs: 'contract-review-expert'
    - For Customer Support needs: 'customer-support-expert'
    - For Data Analysis needs: 'data-analysis-expert'
    - For Code/Development needs: 'code-review-expert'
- If the user does not confirm, continue the conversation to clarify their needs.

Here is the conversation history so far (if any):
{{#each conversationHistory}}
- {{role}}: {{content}}
{{/each}}

User's latest message: {{{userInput}}}

Based on this, what is your next response?`,
});


const aiRequirementsNavigatorFlow = ai.defineFlow(
  {
    name: 'aiRequirementsNavigatorFlow',
    inputSchema: AIRequirementsNavigatorInputSchema,
    outputSchema: AIRequirementsNavigatorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to return a valid response.');
    }
    return output;
  }
);
