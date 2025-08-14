

"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { aiRequirementsNavigator, type AIRequirementsNavigatorOutput, type AIRequirementsNavigatorInput } from "@/ai/flows/ai-requirements-navigator";
import { digitalEmployee, type DigitalEmployeeInput, type DigitalEmployeeOutput } from "@/ai/flows/digital-employee";

import type { Scenario } from "@/components/app/designer";
import { sampleScenarios } from "@/components/app/designer";
import { createReminderFlow, type CreateReminderOutput } from "@/ai/flows/create-reminder-flow";


import { AppHeader } from "@/components/app/header";
import { RequirementsNavigator } from "@/components/app/requirements-navigator";
import { ScenarioArchitectView } from "@/components/app/scenario-architect-view";
import { Designer } from "@/components/app/designer";
import { AdminDashboard } from "@/components/app/admin-dashboard";
import { TenantDashboard } from "@/components/app/tenant-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LoaderCircle, Wand2, LogIn, UserPlus, Users, Bot, ClipboardCheck, ArrowRight, ShieldCheck, ExternalLink, Link as LinkIcon, FileText, CalendarPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SystemCapabilities } from "@/components/app/system-capabilities";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogClose } from "@/components/ui/alert-dialog";
import { ScenarioLibraryViewer } from "@/components/app/scenario-library-viewer";
import { ThreeColumnLayout } from "@/components/app/layouts/three-column-layout";
import { TaskDispatchCenter, type Task } from "@/components/app/task-dispatch-center";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    reminder?: CreateReminderOutput;
  }
};

const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const isDemo = sessionStorage.getItem('isDemo') === 'true';
        const demoRole = sessionStorage.getItem('demoRole');

        if (isDemo && demoRole) {
            setUser({ uid: 'demo-user' } as User);
            setUserRole(demoRole);
            setIsLoading(false);
            // Clear the demo flag after using it
            sessionStorage.removeItem('isDemo');
            sessionStorage.removeItem('demoRole');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser(currentUser);
                    setUserRole(userDoc.data().roleName);
                } else {
                    // This case handles if a user is in Auth but not Firestore.
                    // It logs them out to prevent an inconsistent state.
                    await signOut(auth);
                    setUser(null);
                    setUserRole(null);
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            toast({ title: "已登出", description: "您已成功登出。" });
            router.push('/login');
        } catch (error) {
            console.error("登出失败:", error);
            toast({ variant: "destructive", title: "登出失败" });
        }
    };

    return { isAuthenticated: !!user, user, userRole, isLoading, logout };
};


