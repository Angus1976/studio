'use server';

/**
 * @fileOverview A flow to create a reminder from natural language.
 *
 * - createReminderFlow - A function that extracts reminder details from user input.
 * - CreateReminderInput - The input type for the createReminderFlow function.
 * - CreateReminderOutput - The return type for the createReminderFlow function.
 */

// NOTE: All Genkit-related functionality is currently commented out
// due to dependency issues with next@14. To re-enable, see CONFIGURATION_README.md.

// MOCK IMPLEMENTATION
export type CreateReminderInput = {
  userInput: string;
};

export type CreateReminderOutput = {
  title: string;
  dateTime: string;
};

export async function createReminderFlow(
  input: CreateReminderInput
): Promise<CreateReminderOutput> {
  // Simple mock implementation
  const title = input.userInput.replace(/提醒我/g, '').replace(/安排/g, '').trim();
  const dateTime = "今天下午5点"; // Mocked time
  return Promise.resolve({ title: title || '未命名提醒', dateTime });
}

// import { ai } from '@/ai/genkit';
// import { z } from 'zod';

// const CreateReminderInputSchema = z.object({
//   userInput: z.string().describe('The user\'s natural language request to create a reminder.'),
// });

// export type CreateReminderInput = z.infer<typeof CreateReminderInputSchema>;

// const CreateReminderOutputSchema = z.object({
//   title: z.string().describe('The title or subject of the reminder.'),
//   dateTime: z.string().describe('The date and time for the reminder in a human-readable format (e.g., "今天下午5点", "明天上午10点").'),
// });

// export type CreateReminderOutput = z.infer<typeof CreateReminderOutputSchema>;

// export async function createReminderFlow(
//   input: CreateReminderInput
// ): Promise<CreateReminderOutput> {
//   return createReminderFlowFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'createReminderPrompt',
//   input: { schema: CreateReminderInputSchema },
//   output: { schema: CreateReminderOutputSchema },
//   prompt: `You are an assistant that helps users create reminders from natural language. Analyze the user's input and extract the title of the reminder and the specific date and time. Today's date is ${new Date().toLocaleDateString()}.

// User Input: {{{userInput}}}

// Extract the information and provide it in the specified format.`,
// });

// const createReminderFlowFlow = ai.defineFlow(
//   {
//     name: 'createReminderFlow',
//     inputSchema: CreateReminderInputSchema,
//     outputSchema: CreateReminderOutputSchema,
//   },
//   async ({ userInput }) => {
//     const { output } = await prompt({ userInput });
//     if (!output) {
//       throw new Error('Failed to extract reminder details from the prompt.');
//     }
//     return output;
//   }
// );
