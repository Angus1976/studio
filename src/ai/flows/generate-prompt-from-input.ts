'use server';

/**
 * @fileOverview A flow that dynamically generates prompts based on user input and a structured prompt library.
 *
 * - generatePrompt - A function that generates a prompt based on the input.
 * - GeneratePromptInput - The input type for the generatePrompt function.
 * - GeneratePromptOutput - The return type for the generatePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptInputSchema = z.object({
  userInput: z.string().describe('The user input to generate the prompt from.'),
  promptTemplate: z.string().describe('The template to use.'),
});
export type GeneratePromptInput = z.infer<typeof GeneratePromptInputSchema>;

const GeneratePromptOutputSchema = z.object({
  generatedPrompt: z.string().describe('The generated prompt.'),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;

export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptPrompt',
  input: {schema: GeneratePromptInputSchema},
  output: {schema: GeneratePromptOutputSchema},
  prompt: `Generate a prompt based on the user input and the prompt template.\n\nUser Input: {{{userInput}}}\nPrompt Template: {{{promptTemplate}}}`,
});

const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: GeneratePromptInputSchema,
    outputSchema: GeneratePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