export default function Home() {
  const { isAuthenticated, userRole, isLoading: isAuthLoading, logout } = useAuth();
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [promptId, setPromptId] = useState("");
  const { toast } = useToast();
  
  const [recommendedScenarios, setRecommendedScenarios] = useState<Scenario[]>([]);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingReminder, setPendingReminder] = useState<CreateReminderOutput | null>(null);
  const [isTaskCenterMaximized, setIsTaskCenterMaximized] = useState(false);


  useEffect(() => {
    if (isAuthenticated && !['平台方 - 技术工程师', '平台方 - 管理员', '用户方 - 企业租户'].includes(userRole || '')) {
        // Start with a welcome message from the assistant
        setConversationHistory([
        {
            role: "assistant",
            content: "你好！我在这里帮助您定义 AI 驱动工作流的需求，或者您可以直接告诉我需要创建什么提醒或任务。",
        },
        ]);
    }
  }, [isAuthenticated, userRole]);
  
  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setPromptId(scenario.id);
    toast({
      title: "场景已选用",
      description: `已选择 "${scenario.title}"。您现在可以在操作面板中连接并测试它。`,
    });
  };
  
    const handleConfirmReminder = (reminderDetails: CreateReminderOutput) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            icon: 'CalendarClock',
            title: reminderDetails.title,
            description: `截止时间: ${reminderDetails.dateTime}`,
            timestamp: '刚刚',
            status: '待确认',
            tags: [{ text: '日程提醒', variant: 'primary' }]
        };
        setTasks(prev => [newTask, ...prev]);
        setPendingReminder(null);
        toast({
            title: '任务已创建',
            description: `“${reminderDetails.title}”已添加到您的任务中心。`,
            action: (
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                <span>添加到日历</span>
              </div>
            )
        });
    };

    const handleCancelReminder = () => {
        setPendingReminder(null);
        toast({
            title: '操作已取消',
            description: '创建提醒的操作已被取消。',
            variant: 'destructive',
        });
    };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    const newUserMessage: ConversationMessage = { role: "user", content: currentInput };
    const newHistory = [...conversationHistory, newUserMessage];
    setConversationHistory(newHistory);
    const latestUserInput = currentInput;
    setCurrentInput("");
    setIsLoading(true);

    try {
        // Simple heuristic to detect if the user wants to create a reminder
        if (latestUserInput.includes('提醒') || latestUserInput.includes('安排')) {
             const result = await createReminderFlow({ userInput: latestUserInput });
             const assistantMessage: ConversationMessage = {
                role: 'assistant',
                content: `好的，我将为您创建一个提醒：\n**${result.title}**\n时间：${result.dateTime}\n\n请确认信息是否正确。`,
             };
             setConversationHistory([...newHistory, assistantMessage]);
             setPendingReminder(result);
        } else {
            // Fallback to requirements navigator
            const result = await aiRequirementsNavigator({
                userInput: latestUserInput,
                // @ts-ignore
                conversationHistory: conversationHistory,
            });

            setConversationHistory([...newHistory, { role: "assistant", content: result.aiResponse }]);
            
            if (result.isFinished) {
                setIsConversationFinished(true);

                if (result.suggestedPromptId) {
                    setPromptId(result.suggestedPromptId);
                    let recommendations = sampleScenarios.filter(s => s.id.includes(result.suggestedPromptId!.split('-')[0]));
                    if (recommendations.length === 0) {
                      recommendations = sampleScenarios;
                    }
                    setRecommendedScenarios(recommendations);
                    
                    toast({
                        title: "需求分析完成！",
                        description: "我们已经理解您的需求，并为您推荐了以下解决方案。",
                    });
                }
            }
        }
    } catch (error) {
      console.error("AI flow error:", error);
      toast({
        variant: "destructive",
        title: "发生错误。",
        description: "从 AI 获取响应失败。请重试。",
      });
      // Revert to previous history on error and put user's message back in input
      setConversationHistory(conversationHistory); 
      setCurrentInput(latestUserInput);
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
            <h1 className="text-4xl font-bold font-headline text-foreground mb-4">欢迎来到 AI 任务流平台</h1>
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
     <ThreeColumnLayout>
        <ThreeColumnLayout.Left 
            className={cn(isTaskCenterMaximized && "lg:col-span-5")}
        >
             <TaskDispatchCenter 
                tasks={tasks} 
                setTasks={setTasks}
                isMaximized={isTaskCenterMaximized}
                onToggleMaximize={() => setIsTaskCenterMaximized(prev => !prev)}
            />
        </ThreeColumnLayout.Left>
        
        <ThreeColumnLayout.Main
            className={cn(isTaskCenterMaximized && "hidden lg:flex")}
        >
            <RequirementsNavigator
                history={conversationHistory}
                isLoading={isLoading}
                isFinished={isConversationFinished}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                onFormSubmit={handleFormSubmit}
                pendingReminder={pendingReminder}
                onConfirmReminder={handleConfirmReminder}
                onCancelReminder={handleCancelReminder}
            />
        </ThreeColumnLayout.Main>

        <ThreeColumnLayout.Right className="flex flex-col gap-6">
        {isConversationFinished ? (
            <div className="space-y-6">
                 <ScenarioLibraryViewer 
                    scenarios={recommendedScenarios}
                    onSelect={handleSelectScenario}
                    onEdit={handleEditScenario}
                />

                {editingScenario && (
                    <ScenarioArchitectView
                        scenario={editingScenario}
                        onScenarioChange={setEditingScenario}
                    />
                )}
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
                            placeholder="选用场景或输入ID" 
                            value={promptId}
                            onChange={(e) => setPromptId(e.target.value)}
                            />
                            <Button variant="outline" size="icon" onClick={handleConnectPrompt} disabled={isLoading}>
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
                            <Button variant="outline" onClick={() => window.open('https://www.alipay.com', '_blank')}>
                            支付定金
                            <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                            <Button variant="outline" onClick={() => window.open('https://www.alipay.com', '_blank')}>
                            支付尾款
                            <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto">
                        <Separator className="mb-6" />
                         {editingScenario && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                        确认并生成任务订单
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>确认您的任务订单</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            请检查以下根据您的需求生成的任务订单摘要。确认后，此订单将被创建。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2"><FileText /> 任务摘要</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <p><strong className="font-medium">场景标题:</strong> {editingScenario.title}</p>
                                            <p><strong className="font-medium">场景描述:</strong> {editingScenario.description.substring(0, 100)}...</p>
                                        </CardContent>
                                    </Card>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>返回修改</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleTaskOrderGeneration}>确认生成</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <Card className="h-full flex flex-col items-center justify-center bg-card/50 border-dashed">
            <div className="text-center p-8">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">AI 场景架构师</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                完成中间部分的需求导航后，这里将为您展示推荐的解决方案。
                </p>
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-primary">
                    <LoaderCircle className="animate-spin h-5 w-5" />
                    <span>正在分析您的需求...</span>
                    </div>
                )}
            </div>
            </Card>
        )}
        </ThreeColumnLayout.Right>
     </ThreeColumnLayout>
  );

  const renderEngineerView = () => (
    <Designer />
  );
  
  const renderAdminView = () => (
    <AdminDashboard />
  );

  const renderTenantView = () => (
    <TenantDashboard />
  );

  const renderContent = () => {
    switch (userRole) {
        case '平台方 - 管理员':
            return renderAdminView();
        case '平台方 - 技术工程师':
            return renderEngineerView();
        case '用户方 - 企业租户':
            return renderTenantView();
        default:
            return renderUserView();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <AppHeader userRole={userRole} onLogout={logout} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
