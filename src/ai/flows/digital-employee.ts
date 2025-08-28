
"use server";
/**
 * @fileOverview A digital employee flow that executes a prompt from a library.
 *
 * - digitalEmployee - A function that handles the execution of a prompt by ID.
 */

import { executePrompt, type PromptExecutionOutput } from "./prompt-execution-flow";
import { getPrompts } from "./get-prompts-flow";
import { 
    type DigitalEmployeeInput,
} from "@/lib/data-types";


export async function digitalEmployee(
  input: DigitalEmployeeInput
): Promise<PromptExecutionOutput> {
  const { modelId, promptId, variables, temperature, userPrompt } = input;

    let finalUserPrompt: string | undefined = userPrompt;
    let finalSystemPrompt: string | undefined;

    if (promptId) {
        // Fetch all prompts and find the one with the matching ID
        const allPrompts = await getPrompts();
        const scenario = allPrompts.find(s => s.id === promptId);
        
        if (!scenario) {
            throw new Error(`Prompt with ID '${promptId}' not found in the library.`);
        }
        
        finalUserPrompt = scenario.userPrompt;
        finalSystemPrompt = scenario.systemPrompt;
    }
    
    if(!finalUserPrompt) {
        throw new Error("A user prompt is required to execute the flow.");
    }
    
    if (!modelId) {
        throw new Error("A modelId is required to execute the flow. The client must provide one.");
    }
    
    const result = await executePrompt({
        modelId,
        systemPrompt: finalSystemPrompt,
        userPrompt: finalUserPrompt,
        variables,
        temperature
    });

    return result;
}

    
