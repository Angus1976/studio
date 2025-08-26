
'use server';

/**
 * @fileOverview A generic, model-agnostic flow to execute a structured prompt.
 * This flow is the heart of the AI execution engine. It dynamically constructs
 * API requests based on provider information stored in Firestore, allowing the
 * platform to connect to any LLM with a native API without code changes.
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
    LlmConnectionSchema,
    LlmProviderSchema,
} from '@/lib/data-types';


// Fetches the details for a specific LLM connection and its provider.
async function getModelDetails(modelId: string) {
    const db = admin.firestore();
    const modelRef = db.collection('llm_connections').doc(modelId);
    const modelDoc = await modelRef.get();

    if (!modelDoc.exists) {
        throw new Error(`无法找到ID为'${modelId}'的模型配置。`);
    }
    const modelData = LlmConnectionSchema.omit({createdAt: true, id: true}).parse(modelDoc.data());

    const providerSnapshot = await db.collection('llm_providers').where('providerName', '==', modelData.provider).limit(1).get();
    
    if (providerSnapshot.empty) {
        throw new Error(`无法找到厂商'${modelData.provider}'的配置信息。`);
    }
    const providerData = LlmProviderSchema.omit({ id: true }).parse(providerSnapshot.docs[0].data());
    
    if (!providerData.apiUrl) {
         throw new Error(`厂商'${modelData.provider}'的API地址未配置。`);
    }

    return { ...modelData, ...providerData };
}


export async function executePrompt(
  input: PromptExecutionInput
): Promise<PromptExecutionOutput> {
    
    if (!input.modelId) {
        return { response: "抱歉，执行操作所需的模型ID缺失。请在调用时提供一个模型。" };
    }
    
    try {
        // 1. Fetch all necessary model and provider details from Firestore.
        const modelDetails = await getModelDetails(input.modelId);
        const { provider, modelName, apiKey, apiUrl } = modelDetails;

        // 2. Prepare the full prompt by compiling variables with Handlebars.
        const template = Handlebars.compile(input.userPrompt || '');
        const finalUserPrompt = template(input.variables || {});
        
        let fullPrompt = '';
        if (input.systemPrompt) { fullPrompt += `System Prompt: ${input.systemPrompt}\n\n`; }
        if (input.context) { fullPrompt += `Context/Examples:\n${input.context}\n\n---\n\n`; }
        fullPrompt += `User Instruction:\n${finalUserPrompt}`;
        if (input.negativePrompt) { fullPrompt += `\n\nIMPORTANT: Do not include any of the following in your response: "${input.negativePrompt}"`; }
        
        const temperature = input.temperature || 0.7;
        
        // 3. Prepare provider-specific request payload.
        let requestUrl = '';
        let requestBody: any;
        let requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        let responsePath: (string | number)[];

        // This is the model-agnostic adapter.
        // To support a new provider, just add a new case here.
        switch (provider.toLowerCase()) {
            case 'google':
                // Google's API needs the model name prefixed in the URL and the key as a query param.
                const finalModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
                requestUrl = `${apiUrl}${finalModelName}:generateContent?key=${apiKey}`;
                requestBody = {
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: { temperature },
                };
                responsePath = ['candidates', 0, 'content', 'parts', 0, 'text'];
                break;

            case 'deepseek':
                requestUrl = `${apiUrl}`;
                requestHeaders['Authorization'] = `Bearer ${apiKey}`;
                requestBody = {
                    model: modelName,
                    messages: [{ role: 'user', content: fullPrompt }],
                    temperature,
                };
                responsePath = ['choices', 0, 'message', 'content'];
                break;
                
            case 'openai':
            case '阿里云':
                 requestUrl = `${apiUrl}`;
                 requestHeaders['Authorization'] = `Bearer ${apiKey}`;
                 requestBody = {
                    model: modelName,
                    messages: [{ role: 'user', content: fullPrompt }],
                    temperature,
                    stream: false,
                 };
                 responsePath = ['choices', 0, 'message', 'content'];
                 break;

            default:
                throw new Error(`不支持的模型提供商: ${provider}`);
        }

        // 4. Make the API call.
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error from ${provider}:`, errorBody);
            throw new Error(`${provider} API 请求失败，状态码 ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        
        // 5. Extract the response text using the provider-specific path.
        const responseText = responsePath.reduce((acc, key) => (acc as any)?.[key], data) as string | undefined;

        if (typeof responseText !== 'string') {
            console.error('Could not find response text at expected path:', responsePath.join('.'));
            console.error('Full AI response:', JSON.stringify(data, null, 2));
            throw new Error(`从 ${provider} 的响应中提取文本失败。`);
        }
        
        return { response: responseText };

    } catch (error: any) {
        console.error(`Error in executePrompt for modelId ${input.modelId}:`, error);
        return { response: `调用模型'${input.modelId}'时发生错误，请稍后重试或联系管理员。错误详情: ${error.message}`};
    }
}
