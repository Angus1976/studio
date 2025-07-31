'use server';

/**
 * @fileOverview A flow that performs an intelligent search within a knowledge base.
 *
 * - intelligentSearch - A function that performs the search.
 * - IntelligentSearchInput - The input type for the intelligentSearch function.
 * - IntelligentSearchOutput - The return type for the intelligentSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
  knowledgeBase: z.string().describe('The knowledge base to search within.'),
});
export type IntelligentSearchInput = z.infer<typeof IntelligentSearchInputSchema>;

const SearchResultItemSchema = z.object({
    title: z.string().describe('The title of the search result item.'),
    snippet: z.string().describe('A brief summary or relevant snippet of the result.'),
    relevance: z.number().min(0).max(1).describe('A relevance score between 0 and 1 (1 being most relevant).'),
});

const IntelligentSearchOutputSchema = z.object({
  results: z.array(SearchResultItemSchema).describe('A list of search results.'),
});
export type IntelligentSearchOutput = z.infer<typeof IntelligentSearchOutputSchema>;

export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  return intelligentSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSearchPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: IntelligentSearchInputSchema},
  output: {schema: IntelligentSearchOutputSchema},
  prompt: `You are an AI-powered search engine. Your task is to find the most relevant information from the provided knowledge base based on the user's query.

Your response must be in Chinese.

Knowledge Base:
"""
{{{knowledgeBase}}}
"""

User Query: "{{{query}}}"

Analyze the query and the knowledge base, and return a list of relevant results. For each result, provide a title, a short snippet, and a relevance score from 0 to 1.`,
});

const intelligentSearchFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFlow',
    inputSchema: IntelligentSearchInputSchema,
    outputSchema: IntelligentSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
