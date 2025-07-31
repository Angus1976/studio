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
import { googleAI } from '@genkit-ai/googleai';

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
  input: {schema: GenerateUserProfileInputSchema},
  output: {schema: GenerateUserProfileOutputSchema},
  model: googleAI('gemini-1.5-flash-latest'),
  prompt: `You are an AI assistant that generates user profiles based on user input.

  Analyze the following user input and generate a profile summary and a list of tags associated with the user.
  The tags should reflect the user's interests, preferences, and needs.

  Your response must be in Chinese.

  Input: {{{textInput}}}
  {{#if imageDataUri}}
  Image: {{media url=imageDataUri}}
  {{/if}}

  Profile Summary:
  Tags:`, // Ensure the prompt ends with 'Profile Summary:' and 'Tags:'
});

const generateUserProfileFlow = ai.defineFlow(
  {
    name: 'generateUserProfileFlow',
    inputSchema: GenerateUserProfileInputSchema,
    outputSchema: GenerateUserProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
