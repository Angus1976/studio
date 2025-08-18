
'use server';
/**
 * @fileOverview A flow to fetch all prompts from the Firestore database.
 *
 * - getPrompts - A function that returns a list of all prompts.
 */

import admin from '@/lib/firebase-admin';
import { type GetPromptsOutput, PromptSchema } from '@/lib/data-types';


export async function getPrompts(): Promise<GetPromptsOutput> {
  const db = admin.firestore();
  
  try {
    // Filter out archived prompts.
    const promptsSnapshot = await db.collection('prompts')
        .where('archived', '!=', true)
        .orderBy('updatedAt', 'desc')
        .get();
    
    if (promptsSnapshot.empty) {
      return [];
    }

    const prompts: GetPromptsOutput = promptsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Zod parsing to ensure data integrity
        const parsedData = PromptSchema.safeParse({
            id: doc.id,
            ...data,
        });

        if (!parsedData.success) {
            console.warn(`Skipping invalid prompt object from Firestore: ${doc.id}`, parsedData.error);
            return null;
        }

        return parsedData.data;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
    
    return prompts;
  } catch (error) {
    console.error("Error fetching prompts from Firestore:", error);
    // In a real app, you might want more sophisticated error handling
    throw new Error('无法从数据库获取提示词。');
  }
}
