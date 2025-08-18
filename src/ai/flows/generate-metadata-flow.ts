'use server';

/**
 * @fileOverview An AI flow to automatically generate metadata for a given prompt.
 *
 * - generateMetadata - A function that analyzes a prompt and suggests metadata.
 * - GenerateMetadataInput - The input type for the generateMetadata function.
 * - GenerateMetadataOutput - The return type for the generateMetadata function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateMetadataInputSchema = z.object({
  systemPrompt: z.string().optional(),
  userPrompt: z.string(),
  context: z.string().optional(),
  negativePrompt: z.string().optional(),
});
export type GenerateMetadataInput = z.infer<typeof GenerateMetadataInputSchema>;

const GenerateMetadataOutputSchema = z.object({
    scope: z.string().describe('分析此提示词最适合的适用范围，例如“通用文案写作”、“代码生成”、“特定行业分析”等。'),
    model: z.string().describe('根据提示词的复杂度和任务类型，推荐一个最适合的LLM模型，例如 Gemini 1.5 Pro, GPT-4o, Llama3 等。'),
    constraints: z.string().describe('分析并列出使用此提示词时需要注意的约束条件或潜在限制。'),
    use_case: z.string().describe('用一句话描述一个典型的适用场景。'),
});
export type GenerateMetadataOutput = z.infer<typeof GenerateMetadataOutputSchema>;


export async function generateMetadata(
  input: GenerateMetadataInput
): Promise<GenerateMetadataOutput> {
  return generateMetadataFlow(input);
}


const generateMetadataFlow = ai.defineFlow(
  {
    name: 'generateMetadataFlow',
    inputSchema: GenerateMetadataInputSchema,
    outputSchema: GenerateMetadataOutputSchema,
  },
  async (promptContent) => {
    const systemPrompt = `你是一位资深的提示词工程师 (Senior Prompt Engineer)。你的任务是根据用户提供的提示词内容，为其生成结构化的元数据。

请仔细分析下面的提示词的各个组成部分，并以JSON格式返回你的分析结果。

**分析维度:**
1.  **适用范围 (scope)**: 分析此提示词最适合的应用领域。是通用写作，还是特定领域的任务（如代码生成、法律文书、市场营销文案）？
2.  **推荐模型 (model)**: 基于提示词的复杂性、任务类型和潜在的推理需求，推荐一个最合适的LLM模型。
3.  **约束条件 (constraints)**: 指出使用此提示词时可能的限制或需要注意的地方。例如，它是否依赖特定的上下文格式？输出是否可能不稳定？
4.  **适用场景 (use_case)**: 用一句话简明扼要地概括一个最典型的使用场景。

**输入的提示词内容:**

*   **System Prompt:**
    \`\`\`
    ${promptContent.systemPrompt || '无'}
    \`\`\`
*   **User Prompt:**
    \`\`\`
    ${promptContent.userPrompt}
    \`\`\`
*   **Context/Examples:**
    \`\`\`
    ${promptContent.context || '无'}
    \`\`\`
*   **Negative Prompt:**
    \`\`\`
    ${promptContent.negativePrompt || '无'}
    \`\`\`
`;

    const llmResponse = await ai.generate({
      prompt: systemPrompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        format: 'json',
        schema: GenerateMetadataOutputSchema,
      },
      config: {
        temperature: 0.3,
      },
    });

    const metadata = llmResponse.output();
    if (!metadata) {
        throw new Error("AI未能生成有效的元数据。");
    }
    return metadata;
  }
);
