
'use server';

/**
 * @fileOverview A generic flow to execute a structured prompt with variables.
 *
 * - executePrompt - A function that takes prompt components and variables to generate a response.
 */

import Handlebars from 'handlebars';
import admin from '@/lib/firebase-admin';
import { 
    PromptExecutionInputSchema,
    PromptExecutionOutputSchema,
    type PromptExecutionInput,
    type PromptExecutionOutput,
    LlmConnectionSchema
} from '@/lib/data-types';

async function callGoogleAI(apiKey: string, modelName: string, prompt: string, temperature: number) {
    // Ensure the model name has the 'models/' prefix for the Google AI API.
    const finalModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${finalModelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google AI API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
}

async function callDeepSeek(apiKey: string, modelName: string, prompt: string, temperature: number) {
    const url = 'https://api.deepseek.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`DeepSeek API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}


export async function executePrompt(
  input: PromptExecutionInput
): Promise<PromptExecutionOutput> {
    const { modelId } = input;
    if (!modelId) {
        // This case handles when a model ID is not provided by the calling function.
        return { response: "抱歉，执行操作所需的模型ID缺失。请在调用时提供一个模型。" };
    }
    
    // 1. Fetch the model connection details from Firestore
    const db = admin.firestore();
    const modelRef = db.collection('llm_connections').doc(modelId);
    const modelDoc = await modelRef.get();

    if (!modelDoc.exists) {
        // This case handles when the provided model ID doesn't exist in the database.
         return { response: `抱歉，无法找到ID为'${modelId}'的模型配置。请检查后台配置或联系管理员。` };
    }

    const modelData = LlmConnectionSchema.omit({createdAt: true, id: true}).parse(modelDoc.data());
    const { provider, modelName, apiKey } = modelData;

    // 2. Prepare the full prompt
    const template = Handlebars.compile(input.userPrompt || '');
    const finalUserPrompt = template(input.variables || {});
    
    let fullPrompt = '';
    if (input.systemPrompt) {
        fullPrompt += `System Prompt: ${input.systemPrompt}\n\n`;
    }
    if (input.context) {
        fullPrompt += `Context/Examples:\n${input.context}\n\n---\n\n`;
    }
    fullPrompt += `User Instruction:\n${finalUserPrompt}`;
    
    if (input.negativePrompt) {
        fullPrompt += `\n\nIMPORTANT: Do not include any of the following in your response: "${input.negativePrompt}"`;
    }
    
    const temperature = input.temperature || 0.7;
    let responseText = '';

    // 3. Call the appropriate provider's API
    try {
        switch (provider.toLowerCase()) {
            case 'google':
                responseText = await callGoogleAI(apiKey, modelName, fullPrompt, temperature);
                break;
            case 'deepseek':
                 responseText = await callDeepSeek(apiKey, modelName, fullPrompt, temperature);
                break;
            // Add other providers here as needed
            // case 'openai':
            //     responseText = await callOpenAI(apiKey, modelName, fullPrompt, temperature);
            //     break;
            default:
                throw new Error(`Unsupported model provider: ${provider}`);
        }

        return { response: responseText };

    } catch (error: any) {
        console.error(`Error calling ${provider} API:`, error);
        // Instead of re-throwing, return a user-friendly error message.
        return { response: `调用模型'${modelName}'时发生错误，请稍后重试或联系管理员。错误详情: ${error.message}`};
    }
}
