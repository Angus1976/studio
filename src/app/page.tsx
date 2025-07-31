
"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { aiRequirementsNavigator, type AIRequirementsNavigatorOutput } from "@/ai/flows/ai-requirements-navigator";
import { aiScenarioArchitect, type AIScenarioArchitectOutput } from "@/ai/flows/ai-scenario-architect";

import { AppHeader } from "@/components/app/header";
import { RequirementsNavigator } from "@/components/app/requirements-navigator";
import { ScenarioArchitectView } from "@/components/app/scenario-architect-view";
import { WorkflowViewer } from "@/components/app/workflow-viewer";
import { Designer } from "@/components/app/designer";
import { AdminDashboard } from "@/components/app/admin-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoaderCircle, Wand2, LogIn, UserPlus, Users, Bot, ClipboardCheck, ArrowRight, ShieldCheck, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SystemCapabilities } from "@/components/app/system-capabilities";


type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

// 模拟检查用户是否已登录
// 在真实应用中，这应该来自您的认证上下文或会话管理
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 在真实应用中，您会在这里检查有效的会话或令牌
        const loggedIn = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated');
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        
        // 为了演示，我们将其设置为true
        setTimeout(() => {
             setIsAuthenticated(!!loggedIn);
             setUserRole(role);
             setIsLoading(false);
        }, 500);
    }, [])

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserRole(null);
        window.location.reload();
    }

    return { isAuthenticated, userRole, isLoading, logout };
};


export default function Home() {
  const { isAuthenticated, userRole, isLoading: isAuthLoading, logout } = useAuth();
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [extractedRequirements, setExtractedRequirements] = useState<string | undefined>(undefined);
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [scenarioOutput, setScenarioOutput] = useState<AIScenarioArchitectOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [promptId, setPromptId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && !['平台方 - 技术工程师', '平台方 - 管理员'].includes(userRole || '')) {
        // Start with a welcome message from the assistant
        setConversationHistory([
        {
            role: "assistant",
            content: "你好！我在这里帮助您定义 AI 驱动工作流的需求。首先，您能描述一下您希望自动化或改进的任务或流程吗？",
        },
        ]);
    }
  }, [isAuthenticated, userRole]);

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
        description: "您的任务订单已成功创建。请前往支付。",
      });
  };

  const handleConnectPrompt = async () => {
    if (!promptId) {
        toast({
            variant: "destructive",
            title: "错误",
            description: "请输入提示ID。",
        });
        return;
    }
    setIsLoading(true);
    try {
        const { promptLibraryConnector } = await import("@/ai/flows/prompt-library-connector");
        const result = await promptLibraryConnector({ promptId });
        toast({
            title: "提示已连接",
            description: `成功获取提示: "${result.promptTitle}"`,
        });
        console.log("获取的提示内容:", result.promptContent);
    } catch (error) {
        console.error("连接提示库出错:", error);
        toast({
            variant: "destructive",
            title: "连接失败",
            description: "无法从库中获取提示。",
        });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
      return (
          <div className="flex h-full items-center justify-center bg-background">
              <LoaderCircle className="h-12 w-12 animate-spin text-accent" />
          </div>
      )
  }

  if (!isAuthenticated) {
    return (
         <div className="flex flex-col h-full items-center justify-center bg-background p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
                <Users className="h-16 w-16 text-accent" />
                <Bot className="h-16 w-16 text-accent" />
            </div>
            <h1 className="text-4xl font-bold font-headline text-foreground mb-4">欢迎来到 AI 任务流 C2C 平台</h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
               一个连接 AI 数字员工设计者与需求方的市场。在这里，您可以购买、定制或亲自设计和销售 AI 驱动的工作流程。
            </p>
            <div className="flex gap-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/login">
                        <LogIn className="mr-2" />
                        登录
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/signup">
                       <UserPlus className="mr-2" />
                       注册
                    </Link>
                </Button>
            </div>
        </div>
    )
  }

  const renderUserView = () => (
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

        {/* Right Columns: Scenario & Actions */}
        <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col gap-6 overflow-y-auto">
        {scenarioOutput ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <ScenarioArchitectView
                        scenario={scenarioOutput}
                        onScenarioChange={setScenarioOutput}
                    />
                    <WorkflowViewer tasks={scenarioOutput.aiAutomatableTasks} />
                </div>
                <div className="xl:col-span-1">
                     <Card className="flex-grow flex flex-col">
                        <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6 text-accent" />
                            <span>操作</span>
                        </CardTitle>
                        <CardDescription>
                            管理您的工作流、能力和付款。
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between gap-6">
                        <div className="space-y-6">
                            <SystemCapabilities />
                            <Separator />
                            <div>
                            <Label htmlFor="prompt-id" className="text-sm font-medium flex items-center gap-2 mb-2">
                                <LinkIcon className="h-4 w-4" />
                                提示库连接器
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                id="prompt-id" 
                                placeholder="输入提示 ID" 
                                value={promptId}
                                onChange={(e) => setPromptId(e.target.value)}
                                />
                                <Button variant="outline" size="icon" onClick={handleConnectPrompt}>
                                <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                            <Separator />
                            <div>
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4" />
                                安全支付
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">通过可信的第三方平台（如天猫）担保交易，保障资金安全。</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline">
                                支付定金
                                <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                                <Button variant="outline">
                                支付尾款
                                <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                            </div>
                        </div>
                        
                        <div className="mt-auto">
                            <Separator className="mb-6" />
                            <Button 
                                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={handleTaskOrderGeneration}
                            >
                            确认并生成任务订单
                            </Button>
                        </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
    </div>
  );

  const renderEngineerView = () => (
    <Designer />
  );
  
  const renderAdminView = () => (
    <AdminDashboard />
  );

  const renderContent = () => {
    switch (userRole) {
        case '平台方 - 管理员':
            return renderAdminView();
        case '平台方 - 技术工程师':
            return renderEngineerView();
        default:
            return renderUserView();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <AppHeader userRole={userRole} onLogout={logout} />
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
