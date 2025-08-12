'use server';

/**
 * @fileOverview A flow to connect to a prompt library and retrieve prompts.
 *
 * - promptLibraryConnector - A function that retrieves a prompt from the library.
 * - PromptLibraryConnectorInput - The input type for the promptLibraryConnector function.
 * - PromptLibraryConnectorOutput - The return type for the promptLibraryConnector function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// A dummy prompt library for demonstration purposes.
// In a real application, this would be a database or an external API call.
const promptLibrary: Record<string, { title: string; content: string }> = {
  'recruitment-expert': {
    title: '招聘专家提示',
    content: 'You are an expert recruitment specialist. Analyze the provided job description and candidate resume to determine suitability.',
  },
  'marketing-guru': {
    title: '营销大师提示',
    content: 'You are a marketing guru. Generate three creative and engaging social media posts based on the following product description.',
  },
  'code-optimizer': {
    title: '代码优化器提示',
    content: 'You are a code optimization expert. Review the following code snippet and provide suggestions to improve its performance and readability.',
  },
};

const PromptLibraryConnectorInputSchema = z.object({
  promptId: z.string().describe('The unique identifier for the prompt in the library.'),
});

export type PromptLibraryConnectorInput = z.infer<typeof PromptLibraryConnectorInputSchema>;

const PromptLibraryConnectorOutputSchema = z.object({
  promptTitle: z.string().describe('The title of the retrieved prompt.'),
  promptContent: z.string().describe('The content of the retrieved prompt.'),
});

export type PromptLibraryConnectorOutput = z.infer<typeof PromptLibraryConnectorOutputSchema>;


export async function promptLibraryConnector(
  input: PromptLibraryConnectorInput
): Promise<PromptLibraryConnectorOutput> {
  return promptLibraryConnectorFlow(input);
}

const promptLibraryConnectorFlow = ai.defineFlow(
  {
    name: 'promptLibraryConnectorFlow',
    inputSchema: PromptLibraryConnectorInputSchema,
    outputSchema: PromptLibraryConnectorOutputSchema,
  },
  async ({ promptId }) => {
    console.log(`Attempting to retrieve prompt with ID: ${promptId}`);
    
    const prompt = promptLibrary[promptId];

    if (!prompt) {
      console.error(`Prompt with ID "${promptId}" not found.`);
      throw new Error(`Prompt with ID "${promptId}" not found.`);
    }

    console.log(`Successfully retrieved prompt: "${prompt.title}"`);
    
    return {
      promptTitle: prompt.title,
      promptContent: prompt.content,
    };
  }
);
