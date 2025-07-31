'use server';

/**
 * @fileOverview A flow to guide users in articulating their needs for AI-driven workflows.
 *
 * - aiRequirementsNavigator - A function that guides the user and extracts key requirements.
 * @fileOverview A flow to guide users in articulating their needs for AI-driven workflows.
 *
 * - aiRequirementsNavigator - A function that guides the user and extracts key requirements.
 * - AIRequirementsNavigatorInput - The input type for the aiRequirementsNavigator function.
 * - AIRequirementsNavigatorOutput - The return type for the aiRequirementsNavigator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIRequirementsNavigatorInputSchema = z.object({
  userInput: z.string().describe('The user input for the current turn.'),
  conversationHistory: z
    .array(z.object({role: z.enum(['user', 'assistant']), content: z.string()}))
    .optional()
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

const prompt = ai.definePrompt({
  name: 'aiRequirementsNavigatorPrompt',
  input: {schema: AIRequirementsNavigatorInputSchema},
  output: {schema: AIRequirementsNavigatorOutputSchema},
  prompt: `You are an AI assistant designed to guide users in articulating their needs for AI-driven workflows by collecting a detailed user profile. Analyze their input and extract key requirements effectively. 

Follow these steps:
1.  Start by introducing yourself and explaining that you will guide the user to define their user profile and needs for an AI-driven workflow.
2.  Ask clarifying questions to gather the following information for the user profile. Be conversational and ask for them one by one or in small related groups:
    - Enterprise Characteristics: What is your industry, main business, number of employees, and approximate revenue/profit range?
    - Your Role: What is your position or job responsibility? (e.g., HR, Sales, Operations)
    - Demand Scenario: What specific task or process do you want to automate or improve? (e.g., recruitment, lead generation, customer support)
    - Core Need: Can you describe your core requirements for this scenario in a bit more detail?
3.  Based on the user input, keep the conversation going until you have a clear picture of all the points above.
4.  Once you have gathered all the necessary information, summarize it as the "extractedRequirements".
5.  After summarizing, ask the user for confirmation. If the user confirms the requirements are complete and accurate, set isFinished to true. If not, continue the conversation to refine the details.
6.  Mention that a fee evaluation can be performed once the requirements are finalized.

Conversation History:
{{#each conversationHistory}}
  {{#if isUser}}
    User: {{{this.content}}}
  {{else}}
    Assistant: {{{this.content}}}
  {{/if}}
{{/each}}

User input:
{{{userInput}}}`,
});

const aiRequirementsNavigatorFlow = ai.defineFlow(
  {
    name: 'aiRequirementsNavigatorFlow',
    inputSchema: AIRequirementsNavigatorInputSchema,
    outputSchema: AIRequirementsNavigatorOutputSchema,
  },
  async (input) => {
    // Pre-process history to add a boolean for Handlebars `if` helper
    const processedHistory = input.conversationHistory?.map(message => ({
        ...message,
        isUser: message.role === 'user'
    }));

    const {output} = await prompt({
        ...input,
        conversationHistory: processedHistory
    });
    return output!;
  }
);
