
'use server';
/**
 * @fileOverview An AI flow to analyze a given prompt and generate relevant metadata.
 *
 * - analyzePromptMetadata - a function that takes prompt components and returns structured metadata.
 */

import { 
    type AnalyzePromptMetadataInput,
    type AnalyzePromptMetadataOutput,
    AnalyzePromptMetadataOutputSchema,
} from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';
import admin from '@/lib/firebase-admin';
import type { LlmConnection } from '@/lib/data-types';


// Helper function to find the highest-priority, general-purpose LLM that supports JSON output.
async function getJsonCapableLlmConnection(): Promise<{ model: LlmConnection, requiresManualParse: boolean } | null> {
    const db = admin.firestore();
    try {
        // Priority 1: Look for "Reasoning" or "Multimodal" models first, as they are more likely to support JSON mode.
        const reasoningSnapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .where('category', 'in', ['推理', '多模态'])
            .get();
        
        let connections = reasoningSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LlmConnection));
        
        if (connections.length > 0) {
            connections.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            return { model: connections[0], requiresManualParse: false }; // These models should handle JSON mode well.
        }

        // Priority 2: Fallback to a general "Text" model if no specialized ones are found.
        const textSnapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .where('category', '==', '文本')
            .get();

        if (textSnapshot.empty) {
             console.warn("No active, general-purpose LLM connection of any category found in database.");
             return null;
        }

        connections = textSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LlmConnection));
        connections.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return { model: connections[0], requiresManualParse: true }; // A standard text model will require us to parse its output.

    } catch (error) {
        console.error("Error fetching a JSON-capable LLM connection from database:", error);
        return null;
    }
}


export async function analyzePromptMetadata(input: AnalyzePromptMetadataInput): Promise<AnalyzePromptMetadataOutput> {
    try {
        const systemInstruction = `你是一个经验丰富的提示词工程专家。你的任务是分析用户提供的结构化提示词，并为其生成准确、专业的元数据。

        请严格按照以下要求，并遵循JSON输出格式：

        1.  **scope**: 总结这个提示词主要适用于哪个领域或哪一类任务。
        2.  **recommendedModel**: 根据提示词的复杂度、语言和任务类型，推荐最合适的Google Gemini模型（例如：gemini-1.5-flash适用于简单、快速的任务；gemini-1.5-pro适用于复杂的推理和多语言任务）。
        3.  **constraints**: 指出使用此提示词时需要注意的潜在问题、限制或前提条件。例如，它是否依赖特定格式的输入变量。
        4.  **scenario**: 描述1-2个这个提示词可以被有效利用的具体业务场景。`;
        
        let userPromptContent = `[User Prompt]:\n${input.userPrompt}`;
        if (input.context) userPromptContent += `\n\n[Context/Examples]:\n${input.context}`;
        if (input.negativePrompt) userPromptContent += `\n\n[Negative Prompt]:\n${input.negativePrompt}`;
        
        const llmInfo = await getJsonCapableLlmConnection();
        if (!llmInfo) {
          throw new Error("平台当前没有配置可用的AI模型，无法分析元数据。请联系管理员。");
        }
        
        const finalUserPrompt = `${userPromptContent}\n\n请严格以JSON格式返回你的分析结果。`;

        const result = await executePrompt({
          modelId: llmInfo.model.id,
          messages: [
              { role: 'system', content: input.systemPrompt || systemInstruction },
              { role: 'user', content: finalUserPrompt }
          ],
          temperature: 0.2,
          responseFormat: llmInfo.requiresManualParse ? undefined : 'json_object',
        });
        
        // The model might return the JSON inside a markdown block, so we need to extract it.
        const jsonMatch = result.response.match(/```(?:json)?\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.response;
        const parsedJson = JSON.parse(jsonString);

        // Use safeParse to avoid crashing on unexpected AI responses.
        const safeParsed = AnalyzePromptMetadataOutputSchema.safeParse(parsedJson);

        if (safeParsed.success) {
            return safeParsed.data;
        } else {
             console.warn("AI metadata response did not match schema:", safeParsed.error);
             return {
                scope: parsedJson.scope || 'AI未提供范围',
                recommendedModel: parsedJson.recommendedModel || 'AI未推荐模型',
                constraints: parsedJson.constraints || 'AI未提供约束',
                scenario: parsedJson.scenario || 'AI未提供场景',
             }
        }
    } catch (error: any) {
        console.error("Failed to parse AI metadata response:", error);
        // This is the safety net. Instead of throwing, return a structured error object.
        return {
            scope: '错误',
            recommendedModel: '无法分析',
            constraints: error.message || 'AI返回的元数据格式无效，无法解析。',
            scenario: '请检查模型配置或联系管理员。'
        };
    }
}
