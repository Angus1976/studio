'use server';
/**
 * @fileOverview A mock flow to save a prompt to the "database".
 *
 * - savePrompt - A function that takes prompt data and simulates saving it.
 * - SavePromptInput - The input type for the savePrompt function.
 * - SavePromptOutput - The return type for the savePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SavePromptInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  scope: z.enum(['通用', '专属']),
  systemPrompt: z.string().optional(),
  userPrompt: z.string(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
  // Metadata fields that are also part of the prompt object
  metadata: z.object({
    recommendedModel: z.string().optional(),
    constraints: z.string().optional(),
    scenario: z.string().optional(),
  }).optional(),
});
export type SavePromptInput = z.infer<typeof SavePromptInputSchema>;


export const SavePromptOutputSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  message: z.string(),
});
export type SavePromptOutput = z.infer<typeof SavePromptOutputSchema>;


export async function savePrompt(input: SavePromptInput): Promise<SavePromptOutput> {
  // This is a mock implementation.
  // In a real application, this would write to Firestore.
  console.log('Simulating saving prompt:', input);
  
  const newId = input.id || `prompt-${Date.now()}`;
  
  // Here you would add logic to save to the database.
  // For now, we just return a success message.
  
  return {
    id: newId,
    success: true,
    message: '提示词已成功保存（模拟）。',
  };
}
