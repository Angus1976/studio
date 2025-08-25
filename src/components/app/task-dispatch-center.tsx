
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, Send, Check, X, Bot, Wand2, Lightbulb } from 'lucide-react';
// import { taskDispatch, type TaskDispatchOutput } from '@/ai/flows/task-dispatch-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaskCard } from './task-card';
import type { Task } from "@/lib/data-types";
import { TaskDependencyArrow } from './task-card';

// Mocked types and functions
type TaskDispatchOutput = {
    planSummary: string;
    tasks: Task[];
    isClarificationNeeded: boolean;
};

const taskDispatch = async (input: { userCommand: string }): Promise<TaskDispatchOutput> => {
    console.log("Dispatching task (mocked):", input);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (input.userCommand.includes("?")) {
        return {
            planSummary: "我需要更多信息，您能告诉我具体要分析哪个季度的销售数据吗？",
            tasks: [],
            isClarificationNeeded: true,
        };
    }
    
    return {
        planSummary: "好的，收到指令。我将首先分析第三季度的销售数据，找出前三名销售冠军；然后为他们起草一封祝贺邮件；最后将邮件发送给他们。您确认后即可开始执行。",
        tasks: [
          { id: 'task-1', agent: '数据分析Agent', description: '连接CRM，分析Q3销售数据，识别销售额前三名的员工。', status: 'pending', dependencies: [] },
          { id: 'task-2', agent: '文案撰写Agent', description: '根据销售冠军名单，撰写一封热情洋溢的祝贺邮件。', status: 'pending', dependencies: ['task-1'] },
          { id: 'task-3', agent: '邮件发送Agent', description: '将祝贺邮件发送给销售团队的前三名成员。', status: 'pending', dependencies: ['task-2'] }
        ],
        isClarificationNeeded: false,
    };
};

type TaskDispatchCenterProps = {
    // We can add props to load/save tasks later
};

export function TaskDispatchCenter({}: TaskDispatchCenterProps) {
    const { toast } = useToast();
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [taskPlan, setTaskPlan] = useState<TaskDispatchOutput | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentExecutingTask, setCurrentExecutingTask] = useState<string | null>(null);

    const examplePrompts = [
        "帮我分析Q3销售数据并给销售团队前三名发一封祝贺邮件",
        "总结一下最近关于AI技术的新闻，并生成一份报告摘要",
        "创建一个新的客户跟进任务，提醒我下周一联系ABC公司"
    ];

    const handleUseExample = (prompt: string) => {
        setUserInput(prompt);
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        setIsLoading(true);
        setTaskPlan(null);
        setTasks([]);

        try {
            const result = await taskDispatch({ userCommand: userInput });
            if (result.isClarificationNeeded) {
                // For now, just show the clarification question. A real implementation would handle this in a chat format.
                 toast({
                    variant: 'default',
                    title: 'AI 需要更多信息',
                    description: result.planSummary,
                });
            } else {
                setTaskPlan(result);
                setTasks(result.tasks);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '任务规划出错',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExecutePlan = () => {
        if (!tasks.length) return;
        
        toast({ title: '开始执行任务计划 (模拟)', description: '将按顺序执行所有步骤。'});
        
        let delay = 0;
        tasks.forEach(task => {
            setTimeout(() => {
                handleExecuteTask(task.id);
            }, delay);
            delay += 2000; // 2-second delay between each task execution
        });
    }

    const handleExecuteTask = (taskId: string) => {
        setCurrentExecutingTask(taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t));

        // Simulate task execution
        setTimeout(() => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
            setCurrentExecutingTask(null);
        }, 1500); // Simulate 1.5 second execution time
    }

    const handleCancelPlan = () => {
        setTaskPlan(null);
        setTasks([]);
        setUserInput('');
    }

    return (
        <div className="h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  {taskPlan ? (
                     <Alert>
                        <Bot className="h-4 w-4" />
                        <AlertTitle>AI 生成的任务计划</AlertTitle>
                        <AlertDescription className="flex items-start justify-between gap-4">
                           <p className="flex-1 py-1">{taskPlan.planSummary}</p>
                           <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={handleCancelPlan}><X className="mr-1.5 h-4 w-4"/>取消</Button>
                             <Button size="sm" onClick={handleExecutePlan}><Check className="mr-1.5 h-4 w-4"/>确认并执行</Button>
                           </div>
                        </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="text-center text-muted-foreground p-4 h-full flex flex-col justify-center">
                        <Lightbulb className="mx-auto h-12 w-12 text-accent/50 mb-4"/>
                        <p className="mb-2 font-semibold text-foreground">欢迎使用专家模式</p>
                        <p className="text-sm mb-4">
                            在这里，您可以通过自然语言直接下达复杂指令。
                            <br />
                            AI 将为您分解任务、规划流程并调度智能 Agent 自动执行。
                        </p>
                        <p className="text-sm">试试说：</p>
                        <blockquote className="mt-2 text-sm italic text-foreground/80 border-l-2 border-border pl-3 text-left max-w-md mx-auto">
                            “帮我分析Q3销售数据并给销售团队前三名发一封祝贺邮件”
                        </blockquote>
                    </div>
                  )}

                  {tasks.length > 0 && (
                      <div className="mt-6">
                        {tasks.map((task, index) => (
                           <div key={task.id}>
                                <TaskCard 
                                    task={task} 
                                    onExecute={handleExecuteTask}
                                    isExecuting={!!currentExecutingTask}
                                />
                                {index < tasks.length - 1 && <TaskDependencyArrow />}
                           </div>
                        ))}
                      </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSubmit} className="relative mt-4">
                    <Textarea
                        placeholder="例如: 帮我分析上个季度的用户增长数据，并生成一份图文并茂的报告..."
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        disabled={isLoading}
                        className="pr-14"
                    />
                     <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-10" disabled={isLoading || !userInput.trim()}>
                        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                </form>
            </CardContent>
        </div>
    );
}
