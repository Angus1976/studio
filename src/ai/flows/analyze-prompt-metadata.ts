'use server';
/**
 * @fileOverview An AI flow to analyze a given prompt and generate relevant metadata.
 *
 * - analyzePromptMetadata - A function that takes prompt components and returns structured metadata.
 * - AnalyzePromptMetadataInput - The input type for the analyzePromptMetadata function.
 * - AnalyzePromptMetadataOutput - The return type for the analyzePromptMetadata function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AnalyzePromptMetadataInputSchema = z.object({
  systemPrompt: z.string().optional(),
  userPrompt: z.string(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
});
export type AnalyzePromptMetadataInput = z.infer<typeof AnalyzePromptMetadataInputSchema>;

export const AnalyzePromptMetadataOutputSchema = z.object({
  scope: z.string().describe('分析提示词的适用范围，例如：“客户服务”、“代码生成”、“营销文案”等。'),
  recommendedModel: z.string().describe('根据提示词的复杂度和任务类型，推荐最适合的 LLM 模型，例如：“gemini-1.5-flash”或“gemini-1.5-pro”。'),
  constraints: z.string().describe('分析并列出使用此提示词时需要注意的约束条件或潜在限制。'),
  scenario: z.string().describe('描述一个或多个具体的业务场景，说明此提示词可以在何种情况下发挥作用。'),
});
export type AnalyzePromptMetadataOutput = z.infer<typeof AnalyzePromptMetadataOutputSchema>;


export async function analyzePromptMetadata(input: AnalyzePromptMetadataInput): Promise<AnalyzePromptMetadataOutput> {
    return analyzePromptMetadataFlow(input);
}


const analyzePromptMetadataFlow = ai.defineFlow(
  {
    name: 'analyzePromptMetadataFlow',
    inputSchema: AnalyzePromptMetadataInputSchema,
    outputSchema: AnalyzePromptMetadataOutputSchema,
  },
  async (input) => {
    const systemInstruction = `你是一个经验丰富的提示词工程专家。你的任务是分析用户提供的结构化提示词，并为其生成准确、专业的元数据。

    请严格按照以下要求，并遵循JSON输出格式：

    1.  **适用范围 (scope)**: 总结这个提示词主要适用于哪个领域或哪一类任务。
    2.  **推荐模型 (recommendedModel)**: 根据提示词的复杂度、语言和任务类型，推荐最合适的Google Gemini模型（例如：gemini-1.5-flash适用于简单、快速的任务；gemini-1.5-pro适用于复杂的推理和多语言任务）。
    3.  **约束条件 (constraints)**: 指出使用此提示词时需要注意的潜在问题、限制或前提条件。例如，它是否依赖特定格式的输入变量。
    4.  **适用场景 (scenario)**: 描述1-2个这个提示词可以被有效利用的具体业务场景。

    这是用户提供的提示词内容：`;
    
    const promptParts = [
        { text: systemInstruction }
    ];

    if(input.systemPrompt) promptParts.push({ text: `\n[System Prompt]:\n${input.systemPrompt}`});
    promptParts.push({ text: `\n[User Prompt]:\n${input.userPrompt}`});
    if(input.context) promptParts.push({ text: `\n[Context/Examples]:\n${input.context}`});
    if(input.negativePrompt) promptParts.push({ text: `\n[Negative Prompt]:\n${input.negativePrompt}`});

    const llmResponse = await ai.generate({
      prompt: promptParts,
      model: 'googleai/gemini-1.5-flash',
      output: {
        format: 'json',
        schema: AnalyzePromptMetadataOutputSchema,
      },
      config: {
        temperature: 0.2,
      },
    });

    const metadata = llmResponse.output();
    
    if (!metadata) {
        throw new Error('AI未能生成有效的元数据。');
    }

    return metadata;
  }
);
