'use server';

/**
 * @fileOverview An AI flow to analyze a company's organizational structure and processes.
 *
 * - analyzeOrgStructure - A function that takes organizational information and returns an analysis.
 * - AnalyzeOrgStructureInput - The input type for the analyzeOrgStructure function.
 * - AnalyzeOrgStructureOutput - The return type for the analyzeOrgStructure function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeOrgStructureInputSchema = z.object({
  orgInfo: z.string().describe(
    "A detailed text description of the company's organizational structure, including hierarchy, departments, and roles."
  ),
  companyContext: z.string().describe(
    "A summary of the company's basic information, including industry, business operations, revenue, profit, number of employees, and other custom-defined fields. This provides context for the organizational analysis."
  )
});

export type AnalyzeOrgStructureInput = z.infer<typeof AnalyzeOrgStructureInputSchema>;

const AnalyzeOrgStructureOutputSchema = z.object({
  decisionPoints: z.string().describe('A summary of the key decision-making points and roles in the organization.'),
  potentialBottlenecks: z.string().describe('An analysis of potential bottlenecks or inefficiencies in the described processes.'),
  improvementSuggestions: z.string().describe('Actionable suggestions for improving the organizational structure or processes.'),
});

export type AnalyzeOrgStructureOutput = z.infer<typeof AnalyzeOrgStructureOutputSchema>;

export async function analyzeOrgStructure(input: AnalyzeOrgStructureInput): Promise<AnalyzeOrgStructureOutput> {
  return analyzeOrgStructureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOrgStructurePrompt',
  input: { schema: AnalyzeOrgStructureInputSchema },
  output: { schema: AnalyzeOrgStructureOutputSchema },
  prompt: `You are an expert management consultant specializing in organizational structure and process optimization. Your task is to analyze the provided text about a company's internal mechanisms, using the company's basic information as crucial context.

Based on the user's description of their organization and company, please perform the following analysis. Ensure your response is tailored to 人事 (HR) and 经营管理 (business management) aspects.

**Company Basic Information (Context):**
{{{companyContext}}}

**User's Organizational Structure:**
{{{orgInfo}}}

Your analysis should include:
1.  **Key Decision Points**: Identify and summarize the crucial decision-making nodes, departments, or roles within the described structure and processes.
2.  **Potential Bottlenecks**: Pinpoint any areas that could lead to delays, communication breakdowns, or inefficiencies.
3.  **Improvement Suggestions**: Provide clear, concise, and actionable recommendations to optimize the structure, streamline processes, and improve overall management efficiency.
`,
});

const analyzeOrgStructureFlow = ai.defineFlow(
  {
    name: 'analyzeOrgStructureFlow',
    inputSchema: AnalyzeOrgStructureInputSchema,
    outputSchema: AnalyzeOrgStructureOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a valid analysis from the AI model.');
    }
    return output;
  }
);
