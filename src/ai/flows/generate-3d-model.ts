'use server';

/**
 * @fileOverview A flow to generate a 3D model concept image from a text prompt.
 *
 * - generate3dModel - A function that generates a 3D model concept.
 * - Generate3dModelInput - The input type for the generate3dModel function.
 * - Generate3dModelOutput - The return type for the generate3dModel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const Generate3dModelInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the 3D model from.'),
});
export type Generate3dModelInput = z.infer<typeof Generate3dModelInputSchema>;

const Generate3dModelOutputSchema = z.object({
  modelDataUri: z
    .string()
    .describe(
      "A generated preview image of a 3D model, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type Generate3dModelOutput = z.infer<typeof Generate3dModelOutputSchema>;

export async function generate3dModel(input: Generate3dModelInput): Promise<Generate3dModelOutput> {
  return generate3dModelFlow(input);
}

const generate3dModelFlow = ai.defineFlow(
  {
    name: 'generate3dModelFlow',
    inputSchema: Generate3dModelInputSchema,
    outputSchema: Generate3dModelOutputSchema,
  },
  async ({prompt}) => {
    
    const fullPrompt = `Generate a high-quality, professional 3D model rendering based on the following description. The model should be centered on a clean, neutral background. Prompt: "${prompt}"`;
    
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    const imageUrl = media.url;
    if (!imageUrl) {
        throw new Error('Failed to generate 3D model image.');
    }

    return { modelDataUri: imageUrl };
  }
);
