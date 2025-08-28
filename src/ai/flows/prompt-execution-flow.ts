
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
} from '@/lib/data-types';


// --- Hardcoded Provider Configurations (API Base URLs) ---
// In a more advanced system, this could also come from a database collection.
const providerEndpoints: Record<string, string> = {
    google: 'https://generativelanguage.googleapis.com/v1beta/models',
    openai: 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    tencent: 'https://hunyuan.tencent.com/v1',
    baidu: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
    // Add other providers here
};


// Fetches the details for a specific LLM connection.
async function getModelDetails(modelId: string) {
    const db = admin.firestore();
    const modelRef = db.collection('llm_connections').doc(modelId);
    const modelDoc = await modelRef.get();

    if (!modelDoc.exists) {
        throw new Error(`无法找到ID为'${modelId}'的模型配置。`);
    }
    const modelData = LlmConnectionSchema.omit({createdAt: true, id: true}).parse(modelDoc.data());

    const apiBaseUrl = providerEndpoints[modelData.provider.toLowerCase()];

    if (!apiBaseUrl) {
         throw new Error(`厂商'${modelData.provider}'的API地址未在系统中配置。`);
    }

    return { ...modelData, apiBaseUrl };
}


export async function executePrompt(
  input: PromptExecutionInput
): Promise<PromptExecutionOutput> {
    
    if (!input.modelId) {
        throw new Error("抱歉，执行操作所需的模型ID缺失。请在调用时提供一个模型。");
    }
    
    // 1. Fetch all necessary model and provider details from Firestore.
    const modelDetails = await getModelDetails(input.modelId);
    const { provider, modelName, apiKey, apiBaseUrl } = modelDetails;
    
    const { messages, temperature = 0.7, responseFormat } = input;
    
    // 2. Prepare provider-specific request payload.
    let requestUrl = '';
    let requestBody: any;
    let requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    let responsePath: (string | number)[];

    // This is the model-agnostic adapter (The "LiteLLM" logic).
    // It converts the standard OpenAI-like `messages` input into the format
    // required by the target provider.
    switch (provider.toLowerCase()) {
        case 'google':
            requestUrl = `${apiBaseUrl}/${modelName}:generateContent?key=${apiKey}`;
            const contents = messages
                .filter(m => m.role === 'user' || m.role === 'model' || m.role === 'assistant')
                .map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.content }] }));
            
            const systemPrompt = messages.find(m => m.role === 'system')?.content;

            requestBody = {
                contents: contents,
                generationConfig: { temperature },
            };
            
            if (systemPrompt) {
                 requestBody.systemInstruction = {
                    // role: "system", // This is incorrect for Google's API, the role is implicit
                    parts: [{ text: systemPrompt }]
                };
            }
            
            if (responseFormat === 'json_object') {
                requestBody.generationConfig.responseMimeType = 'application/json';
            }
            responsePath = ['candidates', 0, 'content', 'parts', 0, 'text'];
            break;
        
        case 'anthropic':
             requestUrl = `${apiBaseUrl}/messages`;
             requestHeaders = {
                ...requestHeaders,
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
             };
             
             requestBody = {
                model: modelName,
                max_tokens: 4096, // Anthropic requires max_tokens
                messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
                system: messages.find(m => m.role === 'system')?.content,
                temperature,
             };
             responsePath = ['content', 0, 'text'];
             break;

        case 'openai':
        case 'deepseek':
        case 'aliyun': 
        case 'tencent':
        case 'baidu':
        case 'custom':
        default: // Default to OpenAI compatible structure
             requestUrl = `${apiBaseUrl}/chat/completions`;
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
      
      if (!response.ok) {
          // If the response is not OK, robustly read the body as text.
          const errorText = await response.text();
          console.error(`Error from ${provider} (${response.status}):`, errorText);
          // IMPORTANT: Throw an error with the raw text to be caught by the calling function.
          throw new Error(`API请求失败，状态码 ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      
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
        // Re-throw the error to be caught by the calling function.
        // This ensures the caller knows the exact reason for failure.
        throw error;
    }
}
