
'use server';
/**
 * @fileOverview A flow to fetch all prompts from the Firestore database.
 *
 * - getPrompts - A function that returns a list of all prompts.
 */
import * as admin from 'firebase-admin';
import { type GetPromptsOutput, PromptSchema } from '@/lib/data-types';


// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
        });
    } catch (error: any) {
        console.error('Firebase admin initialization error in get-prompts-flow', error.stack);
    }
}


export async function getPrompts(): Promise<GetPromptsOutput> {
  const db = admin.firestore();
  
  try {
    // Firestore requires a composite index for queries with inequalities and ordering on different fields.
    // To avoid needing to create this index manually in the Firebase console,
    // we will filter first, and then sort the results in code.
    const promptsSnapshot = await db.collection('prompts')
        .where('archived', '!=', true)
        .get();
    
    if (promptsSnapshot.empty) {
      return [];
    }

    const prompts: GetPromptsOutput = promptsSnapshot.docs.map(doc => {
        const data = doc.data();
        const parsedData = PromptSchema.safeParse({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to strings if they exist
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
        });

        if (!parsedData.success) {
            console.warn(`Skipping invalid prompt object from Firestore: ${doc.id}`, parsedData.error);
            return null;
        }

        return parsedData.data;
    }).filter((p): p is NonNullable<typeof p> => p !== null);
    
    // Sort the prompts by updatedAt date in descending order (newest first)
    prompts.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });

    return prompts;
  } catch (error) {
    console.error("Error fetching prompts from Firestore:", error);
    // In a real app, you might want more sophisticated error handling
    throw new Error('无法从数据库获取提示词。');
  }
}
