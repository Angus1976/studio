// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Recommends products or services based on semantic analysis of available knowledge, public resources, and supplier databases.
 *
 * - recommendProductsOrServices - A function that recommends products or services.
 * - RecommendProductsOrServicesInput - The input type for the recommendProductsOrServices function.
 * - RecommendProductsOrServicesOutput - The return type for the recommendProductsOrServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendProductsOrServicesInputSchema = z.object({
  userNeeds: z.string().describe('The user needs and preferences as expressed in the conversation.'),
  userProfile: z.string().optional().describe('The user profile, automatically generated based on conversation input.'),
  availableKnowledge: z.string().describe('Available knowledge base about products and services.'),
  publicResources: z.string().describe('Information gathered from public resources.'),
  supplierDatabases: z.string().describe('Data from supplier databases.'),
});
export type RecommendProductsOrServicesInput = z.infer<typeof RecommendProductsOrServicesInputSchema>;

const RecommendProductsOrServicesOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended products or services.'),
  reasoning: z.string().describe('The reasoning behind the recommendations.'),
});
export type RecommendProductsOrServicesOutput = z.infer<typeof RecommendProductsOrServicesOutputSchema>;

export async function recommendProductsOrServices(input: RecommendProductsOrServicesInput): Promise<RecommendProductsOrServicesOutput> {
  return recommendProductsOrServicesFlow(input);
}

const recommendProductsOrServicesPrompt = ai.definePrompt({
  name: 'recommendProductsOrServicesPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: RecommendProductsOrServicesInputSchema},
  output: {schema: RecommendProductsOrServicesOutputSchema},
  prompt: `You are an AI recommendation engine that suggests products or services to users based on their needs and available information.

  Analyze the user's needs, user profile (if available), available knowledge, public resources, and supplier databases to identify the most suitable options.

  Your response must be in Chinese.

  User Needs: {{{userNeeds}}}
  User Profile: {{{userProfile}}}
  Available Knowledge: {{{availableKnowledge}}}
  Public Resources: {{{publicResources}}}
  Supplier Databases: {{{supplierDatabases}}}

  Provide a list of 3 to 5 recommended products or services, along with a clear explanation of why each recommendation is suitable for the user.

  Format your response as a JSON object with 'recommendations' (an array of product/service names) and 'reasoning' (an explanation for each recommendation).
  `, // Ensure valid JSON format
});

const recommendProductsOrServicesFlow = ai.defineFlow(
  {
    name: 'recommendProductsOrServicesFlow',
    inputSchema: RecommendProductsOrServicesInputSchema,
    outputSchema: RecommendProductsOrServicesOutputSchema,
  },
  async input => {
    const {output} = await recommendProductsOrServicesPrompt(input);
    return output!;
  }
);
