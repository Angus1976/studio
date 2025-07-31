"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { aiRequirementsNavigator, type AIRequirementsNavigatorOutput } from "@/ai/flows/ai-requirements-navigator";
import { aiScenarioArchitect, type AIScenarioArchitectOutput } from "@/ai/flows/ai-scenario-architect";

import { AppHeader } from "@/components/app/header";
import { RequirementsNavigator } from "@/components/app/requirements-navigator";
import { ScenarioArchitectView } from "@/components/app/scenario-architect-view";
import { WorkflowViewer } from "@/components/app/workflow-viewer";
import { ActionPanel } from "@/components/app/action-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Wand2 } from "lucide-react";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [extractedRequirements, setExtractedRequirements] = useState<string | undefined>(undefined);
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [scenarioOutput, setScenarioOutput] = useState<AIScenarioArchitectOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Start with a welcome message from the assistant
    setConversationHistory([
      {
        role: "assistant",
        content: "你好！我在这里帮助您定义 AI 驱动工作流的需求。首先，您能描述一下您希望自动化或改进的任务或流程吗？",
      },
    ]);
  }, []);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    const newUserMessage: ConversationMessage = { role: "user", content: currentInput };
    const newHistory = [...conversationHistory, newUserMessage];
    setConversationHistory(newHistory);
    setCurrentInput("");
    setIsLoading(true);

    try {
      const result: AIRequirementsNavigatorOutput = await aiRequirementsNavigator({
        userInput: currentInput,
        conversationHistory: conversationHistory,
      });

      setConversationHistory([...newHistory, { role: "assistant", content: result.aiResponse }]);
      if (result.isFinished && result.extractedRequirements) {
        setIsConversationFinished(true);
        setExtractedRequirements(result.extractedRequirements);
        toast({
          title: "需求已敲定！",
          description: "正在为您生成优化的工作场景...",
        });
        // Automatically trigger the scenario architect
        generateScenario(result.extractedRequirements);
      }
    } catch (error) {
      console.error("AI 需求导航器出错:", error);
      toast({
        variant: "destructive",
        title: "发生错误。",
        description: "从 AI 获取响应失败。请重试。",
      });
      setConversationHistory(conversationHistory); // Revert to previous history on error
    } finally {
      setIsLoading(false);
    }
  };

  const generateScenario = async (requirements: string) => {
    setIsLoading(true);
    try {
      const result = await aiScenarioArchitect({ userRequirements: requirements });
      setScenarioOutput(result);
    } catch (error) {
      console.error("AI 场景架构师出错:", error);
      toast({
        variant: "destructive",
        title: "发生错误。",
        description: "生成 AI 场景失败。请重试。",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTaskOrderGeneration = () => {
    toast({
        title: "任务订单已生成",
        description: "您的任务订单已成功创建。",
      });
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-screen-2xl mx-auto">
          {/* Left Column: Requirements Navigator */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <RequirementsNavigator
              history={conversationHistory}
              isLoading={isLoading}
              isFinished={isConversationFinished}
              currentInput={currentInput}
              setCurrentInput={setCurrentInput}
              onFormSubmit={handleFormSubmit}
            />
          </div>

          {/* Middle Column: Scenario & Workflow */}
          <div className="lg:col-span-5 xl:col-span-6 h-full flex flex-col gap-6 overflow-y-auto">
            {scenarioOutput ? (
              <>
                <ScenarioArchitectView
                  scenario={scenarioOutput}
                  onScenarioChange={setScenarioOutput}
                />
                <WorkflowViewer tasks={scenarioOutput.aiAutomatableTasks} />
              </>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center bg-card/50 border-dashed">
                <div className="text-center p-8">
                  <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">AI 场景架构师</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    一旦您的需求最终确定，您优化的工作场景将显示在此处。
                  </p>
                  {isLoading && isConversationFinished && (
                     <div className="flex items-center justify-center gap-2 mt-4 text-primary">
                        <LoaderCircle className="animate-spin h-5 w-5" />
                        <span>正在生成场景...</span>
                     </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-3 xl:col-span-3 h-full">
            <ActionPanel isScenarioReady={!!scenarioOutput} onGenerateTaskOrder={handleTaskOrderGeneration} />
          </div>
        </div>
      </main>
    </div>
  );
}
