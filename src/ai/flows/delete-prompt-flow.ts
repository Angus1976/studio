
'use server';
/**
 * @fileOverview A flow to logically delete a prompt in the Firestore database.
 *
 * - deletePrompt - A function that marks a prompt as 'archived'.
 */
import * as admin from 'firebase-admin';
import { 
    type DeletePromptInput, 
    type DeletePromptOutput 
} from '@/lib/data-types';

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
        console.error('Firebase admin initialization error in delete-prompt-flow', error.stack);
    }
}

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
