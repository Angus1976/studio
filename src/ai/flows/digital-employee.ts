"use server";
/**
 * @fileOverview A digital employee flow that executes a prompt from a library.
 *
 * - digitalEmployee - A function that handles the execution of a prompt by ID.
 * - DigitalEmployeeInput - The input type for the digitalEmployee function.
 * - DigitalEmployeeOutput - The return type for the digitalEmployee function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import Handlebars from 'handlebars';
import { promptScenarios } from "@/lib/prompt-scenarios"; // Using mock data for now
import { executePrompt, PromptExecutionInputSchema, PromptExecutionOutput } from "./prompt-execution-flow";

export const DigitalEmployeeInputSchema = z.object({
  promptId: z.string().describe("The ID of the prompt scenario to execute."),
  variables: z.record(z.string()).optional().describe("Key-value pairs for variables in the prompt."),
  temperature: z.number().min(0).max(1).optional().describe("The temperature for the model."),
  promptContent: z.string().optional().describe("Direct prompt content to use instead of fetching by ID. Used for testing tuned prompts.")
});
export type DigitalEmployeeInput = z.infer<typeof DigitalEmployeeInputSchema>;

export async function digitalEmployee(
  input: DigitalEmployeeInput
): Promise<PromptExecutionOutput> {
  return digitalEmployeeFlow(input);
}


const digitalEmployeeFlow = ai.defineFlow(
  {
    name: "digitalEmployeeFlow",
    inputSchema: DigitalEmployeeInputSchema,
    outputSchema: z.object({ response: z.string() }),
  },
  async ({ promptId, variables, temperature, promptContent }) => {

    let finalPrompt: string;

    if (promptContent) {
        finalPrompt = promptContent;
    } else {
        const scenario = promptScenarios.find(s => s.id === promptId);
        if (!scenario) {
            throw new Error(`Prompt with ID '${promptId}' not found in the library.`);
        }
        finalPrompt = scenario.prompt;
    }
    
    // We can reuse the main execution flow. 
    // The "digital employee" is an abstraction over this.
    // For now, it's a simple passthrough, but it could have more complex logic later.
    const result = await executePrompt({
        // For simplicity, we are passing the entire scenario prompt as the user prompt.
        // In a more advanced setup, this could be parsed into system/user/context parts.
        userPrompt: finalPrompt,
        variables,
        temperature
    });

    return result;
  }
);
