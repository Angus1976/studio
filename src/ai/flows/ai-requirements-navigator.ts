
'use server';
/**
 * @fileOverview An AI flow to guide a user through a requirements gathering conversation.
 *
 * - aiRequirementsNavigator - A function that handles the conversation for requirements gathering.
 */

import { 
    type RequirementsNavigatorInput,
    type RequirementsNavigatorOutput,
    type Message
} from '@/lib/data-types';
import { executePrompt } from './prompt-execution-flow';
import admin from '@/lib/firebase-admin';
import type { LlmConnection } from '@/lib/data-types';


// Helper function to find the highest-priority, general-purpose TEXT model connection
async function getGeneralTextLlmConnection(): Promise<LlmConnection | null> {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('llm_connections')
            .where('scope', '==', '通用')
            .where('status', '==', '活跃')
            .get();
            
        if (snapshot.empty) {
            console.warn("No active, general-purpose LLM connection found in database.");
            return null;
        }
        
        const connections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LlmConnection));
        
        // Sort by priority in the code to ensure correct ordering.
        connections.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        return connections[0];

    } catch (error) {
        console.error("Error fetching highest priority Text LLM connection from database:", error);
        return null;
    }
}


export async function aiRequirementsNavigator(input: RequirementsNavigatorInput): Promise<RequirementsNavigatorOutput> {
    
    const userName = input.userName ? `, ${input.userName}` : '';
    const initialGreeting = `您好${userName}！我是您的AI需求导航器。为了给您推荐最合适的AI能力，我需要先了解一些您的基本信息。请问，您所在的企业主要从事哪个行业呢？`;

    const systemPrompt = `你是一个“AI需求导航器”，你的角色是通过一次友好、专业的对话，引导用户明确他们的业务需求。你的最终目标是构建一个精准的用户画像。

你的目标是收集以下关键信息，并通过多轮对话逐步深入：
1.  **企业特征**: 用户的公司是做什么的？（例如：互联网、制造业、零售业）
2.  **组织架构**: 用户的组织架构是怎样的，他在其中扮演什么角色？（例如：市场部经理、软件开发团队成员、人事专员）
3.  **需求场景**: 用户希望在哪个具体的工作场景中使用AI？（例如：招聘流程、社交媒体营销、代码调试、客户服务）
4.  **核心需求**: 在这个场景中，最核心、最具体的需求是什么？（例如：从简历中快速筛选出符合特定技能要求的候选人、为新产品系列写一系列推广文案、解释一段复杂的遗留代码）
5.  **个人信息卡画像**: 针对个人用户，了解其专业背景和使用习惯。

**对话策略:**
- **主动引导**: 不要一次性问出所有问题。一次只问一个或两个相关的问题，逐步深入。
- **自然对话**: 你的语气应该是循循善诱的、乐于助人的。使用开放式问题。
- **总结与确认**: 当你认为已经收集齐所有信息后，用自己的话总结一遍用户的需求，并询问用户：“我的理解对吗？如果没问题，我将为您推荐最适合的AI能力场景。”
- **完成对话**: 只有当用户明确确认你的总结后，你才能将 \`isFinished\` 设为 \`true\`。在用户确认前，\`isFinished\` 必须为 \`false\`。
- **智能路由**: 在对话完成时(\`isFinished: true\`)，根据用户的最终需求，从下列专家ID中选择一个最匹配的，并将其填入 \`suggestedPromptId\` 字段。
    - \`recruitment-expert\`: 用于招聘、筛选简历、面试准备等。
    - \`marketing-expert\`: 用于市场营销文案、广告创意、社交媒体内容生成等。
    - \`sales-expert\`: 用于销售话术、邮件模板、客户分析等。
    - \`code-expert\`: 用于代码生成、解释、调试、重构等。
    - \`copywriting-expert\`: 用于通用文案写作、文章生成、摘要总结等。
- **默认开场白**: 如果对话历史为空，你的第一句话必须是：“${initialGreeting}”`;

    // The first message is always a greeting, no AI needed.
    if (input.conversationHistory.length === 0) {
        return {
            response: initialGreeting,
            isFinished: false,
        }
    }
    
    try {
        // Find the highest priority, available, general-purpose text LLM.
        const llmConnection = await getGeneralTextLlmConnection();
        if (!llmConnection) {
            // Gracefully handle no available model. Throw an error to be caught by the client UI.
            throw new Error("抱歉，当前平台没有配置可用的AI对话模型。请联系管理员进行配置后重试。");
        }
        
        // **FIX**: Sanitize the roles before sending to the execution flow.
        // The frontend uses 'model' for AI responses, but the backend execution expects 'assistant'.
        const sanitizedHistory = input.conversationHistory.map(msg => ({
            ...msg,
            role: msg.role === 'model' ? 'assistant' : msg.role,
        }));


        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...sanitizedHistory,
        ];

        const result = await executePrompt({
            modelId: llmConnection.id, // Use the highest-priority model found.
            messages: messages,
            temperature: 0.5,
            // DO NOT request json_object for a text conversation
        });

        // Simple check to see if the conversation might be over.
        // A more robust solution would involve the AI returning structured data.
        const responseText = result.response.toLowerCase();
        if (responseText.includes("我的理解对吗") || responseText.includes("为您推荐")) {
            const lastUserMessage = input.conversationHistory[input.conversationHistory.length - 1];
            if(lastUserMessage.content.toLowerCase().includes("确认")){
                 // A more robust solution would have the AI select the ID.
                 const suggestedId = responseText.includes("招聘") ? 'recruitment-expert' 
                                   : responseText.includes("营销") ? 'marketing-expert'
                                   : responseText.includes("销售") ? 'sales-expert'
                                   : responseText.includes("代码") ? 'code-expert'
                                   : 'copywriting-expert';

                 return {
                    response: result.response,
                    isFinished: true,
                    suggestedPromptId: suggestedId
                };
            }
        }
        
        return {
            response: result.response,
            isFinished: false,
        };
    } catch (error: any) {
        console.error("Error in aiRequirementsNavigator:", error);
        // Re-throw the original error so the client-side can display a more accurate message.
        throw error;
    }
}
