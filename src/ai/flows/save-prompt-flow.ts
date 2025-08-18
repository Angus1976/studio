
'use server';
/**
 * @fileOverview A flow to save a prompt to the Firestore database.
 *
 * - savePrompt - A function that takes prompt data and saves/updates it in Firestore.
 */

import admin from '@/lib/firebase-admin';
import {
    type SavePromptInput,
    type SavePromptOutput,
} from '@/lib/data-types';


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
          archived: false, // Ensure new prompts are not archived
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
