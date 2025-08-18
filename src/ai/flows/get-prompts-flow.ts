
'use server';
/**
 * @fileOverview A flow to fetch all prompts from the Firestore database.
 *
 * - getPrompts - A function that returns a list of all prompts.
 */

import admin from '@/lib/firebase-admin';
import { type GetPromptsOutput } from '@/lib/data-types';


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
        return {
            id: doc.id,
            name: data.name || '未命名',
            expertId: data.expertId || 'general-expert', // Default to a general expert if not set
            userPrompt: data.userPrompt || '',
            systemPrompt: data.systemPrompt,
            context: data.context,
            negativePrompt: data.negativePrompt,
            tenantId: data.tenantId,
            archived: data.archived || false,
        };
    });
    
    return prompts;
  } catch (error) {
    console.error("Error fetching prompts from Firestore:", error);
    // In a real app, you might want more sophisticated error handling
    throw new Error('无法从数据库获取提示词。');
  }
}
