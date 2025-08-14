
'use server';

/**
 * @fileOverview A flow to guide users in articulating their needs for AI-driven workflows.
 *
 * - aiRequirementsNavigator - A function that guides the user and extracts key requirements.
 * - AIRequirementsNavigatorInput - The input type for the aiRequirementsNavigator function.
 * - AIRequirementsNavigatorOutput - The return type for the aiRequirementsNavigator function.
 */

// NOTE: All Genkit-related functionality is currently commented out
// due to dependency issues with next@14. To re-enable, see CONFIGURATION_README.md.

// MOCK IMPLEMENTATION
export type AIRequirementsNavigatorInput = {
  userInput: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
};

export type AIRequirementsNavigatorOutput = {
  aiResponse: string;
  extractedRequirements?: string;
  suggestedPromptId?: string;
  isFinished: boolean;
};


export async function aiRequirementsNavigator(
  input: AIRequirementsNavigatorInput
): Promise<AIRequirementsNavigatorOutput> {
  const isFinished = input.userInput.toLowerCase().includes("确认");
  const suggestedPromptId = isFinished ? 'recruitment-expert' : undefined;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        aiResponse: isFinished ? "好的，需求已确认。正在为您寻找合适的解决方案..." : "请问您希望在哪个行业应用AI？例如：人力资源、市场营销",
        isFinished,
        suggestedPromptId
      });
    }, 1000);
  });
}

    