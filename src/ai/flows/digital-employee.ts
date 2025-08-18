
"use server";
/**
 * @fileOverview A digital employee flow that executes a prompt from a library.
 *
 * - digitalEmployee - A function that handles the execution of a prompt by ID.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { executePrompt, type PromptExecutionOutput } from "./prompt-execution-flow";
import { getPrompts } from "./get-prompts-flow";
import { 
    DigitalEmployeeInputSchema,
    type DigitalEmployeeInput,
} from "@/lib/data-types";


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

    let finalPromptContent: string;
    let systemPrompt: string | undefined;
    let context: string | undefined;
    let negativePrompt: string | undefined;


    if (promptContent) {
        finalPromptContent = promptContent;
    } else {
        // Fetch all prompts and find the one with the matching ID
        const allPrompts = await getPrompts();
        const scenario = allPrompts.find(s => s.id === promptId);
        
        if (!scenario) {
            throw new Error(`Prompt with ID '${promptId}' not found in the library.`);
        }
        
        finalPromptContent = scenario.userPrompt;
        systemPrompt = scenario.systemPrompt;
        context = scenario.context;
        negativePrompt = scenario.negativePrompt;
    }
    
    // We can reuse the main execution flow. 
    const result = await executePrompt({
        systemPrompt: systemPrompt,
        userPrompt: finalPromptContent,
        context: context,
        negativePrompt: negativePrompt,
        variables,
        temperature
    });

    return result;
  }
);
