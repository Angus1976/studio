'use server';

/**
 * @fileOverview A generic flow to execute a structured prompt with variables.
 *
 * - executePrompt - A function that takes prompt components and variables to generate a response.
 * - PromptExecutionInput - The input type for the executePrompt function.
 * - PromptExecutionOutput - The return type for the executePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Handlebars from 'handlebars';
import { Part } from 'genkit/cohere';

const PromptExecutionInputSchema = z.object({
  systemPrompt: z.string().optional().describe('The system prompt to guide the AI.'),
  userPrompt: z.string().describe('The main user prompt, which can contain Handlebars variables like {{variable}}.'),
  context: z.string().optional().describe('Additional context or examples for the AI.'),
  negativePrompt: z.string().optional().describe('Content that the model should avoid generating.'),
  variables: z.record(z.string()).optional().describe('A key-value object for replacing variables in the user prompt.'),
  temperature: z.number().min(0).max(1).optional().describe('The temperature for the model.'),
});

export type PromptExecutionInput = z.infer<typeof PromptExecutionInputSchema>;

const PromptExecutionOutputSchema = z.object({
  response: z.string().describe('The generated response from the AI.'),
});

export type PromptExecutionOutput = z.infer<typeof PromptExecutionOutputSchema>;

export async function executePrompt(
  input: PromptExecutionInput
): Promise<PromptExecutionOutput> {
  return promptExecutionFlow(input);
}

const promptExecutionFlow = ai.defineFlow(
  {
    name: 'promptExecutionFlow',
    inputSchema: PromptExecutionInputSchema,
    outputSchema: PromptExecutionOutputSchema,
  },
  async ({ systemPrompt, userPrompt, context, negativePrompt, variables, temperature }) => {

    const template = Handlebars.compile(userPrompt);
    const finalUserPrompt = template(variables || {});
    
    // Construct the prompt with structured roles for better model performance
    const prompt: Part[] = [];

    if (systemPrompt) {
        prompt.push({ role: 'system', content: [{text: systemPrompt}] });
    }

    const userParts = [];
    if(context) {
        userParts.push({ text: `Context/Examples:\n${context}\n\n---\n\n` });
    }
    userParts.push({ text: `User Instruction:\n${finalUserPrompt}`});

    prompt.push({ role: 'user', content: userParts });
    
    // Configure safety settings to handle the negative prompt
    const safetySettings = [];
    if (negativePrompt) {
        safetySettings.push({
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
            // This is a way to use safety settings to simulate a negative prompt
            // by blocking content that matches the negative prompt.
            // Note: This is a creative use of the feature and effectiveness may vary.
            // A more robust solution might require a different model or fine-tuning.
            // For this implementation, we are informing the model to avoid this content.
            // The prompt structure will also be updated to reflect this.
        });
        // Also, add the negative prompt to the system prompt if possible
        const updatedSystemPrompt = `${systemPrompt || ''}\n\nIMPORTANT: Do not include any of the following in your response: "${negativePrompt}"`.trim();
        const systemPromptIndex = prompt.findIndex(p => p.role === 'system');
        if (systemPromptIndex !== -1) {
            prompt[systemPromptIndex] = { role: 'system', content: [{text: updatedSystemPrompt}]};
        } else {
             prompt.unshift({ role: 'system', content: [{text: updatedSystemPrompt}] });
        }
    }


    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: temperature,
        safetySettings,
      },
    });

    return { response: llmResponse.text };
  }
);
