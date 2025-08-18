'use server';
/**
 * @fileOverview An AI flow for analyzing corporate organizational structures.
 *
 * - analyzeOrgStructure - A function that takes organizational info and company context to provide analysis.
 * - AnalyzeOrgStructureInput - The input type for the analyzeOrgStructure function.
 * - AnalyzeOrgStructureOutput - The return type for the analyzeOrgStructure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const AnalyzeOrgStructureInputSchema = z.object({
  orgInfo: z
    .string()
    .describe(
      'A textual representation of the company\'s organizational structure, often as a hierarchical list.'
    ),
  companyContext: z
    .string()
    .optional()
    .describe(
      'Additional context about the company, such as industry, business, revenue, profit, and number of employees.'
    ),
});
export type AnalyzeOrgStructureInput = z.infer<
  typeof AnalyzeOrgStructureInputSchema
>;

export const AnalyzeOrgStructureOutputSchema = z.object({
  decisionPoints: z
    .string()
    .describe('Key decision-making nodes or roles within the structure.'),
  potentialBottlenecks: z
    .string()
    .describe('Potential bottlenecks in communication or workflow.'),
  improvementSuggestions: z
    .string()
    .describe('Actionable suggestions for improving the organizational structure.'),
});
export type AnalyzeOrgStructureOutput = z.infer<
  typeof AnalyzeOrgStructureOutputSchema
>;

export async function analyzeOrgStructure(
  input: AnalyzeOrgStructureInput
): Promise<AnalyzeOrgStructureOutput> {
  return analyzeOrgStructureFlow(input);
}

const analyzeOrgStructureFlow = ai.defineFlow(
  {
    name: 'analyzeOrgStructureFlow',
    inputSchema: AnalyzeOrgStructureInputSchema,
    outputSchema: AnalyzeOrgStructureOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert organizational management consultant. Your task is to analyze the provided organizational structure and company context.

Based on your analysis, you must identify:
1.  **Key Decision Points**: The individuals or departments that hold significant decision-making power.
2.  **Potential Bottlenecks**: Areas where communication, workflow, or decision-making might slow down or get stuck.
3.  **Improvement Suggestions**: Concrete, actionable advice to optimize the structure for better efficiency and communication.

Return your analysis in a structured JSON format.

**Organizational Structure:**
\`\`\`
${input.orgInfo}
\`\`\`

**Company Context:**
\`\`\`
${input.companyContext || 'No additional context provided.'}
\`\`\`
`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: AnalyzeOrgStructureOutputSchema,
      },
    });

    const result = llmResponse.output();
    if (!result) {
        throw new Error("AI failed to return a structured analysis.");
    }
    return result;
  }
);
