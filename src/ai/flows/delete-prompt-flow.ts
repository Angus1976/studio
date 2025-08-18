
'use server';
/**
 * @fileOverview A flow to logically delete a prompt in the Firestore database.
 *
 * - deletePrompt - A function that marks a prompt as 'archived'.
 * - DeletePromptInput - The input type for the deletePrompt function.
 * - DeletePromptOutput - The return type for the deletePrompt function.
 */

import { z } from 'zod';
import admin from '@/lib/firebase-admin';

export const DeletePromptInputSchema = z.object({
  id: z.string(),
});
export type DeletePromptInput = z.infer<typeof DeletePromptInputSchema>;


export const DeletePromptOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeletePromptOutput = z.infer<typeof DeletePromptOutputSchema>;


export async function deletePrompt(input: DeletePromptInput): Promise<DeletePromptOutput> {
  const db = admin.firestore();
  
  try {
    const docRef = db.collection('prompts').doc(input.id);
    
    // Perform a logical delete by setting an 'archived' flag.
    await docRef.update({
        archived: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        message: '提示词已成功归档。',
    };

  } catch (error) {
    console.error("Error archiving prompt in Firestore:", error);
    return {
        success: false,
        message: '归档提示词时发生错误。'
    }
  }
}
