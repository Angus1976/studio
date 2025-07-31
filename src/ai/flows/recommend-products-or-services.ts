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

const ProductSchema = z.object({
    name: z.string().describe('The name of the recommended product or service.'),
    description: z.string().describe('A brief description of the product or service.'),
    image: z.string().url().describe('A URL to an image of the product or service.'),
    price: z.string().describe('The price of the product or service.'),
    purchaseUrl: z.string().url().describe('The URL where the user can purchase the product or service.'),
});

const RecommendProductsOrServicesOutputSchema = z.object({
  recommendations: z.array(ProductSchema).describe('A list of recommended products or services, between 3 and 5 items.'),
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

  Provide a list of 3 to 5 recommended products or services. For each, you must provide a name, description, image URL, price, and a purchase URL, extracting this information directly from the provided knowledge base.
  Also provide a clear explanation of why these recommendations are suitable for the user.
  `,
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
