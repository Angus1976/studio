
'use server';
/**
 * @fileOverview An AI flow to analyze a given prompt and generate relevant metadata.
 *
 * - analyzePromptMetadata - a function that takes prompt components and returns structured metadata.
 */

import { 
    AnalyzePromptMetadataInputSchema,
    AnalyzePromptMetadataOutputSchema,
    type AnalyzePromptMetadataInput,
    type AnalyzePromptMetadataOutput
} from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';
import admin from '@/lib/firebase-admin';
import type { LlmConnection } from '@/lib/data-types';


// Helper function to find the highest-priority, general-purpose LLM connection
async function getGeneralLlmConnection(): Promise<LlmConnection | null> {
    const db = admin.firestore();
     try {
        const snapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .orderBy('priority', 'asc')
            .limit(1)
            .get();
            
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as LlmConnection;
        }
        return null;
    } catch (error) {
        console.error("Error fetching LLM connection from database:", error);
        return null;
    }
}


export async function analyzePromptMetadata(input: AnalyzePromptMetadataInput): Promise<AnalyzePromptMetadataOutput> {

    const systemInstruction = `你是一个经验丰富的提示词工程专家。你的任务是分析用户提供的结构化提示词，并为其生成准确、专业的元数据。

    请严格按照以下要求，并遵循JSON输出格式：

    1.  **适用范围 (scope)**: 总结这个提示词主要适用于哪个领域或哪一类任务。
    2.  **推荐模型 (recommendedModel)**: 根据提示词的复杂度、语言和任务类型，推荐最合适的Google Gemini模型（例如：gemini-1.5-flash适用于简单、快速的任务；gemini-1.5-pro适用于复杂的推理和多语言任务）。
    3.  **约束条件 (constraints)**: 指出使用此提示词时需要注意的潜在问题、限制或前提条件。例如，它是否依赖特定格式的输入变量。
    4.  **适用场景 (scenario)**: 描述1-2个这个提示词可以被有效利用的具体业务场景。`;
    
    let userPromptContent = `[User Prompt]:\n${input.userPrompt}`;
    if (input.context) userPromptContent += `\n\n[Context/Examples]:\n${input.context}`;
    if (input.negativePrompt) userPromptContent += `\n\n[Negative Prompt]:\n${input.negativePrompt}`;
    
    // Find the highest priority, available, general-purpose LLM.
    const llmConnection = await getGeneralLlmConnection();
    if (!llmConnection) {
      throw new Error("无法分析元数据，因为平台当前没有配置可用的AI模型。请联系管理员。");
    }
    
    const finalUserPrompt = `${userPromptContent}\n\n请严格以JSON格式返回你的分析结果。`;

    const result = await executePrompt({
      modelId: llmConnection.id, // Use the highest-priority model found.
      messages: [
          { role: 'system', content: input.systemPrompt || systemInstruction },
          { role: 'user', content: finalUserPrompt }
      ],
      temperature: 0.2,
      responseFormat: 'json_object', // Request JSON output explicitly.
    });
    
    try {
        // The model might return the JSON inside a markdown block, so we need to extract it.
        const jsonMatch = result.response.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.response;
        const parsedJson = JSON.parse(jsonString);

        // Use safeParse to avoid crashing on unexpected AI responses.
        const safeParsed = AnalyzePromptMetadataOutputSchema.safeParse(parsedJson);

        if (safeParsed.success) {
            return safeParsed.data;
        } else {
             // If parsing fails, fall back to manually extracting fields to ensure the app doesn't crash.
             console.warn("AI metadata response did not match schema:", safeParsed.error);
             return {
                scope: parsedJson.scope || 'AI未提供范围',
                recommendedModel: parsedJson.recommendedModel || 'AI未推荐模型',
                constraints: parsedJson.constraints || 'AI未提供约束',
                scenario: parsedJson.scenario || 'AI未提供场景',
             }
        }
    } catch (error) {
        console.error("Failed to parse AI metadata response:", error);
        console.error("Raw AI response:", result.response);
        // This error is thrown if the AI response is not valid JSON at all.
        throw new Error("AI返回的元数据格式无效，无法解析。");
    }
}
