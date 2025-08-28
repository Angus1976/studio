
'use server';

/**
 * @fileOverview A generic, model-agnostic flow to execute a structured prompt.
 * This flow is the heart of the AI execution engine. It dynamically constructs
 * API requests based on provider information stored in Firestore, allowing the
 * platform to connect to any LLM with a native API without code changes.
 * This flow acts as a lightweight, built-in "LiteLLM" style gateway.
 *
 * - executePrompt - A function that takes a standard, OpenAI-like request and
 *   adapts it for various backend models.
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
    
    const { messages, temperature = 0.7, responseFormat } = input;
    
    // Find the system prompt and user prompts from the messages array
    const systemPrompt = messages.find(m => m.role === 'system')?.content;
    const userPrompts = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
    
    // 2. Prepare provider-specific request payload.
    let requestUrl = '';
    let requestBody: any;
    let requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    let responsePath: (string | number)[];

    // This is the model-agnostic adapter.
    // It converts the standard OpenAI-like `messages` input into the format
    // required by the target provider.
    switch (provider.toLowerCase()) {
        case 'google':
            requestUrl = `${apiUrl}/${modelName}:generateContent?key=${apiKey}`;
            const contents = messages
                .filter(m => m.role === 'user' || m.role === 'model') // Gemini uses 'model' for assistant role
                .map(m => ({ role: m.role, parts: [{ text: m.content }] }));
            
            requestBody = {
                contents: contents,
                generationConfig: { temperature },
            };

            if(systemPrompt) {
                requestBody.systemInstruction = {
                    role: "system",
                    parts: [{ text: systemPrompt }]
                }
            }
            
            if (responseFormat === 'json_object') {
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
             
             requestBody = {
                model: modelName,
                max_tokens: 4096, // Anthropic requires max_tokens
                messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
                system: systemPrompt, // Anthropic has a dedicated system prompt field
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
             
             requestBody = {
                model: modelName,
                messages: messages,
                temperature,
                stream: false,
             };
             if (responseFormat === 'json_object') {
                requestBody.response_format = { type: 'json_object' };
            }
             responsePath = ['choices', 0, 'message', 'content'];
             break;
    }

    try {
      // 3. Make the API call.
      const response = await fetch(requestUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
          console.error(`Error from ${provider} (${response.status}):`, responseData);
          const errorMessage = responseData?.error?.message || response.statusText;
          // IMPORTANT: Throw an error to be caught by the calling function.
          throw new Error(`API请求失败，状态码 ${response.status}: ${errorMessage}`);
      }
      
      // 4. Extract the response text using the provider-specific path.
      const responseText = responsePath.reduce((acc, key) => (acc as any)?.[key], responseData) as string | undefined;

      if (typeof responseText !== 'string') {
          console.error('Could not find response text at expected path:', responsePath.join('.'));
          console.error('Full AI response:', JSON.stringify(responseData, null, 2));
          throw new Error(`未能从 ${provider} 的响应中提取文本。`);
      }
      
      return { response: responseText };

    } catch (error: any) {
        console.error(`Error in executePrompt for modelId ${input.modelId}:`, error);
        // Re-throw the error to be caught by the calling function (e.g., testLlmConnection)
        // This ensures the caller knows the exact reason for failure.
        throw error;
    }
}
