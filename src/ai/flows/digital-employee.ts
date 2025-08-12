
'use server';

/**
 * @fileOverview A generic digital employee flow that executes tasks based on a prompt from the library.
 *
 * - digitalEmployee - A function that takes a prompt ID and user context to generate a response.
 * - DigitalEmployeeInput - The input type for the digitalEmployee function.
 * - DigitalEmployeeOutput - The return type for the digitalEmployee function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { promptLibraryConnector } from './prompt-library-connector';

const DigitalEmployeeInputSchema = z.object({
  promptId: z.string().describe('The ID of the prompt to use from the library.'),
  promptContent: z.string().optional().describe('Optional: The raw content of the prompt, used for testing new prompts without saving them.'),
  userContext: z.string().describe('The user-provided context or question for the AI to act upon.'),
});

export type DigitalEmployeeInput = z.infer<typeof DigitalEmployeeInputSchema>;

const DigitalEmployeeOutputSchema = z.object({
  response: z.string().describe('The generated response from the AI.'),
});

export type DigitalEmployeeOutput = z.infer<typeof DigitalEmployeeOutputSchema>;

export async function digitalEmployee(
  input: DigitalEmployeeInput
): Promise<DigitalEmployeeOutput> {
  return digitalEmployeeFlow(input);
}

const digitalEmployeeFlow = ai.defineFlow(
  {
    name: 'digitalEmployeeFlow',
    inputSchema: DigitalEmployeeInputSchema,
    outputSchema: DigitalEmployeeOutputSchema,
  },
  async ({ promptId, promptContent, userContext }) => {
    let finalPromptContent: string;

    if (promptContent) {
      finalPromptContent = promptContent;
    } else {
      const { promptContent: retrievedContent } = await promptLibraryConnector({ promptId });
      finalPromptContent = retrievedContent;
    }

    // By removing the dynamic 'name' property, we let Genkit handle the internal
    // naming, which is safer and avoids potential collisions or invalid names,
    // especially when testing new, unsaved prompts with temporary IDs.
    const dynamicPrompt = ai.definePrompt({
        prompt: `${finalPromptContent}

User Context:
{{{userContext}}}
`,
        input: { schema: z.object({ userContext: z.string() }) },
    });

    const llmResponse = await dynamicPrompt({ userContext });

    return { response: llmResponse.text };
  }
);
