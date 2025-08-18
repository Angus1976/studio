'use server';
/**
 * @fileOverview A flow to save a prompt to the Firestore database.
 *
 * - savePrompt - A function that takes prompt data and saves/updates it in Firestore.
 * - SavePromptInput - The input type for the savePrompt function.
 * - SavePromptOutput - The return type for the savePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import admin from '@/lib/firebase-admin';

export const SavePromptInputSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  expertId: z.string(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
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
  const db = admin.firestore();
  
  try {
    let docRef;
    const { id, ...promptData } = input;
    const dataToSave = {
        ...promptData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (id) {
      // Update existing document
      docRef = db.collection('prompts').doc(id);
      await docRef.set(dataToSave, { merge: true });
      return {
        id: id,
        success: true,
        message: '提示词已成功更新。',
      };
    } else {
      // Create new document
      const dataWithTimestamp = {
          ...dataToSave,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      docRef = await db.collection('prompts').add(dataWithTimestamp);
      return {
        id: docRef.id,
        success: true,
        message: '提示词已成功保存。',
      };
    }
  } catch (error) {
    console.error("Error saving prompt to Firestore:", error);
    return {
        id: input.id || '',
        success: false,
        message: '保存提示词时发生错误。'
    }
  }
}
