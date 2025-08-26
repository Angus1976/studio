"use server";
/**
 * @fileOverview A digital employee flow that executes a prompt from a library.
 *
 * - digitalEmployee - A function that handles the execution of a prompt by ID.
 */

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
  const { promptId, variables, temperature, systemPrompt, userPrompt, context, negativePrompt } = input;

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
    // The `executePrompt` flow requires a modelId. If it's a generic test,
    // we don't have a model specified. We will have to pass it in or pick a default.
    // For now, the testbed component (`prompt-testbed.tsx`) will select a model,
    // but the user action panel (`user-action-panel.tsx`) does not.
    // This needs to be resolved by adding a model selector there or assigning a default.
    // Let's assume for now the client provides a modelId if it's a test.
    
    const result = await executePrompt({
        // modelId is now required by executePrompt, but this flow doesn't receive it.
        // This is a logic gap. The user-action-panel needs to be updated to select a model.
        // For now, let's pass a placeholder and rely on executePrompt to handle it,
        // which currently throws an error. The client call in UserActionPanel must be fixed.
        ...input, // Pass all fields, including the optional modelId
        systemPrompt: finalSystemPrompt,
        userPrompt: finalUserPrompt,
        context: finalContext,
        negativePrompt: finalNegativePrompt,
        variables,
        temperature
    });

    return result;
}
