// This is an AI-powered scenario architect that generates optimized work scenarios based on user requirements, identifies tasks suitable for AI automation, and provides improvement suggestions.
// It exports the AIScenarioArchitectInput and AIScenarioArchitectOutput types, along with the aiScenarioArchitect function to trigger the flow.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AIScenarioArchitectInputSchema = z.object({
  userRequirements: z.string().describe('Detailed description of user requirements for the AI-driven workflow.'),
});

export type AIScenarioArchitectInput = z.infer<typeof AIScenarioArchitectInputSchema>;

const AIScenarioArchitectOutputSchema = z.object({
  optimizedScenario: z.string().describe('A detailed description of the optimized work scenario.'),
  aiAutomatableTasks: z.string().describe('A list of tasks within the scenario that are suitable for AI automation.'),
  improvementSuggestions: z.string().describe('Suggestions for improving the workflow and leveraging AI effectively.'),
});

export type AIScenarioArchitectOutput = z.infer<typeof AIScenarioArchitectOutputSchema>;

export async function aiScenarioArchitect(input: AIScenarioArchitectInput): Promise<AIScenarioArchitectOutput> {
  return aiScenarioArchitectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiScenarioArchitectPrompt',
  input: {schema: AIScenarioArchitectInputSchema},
  output: {schema: AIScenarioArchitectOutputSchema},
  prompt: `Based on the following user requirements, generate an optimized work scenario, identify tasks suitable for AI automation, and provide improvement suggestions.

User Requirements: {{{userRequirements}}}

Optimized Scenario: A detailed description of the optimized work scenario.
AI Automatable Tasks: A list of tasks within the scenario that are suitable for AI automation.
Improvement Suggestions: Suggestions for improving the workflow and leveraging AI effectively.`,
});

const aiScenarioArchitectFlow = ai.defineFlow(
  {
    name: 'aiScenarioArchitectFlow',
    inputSchema: AIScenarioArchitectInputSchema,
    outputSchema: AIScenarioArchitectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
