'use server';

/**
 * @fileOverview A flow to process supplier data from a CSV file.
 *
 * - processSupplierData - A function that processes the supplier data.
 * - ProcessSupplierDataInput - The input type for the processSupplierData function.
 * - ProcessSupplierDataOutput - The return type for the processSupplierData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessSupplierDataInputSchema = z.object({
  csvData: z.string().describe('The supplier data in CSV format.'),
});
export type ProcessSupplierDataInput = z.infer<typeof ProcessSupplierDataInputSchema>;

const SupplierSchema = z.object({
    name: z.string().describe('供应商名称'),
    category: z.string().describe('供应商的业务类别'),
    matchRate: z.number().min(0).max(100).describe('一个虚构的匹配分数，表示供应商与我们业务的匹配程度（0-100）'),
    addedDate: z.string().describe('数据被添加的日期（YYYY-MM-DD 格式）'),
});

const ProcessSupplierDataOutputSchema = z.object({
  suppliers: z.array(SupplierSchema).describe('解析和评估后的供应商列表。'),
});
export type ProcessSupplierDataOutput = z.infer<typeof ProcessSupplierDataOutputSchema>;

export async function processSupplierData(input: ProcessSupplierDataInput): Promise<ProcessSupplierDataOutput> {
  return processSupplierDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processSupplierDataPrompt',
  input: {schema: ProcessSupplierDataInputSchema},
  output: {schema: ProcessSupplierDataOutputSchema},
  prompt: `你是一个智能数据处理助手。你的任务是解析以下 CSV 格式的供应商数据，并为每个供应商评估一个“匹配度”。

匹配度是一个 0 到 100 之间的分数，它代表了该供应商与一个专注于“高科技消费电子产品”和“创新智能家居解决方案”的公司的相关性。

- 对于电子产品、软件或科技领域的供应商，给予较高的匹配度（70-95）。
- 对于家用电器或相关服务的供应商，给予中等匹配度（50-70）。
- 对于其他所有类别的供应商，给予较低的匹配度（10-40）。

请将“addedDate”统一设置为今天的日期：${new Date().toISOString().split('T')[0]}。

CSV 数据:
"""
{{{csvData}}}
"""

请严格按照输出格式要求返回结果。`,
});

const processSupplierDataFlow = ai.defineFlow(
  {
    name: 'processSupplierDataFlow',
    inputSchema: ProcessSupplierDataInputSchema,
    outputSchema: ProcessSupplierDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
