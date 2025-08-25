
"use server";
/**
 * @fileOverview A digital employee flow that executes a prompt from a library.
 *
 * - digitalEmployee - A function that handles the execution of a prompt by ID.
 */
/*
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
  async ({ promptId, variables, temperature, systemPrompt, userPrompt, context, negativePrompt }) => {

    let finalSystemPrompt: string | undefined = systemPrompt;
    let finalUserPrompt: string | undefined = userPrompt;
    let finalContext: string | undefined = context;
    let finalNegativePrompt: string | undefined = negativePrompt;

    if (promptId) {
        // Fetch all prompts and find the one with the matching ID
        const allPrompts = await getPrompts();
        const scenario = allPrompts.find(s => s.id === promptId);
        
        if (!scenario) {
            throw new Error(`Prompt with ID '${promptId}' not found in the library.`);
        }
        
        finalUserPrompt = scenario.userPrompt;
        finalSystemPrompt = scenario.systemPrompt;
        finalContext = scenario.context;
        finalNegativePrompt = scenario.negativePrompt;
    }
    
    if(!finalUserPrompt) {
        throw new Error("A user prompt is required to execute the flow.");
    }
    
    // We can reuse the main execution flow. 
    const result = await executePrompt({
        systemPrompt: finalSystemPrompt,
        userPrompt: finalUserPrompt,
        context: finalContext,
        negativePrompt: finalNegativePrompt,
        variables,
        temperature
    });

    return result;
  }
);
*/
