'use server';

/**
 * @fileOverview A generic flow to execute a structured prompt with variables.
 *
 * - executePrompt - A function that takes prompt components and variables to generate a response.
 */

import { ai } from '@/ai/genkit';
import Handlebars from 'handlebars';
import { Part } from 'genkit/ai';
import { 
    PromptExecutionInputSchema,
    PromptExecutionOutputSchema,
    type PromptExecutionInput,
    type PromptExecutionOutput,
} from '@/lib/data-types';

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
    
    let systemInstruction = systemPrompt || '';
    if (negativePrompt) {
       systemInstruction += `\n\nIMPORTANT: Do not include any of the following in your response: "${negativePrompt}"`.trim();
    }
    
    // Construct the prompt with structured roles for better model performance
    const prompt: Part[] = [];

    if (systemInstruction) {
        prompt.push({ role: 'system', content: [{text: systemInstruction}] });
    }

    const userContent: Part[] = [];
    if(context) {
        userContent.push({ text: `Context/Examples:\n${context}\n\n---\n\n` });
    }
    userContent.push({ text: `User Instruction:\n${finalUserPrompt}`});
    
    prompt.push({ role: 'user', content: userContent });
    
    // Configure safety settings - this is illustrative; actual negative prompt handling is now in system prompt
    const safetySettings = [];
    if (negativePrompt) {
        safetySettings.push({
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
        });
    }

    const model = 'googleai/gemini-1.5-flash';

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: model,
      config: {
        temperature: temperature,
        safetySettings,
      },
    });

    return { response: llmResponse.text };
  }
);
