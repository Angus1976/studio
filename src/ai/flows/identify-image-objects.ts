
'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying objects in an image.
 *
 * - identifyImageObjects - A function that identifies objects in an image.
 * - IdentifyImageObjectsInput - The input type for the identifyImageObjects function.
 * - IdentifyImageObjectsOutput - The return type for the identifyImageObjects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyImageObjectsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "Image data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyImageObjectsInput = z.infer<typeof IdentifyImageObjectsInputSchema>;

const IdentifyImageObjectsOutputSchema = z.object({
  identifiedObject: z
    .string()
    .describe('The primary object identified in the image.'),
  tags: z.array(z.string()).describe('An array of tags associated with the identified object.'),
});
export type IdentifyImageObjectsOutput = z.infer<typeof IdentifyImageObjectsOutputSchema>;

export async function identifyImageObjects(
  input: IdentifyImageObjectsInput
): Promise<IdentifyImageObjectsOutput> {
  return identifyImageObjectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyImageObjectsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: IdentifyImageObjectsInputSchema},
  output: {schema: IdentifyImageObjectsOutputSchema},
  prompt: `You are an AI assistant that identifies the primary object in an image.

  Your goal is to analyze the image and determine what the main subject is.
  Based on the main subject, generate a concise name for the identified object and a list of relevant tags.

  Your response must be in Chinese.

  Image: {{media url=imageDataUri}}
  `,
});

const identifyImageObjectsFlow = ai.defineFlow(
  {
    name: 'identifyImageObjectsFlow',
    inputSchema: IdentifyImageObjectsInputSchema,
    outputSchema: IdentifyImageObjectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to identify the image.");
    }
    return output;
  }
);
