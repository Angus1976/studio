'use server';
/**
 * @fileOverview A flow to fetch all prompts from the Firestore database.
 *
 * - getPrompts - A function that returns a list of all prompts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import admin from '@/lib/firebase-admin';

// This can be expanded later to include access control based on user/tenant
const GetPromptsInputSchema = z.object({}); 

const PromptSchema = z.object({
    id: z.string(),
    name: z.string(),
    scope: z.enum(['通用', '专属']),
    tenantId: z.string().optional(),
    systemPrompt: z.string().optional(),
    userPrompt: z.string(),
    context: z.string().optional(),
    negativePrompt: z.string().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

const GetPromptsOutputSchema = z.array(PromptSchema);
export type GetPromptsOutput = z.infer<typeof GetPromptsOutputSchema>;


export async function getPrompts(): Promise<GetPromptsOutput> {
  const db = admin.firestore();
  
  try {
    const promptsSnapshot = await db.collection('prompts').orderBy('updatedAt', 'desc').get();
    
    if (promptsSnapshot.empty) {
      return [];
    }

    const prompts: GetPromptsOutput = promptsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || '未命名',
            scope: data.scope || '通用',
            userPrompt: data.userPrompt || '',
            systemPrompt: data.systemPrompt,
            context: data.context,
            negativePrompt: data.negativePrompt,
            tenantId: data.tenantId,
        };
    });
    
    return prompts;
  } catch (error) {
    console.error("Error fetching prompts from Firestore:", error);
    // In a real app, you might want more sophisticated error handling
    throw new Error('无法从数据库获取提示词。');
  }
}
