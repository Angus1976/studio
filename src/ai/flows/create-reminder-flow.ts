'use server';

/**
 * @fileOverview A flow to create a reminder from natural language.
 * This file is currently partially commented out because the 'genkit' dependency
 * is not installed. Refer to CONFIGURATION_README.md for more details.
 *
 * - createReminderFlow - A function that extracts reminder details from user input.
 * - CreateReminderInput - The input type for the createReminderFlow function.
 * - CreateReminderOutput - The return type for the createReminderFlow function.
 */

// import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CreateReminderInputSchema = z.object({
  userInput: z.string().describe('The user\'s natural language request to create a reminder.'),
});

export type CreateReminderInput = z.infer<typeof CreateReminderInputSchema>;

const CreateReminderOutputSchema = z.object({
  title: z.string().describe('The title or subject of the reminder.'),
  dateTime: z.string().describe('The date and time for the reminder in a human-readable format (e.g., "今天下午5点", "明天上午10点").'),
});

export type CreateReminderOutput = z.infer<typeof CreateReminderOutputSchema>;

export async function createReminderFlow(
  input: CreateReminderInput
): Promise<CreateReminderOutput> {
  // return createReminderFlowFlow(input);
  // The flow is commented out, so we return a dummy response.
  // This allows the UI to function without a real AI backend.
  return {
    title: `Reminder for "${input.userInput}"`,
    dateTime: "Tomorrow at 10 AM (Placeholder)",
  }
}

/*
const prompt = ai.definePrompt({
  name: 'createReminderPrompt',
  input: { schema: CreateReminderInputSchema },
  output: { schema: CreateReminderOutputSchema },
  prompt: `You are an assistant that helps users create reminders from natural language. Analyze the user's input and extract the title of the reminder and the specific date and time. Today's date is ${new Date().toLocaleDateString()}.

User Input: {{{userInput}}}

Extract the information and provide it in the specified format.`,
});

const createReminderFlowFlow = ai.defineFlow(
  {
    name: 'createReminderFlow',
    inputSchema: CreateReminderInputSchema,
    outputSchema: CreateReminderOutputSchema,
  },
  async ({ userInput }) => {
    const { output } = await prompt({ userInput });
    if (!output) {
      throw new Error('Failed to extract reminder details from the prompt.');
    }
    return output;
  }
);
*/
