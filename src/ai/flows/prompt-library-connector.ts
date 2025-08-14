'use server';

/**
 * @fileOverview A flow to connect to a prompt library and retrieve prompts.
 *
 * - promptLibraryConnector - A function that retrieves a prompt from the library.
 * - PromptLibraryConnectorInput - The input type for the promptLibraryConnector function.
 * - PromptLibraryConnectorOutput - The return type for the promptLibraryConnector function.
 */

// NOTE: All Genkit-related functionality is currently commented out
// due to dependency issues with next@14. To re-enable, see CONFIGURATION_README.md.

// REAL IMPLEMENTATION using Firestore
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";

export type ScenarioData = {
  id: string;
  title: string;
  description: string;
  industry: string;
  task: string;
  prompt: string;
};


export type PromptLibraryConnectorInput = {
  promptId: string;
};

export type PromptLibraryConnectorOutput = {
  promptTitle: string;
  promptContent: string;
};

export async function promptLibraryConnector(
  input: PromptLibraryConnectorInput
): Promise<PromptLibraryConnectorOutput> {
  const scenarioDocRef = doc(db, "scenarios", input.promptId);
  const scenarioDoc = await getDoc(scenarioDocRef);

  if (!scenarioDoc.exists()) {
      throw new Error(`Prompt with ID "${input.promptId}" not found in Firestore.`);
  }
  const scenarioData = scenarioDoc.data() as Omit<ScenarioData, 'id'>;
  
  return {
      promptTitle: scenarioData.title,
      promptContent: scenarioData.prompt,
  };
}


// import { ai } from '@/ai/genkit';
// import { z } from 'zod';

// const PromptLibraryConnectorInputSchema = z.object({
//   promptId: z.string().describe('The unique identifier for the prompt in the library.'),
// });

// export type PromptLibraryConnectorInput = z.infer<typeof PromptLibraryConnectorInputSchema>;

// const PromptLibraryConnectorOutputSchema = z.object({
//   promptTitle: z.string().describe('The title of the retrieved prompt.'),
//   promptContent: z.string().describe('The content of the retrieved prompt.'),
// });

// export type PromptLibraryConnectorOutput = z.infer<typeof PromptLibraryConnectorOutputSchema>;


// export async function promptLibraryConnector(
//   input: PromptLibraryConnectorInput
// ): Promise<PromptLibraryConnectorOutput> {
//   return promptLibraryConnectorFlow(input);
// }

// const promptLibraryConnectorFlow = ai.defineFlow(
//   {
//     name: 'promptLibraryConnectorFlow',
//     inputSchema: PromptLibraryConnectorInputSchema,
//     outputSchema: PromptLibraryConnectorOutputSchema,
//   },
//   async ({ promptId }) => {
//     console.log(`Attempting to retrieve prompt with ID: ${promptId}`);
    
//     const prompt = promptLibrary[promptId];

//     if (!prompt) {
//       console.error(`Prompt with ID "${promptId}" not found.`);
//       throw new Error(`Prompt with ID "${promptId}" not found.`);
//     }

//     console.log(`Successfully retrieved prompt: "${prompt.title}"`);
    
//     return {
//       promptTitle: prompt.title,
//       promptContent: prompt.content,
//     };
//   }
// );
