'use server';

/**
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
  prompt: `You are an AI assistant designed to guide users in articulating their needs for AI-driven workflows through a conversational interface. Analyze their input and extract key requirements effectively. 

Follow these steps:
1.  Start by introducing yourself and explaining that you will guide the user to define their needs for an AI-driven workflow.
2.  Ask clarifying question about the kind of the desired workflow.
3.  Based on the user input, keep the conversation going until the user is satisfied with the requirements that are being gathered.
4.  Extract key requirements from the conversation.
5.  Once you have the final requirements, set isFinished to true. If not, set to false.


Conversation History:
{{#each conversationHistory}}
  {{#if (eq role 'user')}}
    User: {{{content}}}
  {{else}}
    Assistant: {{{content}}}
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
    const {output} = await prompt(input);
    return output!;
  }
);
