
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
import type { Message } from '@/lib/data-types';

export async function digitalEmployee(
  input: DigitalEmployeeInput
): Promise<PromptExecutionOutput> {
  const { modelId, promptId, variables, temperature, userPrompt, systemPrompt } = input;

    let finalUserPrompt: string;
    let finalSystemPrompt: string | undefined = systemPrompt;
    
    if (promptId) {
        // Fetch all prompts and find the one with the matching ID
        const allPrompts = await getPrompts();
        const scenario = allPrompts.find(s => s.id === promptId);
        
        if (!scenario) {
            throw new Error(`Prompt with ID '${promptId}' not found in the library.`);
        }
        
        finalUserPrompt = scenario.userPrompt;
        // If a system prompt is associated with the saved scenario, it should take precedence
        if (scenario.systemPrompt) {
            finalSystemPrompt = scenario.systemPrompt;
        }
    } else if (userPrompt) {
        finalUserPrompt = userPrompt;
    } else {
         throw new Error("A user prompt is required to execute the flow.");
    }
    
    if (!modelId) {
        throw new Error("A modelId is required to execute the flow. The client must provide one.");
    }

    // Interpolate variables into the user prompt.
    if (variables) {
        finalUserPrompt = Object.entries(variables).reduce(
            (prompt, [key, value]) => prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
            finalUserPrompt
        );
    }
    
    const messages: Message[] = [];
    if (finalSystemPrompt) {
        messages.push({ role: 'system', content: finalSystemPrompt });
    }
    messages.push({ role: 'user', content: finalUserPrompt });
    
    const result = await executePrompt({
        modelId,
        messages,
        temperature
    });

    return result;
}
