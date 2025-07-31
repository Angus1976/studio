
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a user profile from text and image inputs.
 *
 * - generateUserProfile - A function that generates a user profile based on user inputs.
 * - GenerateUserProfileInput - The input type for the generateUserProfile function.
 * - GenerateUserProfileOutput - The return type for the generateUserProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUserProfileInputSchema = z.object({
  textInput: z
    .string()
    .describe('Text input from the user describing their needs and preferences.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "Optional image data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateUserProfileInput = z.infer<typeof GenerateUserProfileInputSchema>;

const GenerateUserProfileOutputSchema = z.object({
  profileSummary: z
    .string()
    .describe('A summary of the generated user profile.'),
  tags: z.array(z.string()).describe('An array of tags associated with the user.'),
});
export type GenerateUserProfileOutput = z.infer<typeof GenerateUserProfileOutputSchema>;

export async function generateUserProfile(
  input: GenerateUserProfileInput
): Promise<GenerateUserProfileOutput> {
  return generateUserProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUserProfilePrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: GenerateUserProfileInputSchema},
  output: {schema: GenerateUserProfileOutputSchema},
  prompt: `You are an AI assistant that generates user profiles based on user input.

  Your primary goal is to analyze the user's request, which can be text, an image, or both, to understand their needs and generate an accurate profile summary and a list of relevant tags.

  If an image is provided, your analysis should start with the image. Identify the main objects, scenes, and any key features within the picture. These visual cues are the most important part of the user's request.
  - If the user provides text along with the image, use the text to refine the request (e.g., "find a similar dress but in blue" or "what is this flower?").
  - If no text is provided, your analysis should be based purely on the image content. The user wants to find what's in the picture or something very similar.

  If only text is provided, analyze the text for the user's interests, preferences, and needs.

  Your response must be in Chinese.

  Input: {{{textInput}}}
  {{#if imageDataUri}}
  Image: {{media url=imageDataUri}}
  {{/if}}`,
});

const generateUserProfileFlow = ai.defineFlow(
  {
    name: 'generateUserProfileFlow',
    inputSchema: GenerateUserProfileInputSchema,
    outputSchema: GenerateUserProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid profile.");
    }
    return output;
  }
);
