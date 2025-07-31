
'use server';

/**
 * @fileOverview A flow that gets recommendations for a user based on their needs.
 * This flow orchestrates other flows to generate a user profile, search for relevant information,
 * and then generate recommendations.
 *
 * - getRecommendations - A function that gets recommendations.
 * - GetRecommendationsInput - The input type for the getRecommendations function.
 * - GetRecommendationsOutput - The return type for the getRecommendations function (same as RecommendProductsOrServicesOutput).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  intelligentSearch,
} from '@/ai/flows/intelligent-search';
import {
  recommendProductsOrServices,
  RecommendProductsOrServicesOutput,
} from '@/ai/flows/recommend-products-or-services';


const GetRecommendationsInputSchema = z.object({
  userNeeds: z.string().describe('The user needs and preferences as expressed in the conversation.'),
  userProfile: z.string().optional().describe('The user profile, automatically generated based on conversation input.'),
  knowledgeBase: z.string().describe('The knowledge base of products and services.'),
  publicResources: z.string().describe('Publicly available information and resources.'),
  supplierDatabases: z.string().describe('Databases of available suppliers.'),
});
export type GetRecommendationsInput = z.infer<typeof GetRecommendationsInputSchema>;
export type GetRecommendationsOutput = RecommendProductsOrServicesOutput;

export async function getRecommendations(
  input: GetRecommendationsInput
): Promise<GetRecommendationsOutput> {
  return getRecommendationsFlow(input);
}

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: GetRecommendationsInputSchema,
    outputSchema: z.custom<GetRecommendationsOutput>(),
  },
  async (input) => {
    // Perform an intelligent search on the provided knowledge base
    const searchResults = await intelligentSearch({
      query: input.userNeeds,
      knowledgeBase: input.knowledgeBase,
    });

    // Generate recommendations based on user needs, profile, and various data sources
    const recommendations = await recommendProductsOrServices({
      userNeeds: input.userNeeds,
      userProfile: input.userProfile,
      availableKnowledge: JSON.stringify(searchResults.results),
      publicResources: input.publicResources,
      supplierDatabases: input.supplierDatabases,
    });

    return recommendations;
  }
);
