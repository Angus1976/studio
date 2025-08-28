
'use server';

/**
 * @fileOverview A generic, model-agnostic flow to execute a structured prompt.
 * This flow is the heart of the AI execution engine. It dynamically constructs
 * API requests based on provider information stored in Firestore, allowing the
 * platform to connect to any LLM with a native API without code changes.
 *
 * - executePrompt - A function that takes prompt components and variables to generate a response.
 */

import admin from '@/lib/firebase-admin';
import { 
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

    // Fetch all providers and find the matching one in a case-insensitive way
    const providersSnapshot = await db.collection('llm_providers').get();
    const providers = providersSnapshot.docs.map(doc => LlmProviderSchema.parse({ id: doc.id, ...doc.data() }));
    
    const modelProviderLower = modelData.provider.toLowerCase();
    const providerData = providers.find(p => p.providerName.toLowerCase() === modelProviderLower);

    if (!providerData) {
        throw new Error(`无法找到厂商'${modelData.provider}'的配置信息。`);
    }
    
    if (!providerData.apiUrl) {
         throw new Error(`厂商'${modelData.provider}'的API地址未配置。`);
    }

    return { ...modelData, ...providerData };
}


export async function executePrompt(
  input: PromptExecutionInput
): Promise<PromptExecutionOutput> {
    
    if (!input.modelId) {
        throw new Error("抱歉，执行操作所需的模型ID缺失。请在调用时提供一个模型。");
    }
    
    // 1. Fetch all necessary model and provider details from Firestore.
    const modelDetails = await getModelDetails(input.modelId);
    const { provider, modelName, apiKey, apiUrl } = modelDetails;

    // 2. Interpolate variables into the user prompt.
    let finalUserPrompt = input.userPrompt || '';
    if (input.variables) {
        finalUserPrompt = Object.entries(input.variables).reduce(
            (prompt, [key, value]) => prompt.replace(new RegExp(`{{${key}}}`, 'g'), value),
            finalUserPrompt
        );
    }
    
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
            requestUrl = `${apiUrl}/${modelName}:generateContent?key=${apiKey}`;
            const contents = [{ role: "user", parts: [{ text: finalUserPrompt }] }];
            
            requestBody = {
                contents: contents,
                generationConfig: { temperature },
            };

            if(input.systemPrompt) {
                requestBody.systemInstruction = {
                    role: "system",
                    parts: [{ text: input.systemPrompt }]
                }
            }
            
            if (input.responseFormat === 'json_object') {
                requestBody.generationConfig.responseMimeType = 'application/json';
            }
            responsePath = ['candidates', 0, 'content', 'parts', 0, 'text'];
            break;
        
        case 'anthropic':
             requestUrl = `${apiUrl}`;
             requestHeaders = {
                ...requestHeaders,
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
             };
             const anthropicMessages = [{ role: 'user', content: finalUserPrompt }];
             
             requestBody = {
                model: modelName,
                max_tokens: 1024,
                messages: anthropicMessages,
                system: input.systemPrompt, // Anthropic has a dedicated system prompt field
                temperature,
             };
             responsePath = ['content', 0, 'text'];
             break;

        case 'openai':
        case 'deepseek':
        case '阿里云':
        case '字节跳动':
        case '自定义':
        default: // Default to OpenAI compatible structure
             requestUrl = `${apiUrl}/v1/chat/completions`;
             requestHeaders['Authorization'] = `Bearer ${apiKey}`;
             
             const messages = [];
             if (input.systemPrompt) {
                 messages.push({ role: 'system', content: input.systemPrompt });
             }
             messages.push({ role: 'user', content: finalUserPrompt });

             requestBody = {
                model: modelName,
                messages: messages,
                temperature,
                stream: false,
             };
             if (input.responseFormat === 'json_object') {
                requestBody.response_format = { type: 'json_object' };
            }
             responsePath = ['choices', 0, 'message', 'content'];
             break;
    }

    try {
      // 4. Make the API call.
      const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
          console.error(`Error from ${provider} (${response.status}):`, responseData);
          const errorMessage = responseData?.error?.message || response.statusText;
          throw new Error(`API request failed with status ${response.status}: ${errorMessage}`);
      }
      
      // 5. Extract the response text using the provider-specific path.
      const responseText = responsePath.reduce((acc, key) => (acc as any)?.[key], responseData) as string | undefined;

      if (typeof responseText !== 'string') {
          console.error('Could not find response text at expected path:', responsePath.join('.'));
          console.error('Full AI response:', JSON.stringify(responseData, null, 2));
          throw new Error(`Failed to extract text from ${provider}'s response.`);
      }
      
      return { response: responseText };

    } catch (error: any) {
        console.error(`Error in executePrompt for modelId ${input.modelId}:`, error);
        // Re-throw the error to be caught by the calling function (e.g., testLlmConnection)
        throw error;
    }
}
