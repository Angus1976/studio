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

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const AIRequirementsNavigatorInputSchema = z.object({
  userInput: z.string().describe('The user input for the current turn.'),
  // We keep the history for the function input, but will format it before sending to the prompt
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

// Define a schema for the prompt that includes the pre-formatted history string
const PromptInputSchema = z.object({
    userInput: z.string(),
    formattedHistory: z.string(),
});


const prompt = ai.definePrompt({
  name: 'aiRequirementsNavigatorPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: PromptInputSchema},
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
5.  After summarizing, ask the user for confirmation. If the user confirms the requirements are complete and accurate, set isFinished to true.
6.  When isFinished is true, analyze the user's core need and suggest the most appropriate expert agent to route them to. Set the 'suggestedPromptId' field to one of the following values based on the user's primary goal: 'recruitment-expert', 'marketing-guru', or 'code-optimizer'.
7.  Mention that a fee evaluation can be performed once the requirements are finalized.

Conversation History:
{{{formattedHistory}}}

User input:
{{{userInput}}}`,
});

const aiRequirementsNavigatorFlow = ai.defineFlow(
  {
    name: 'aiRequirementsNavigatorFlow',
    inputSchema: AIRequirementsNavigatorInputSchema,
    outputSchema: AIRequirementsNavigatorOutputSchema,
  },
  async ({ userInput, conversationHistory }) => {
    
    // Pre-format the conversation history into a single string here
    const formattedHistory = (conversationHistory || [])
      .map((message: ConversationMessage) => {
        if (message.role === 'user') {
          return `User: ${message.content}`;
        }
        return `Assistant: ${message.content}`;
      })
      .join('\n');

    // Call the prompt with the pre-formatted history
    const {output} = await prompt({
        userInput,
        formattedHistory,
    });

    return output!;
  }
);
