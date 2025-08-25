
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, TestTube2, Trash2, PlusCircle, Link, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
// import { digitalEmployee } from '@/ai/flows/digital-employee';
import type { Scenario } from './ai-workbench';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Variable = {
    id: string;
    key: string;
    value: string;
};

type UserActionPanelProps = {
    scenario: Scenario | null;
};

// Mocked digitalEmployee function
const digitalEmployee = async (options: any): Promise<{ response: string }> => {
    console.log("Digital employee called (mocked):", options);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { response: "This is a mocked response from the AI digital employee." };
};


const extractVariables = (text: string): string[] => {
    if (!text) return [];
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.add(match[1]);
    }
    return Array.from(matches);
};


export function UserActionPanel({ scenario }: UserActionPanelProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [testResult, setTestResult] = useState('');

    useEffect(() => {
        if (scenario) {
            const extracted = extractVariables(scenario.prompt);
            setVariables(extracted.map((key, index) => ({
                id: `var-${key}-${index}`,
                key,
                value: ''
            })));
        } else {
            setVariables([]);
        }
        setTestResult(''); // Reset result when scenario changes
    }, [scenario]);


    const handleVariableChange = (id: string, value: string) => {
        setVariables(variables.map(v => v.id === id ? { ...v, value } : v));
    };

    const handleTestPrompt = async () => {
        if (!scenario) {
            toast({ variant: 'destructive', title: "未选择场景", description: "请先从左侧选择一个能力场景。" });
            return;
        }

        setIsGenerating(true);
        setTestResult('');
        
        try {
            const varsAsObject = variables.reduce((acc, v) => {
                if (v.key) acc[v.key] = v.value;
                return acc;
            }, {} as Record<string, string>);

            // If the scenario has an ID, we use it. If not, it's a tuned scenario without an ID, so we pass the content directly.
            const result = await digitalEmployee({
                promptId: scenario.id ? scenario.id : undefined,
                userPrompt: scenario.prompt, // Always pass the current prompt content for testing
                variables: varsAsObject,
            });
            
            setTestResult(result.response);
            toast({
                title: "测试成功",
                description: "AI 数字员工已成功返回结果。",
            });
        } catch (error: any) {
            console.error("Error executing digital employee flow:", error);
            toast({
                variant: "destructive",
                title: "测试失败",
                description: error.message,
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleConfirmCreateOrder = () => {
        if (!scenario) {
            toast({ variant: 'destructive', title: "无法创建订单", description: "请先选择一个有效的场景。" });
            return;
        }
        toast({
            title: "任务订单已生成 (模拟)",
            description: `已为场景“${scenario.title}”创建订单。在实际应用中，这将触发支付和交付流程。`
        });
    }

    if (!scenario) {
         return (
            <Card className="h-full flex flex-col items-center justify-center text-center shadow-lg">
                <CardHeader>
                     <CardTitle className="font-headline">操作面板</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        请从左侧选择或微调一个能力场景，
                        <br/>
                        即可在此进行测试和操作。
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Link className="h-5 w-5 text-accent"/>
                        提示库连接器
                    </CardTitle>
                     <CardDescription>
                       {scenario.id ? "当前已连接到库中的能力场景。" : "当前正在使用一个微调后的临时场景。"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                        <span className="text-sm font-medium text-muted-foreground">ID:</span>
                        <span className="text-sm font-mono text-foreground truncate">{scenario.id || 'N/A (未保存)'}</span>
                   </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <TestTube2 className="h-6 w-6 text-accent"/>
                        场景测试
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {variables.length > 0 ? variables.map((variable) => (
                        <div key={variable.id} className="space-y-1">
                            <Label htmlFor={variable.id}>{variable.key}</Label>
                            <Input 
                                id={variable.id}
                                placeholder={`输入 ${variable.key} 的值...`} 
                                value={variable.value} 
                                onChange={e => handleVariableChange(variable.id, e.target.value)} 
                            />
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">此场景无需输入变量。</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                     <Button className="w-full" onClick={handleTestPrompt} disabled={isGenerating}>
                        {isGenerating ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                        测试该场景
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                                <FileText className="mr-2 h-4 w-4"/>
                                确认并生成任务订单
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>确认生成任务订单？</AlertDialogTitle>
                            <AlertDialogDescription>
                                您即将根据以下场景生成一个任务订单，此操作在真实环境中可能会产生费用。
                                <div className="mt-4 rounded-md border bg-muted p-3 text-sm">
                                    <p><strong>场景名称:</strong> {scenario.title}</p>
                                    <p className="mt-1"><strong>场景ID:</strong> <span className="font-mono text-xs">{scenario.id || 'N/A (自定义)'}</span></p>
                                </div>
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmCreateOrder}>确认生成</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
            
            <Card className="flex-1 flex flex-col shadow-lg">
                <CardHeader>
                    <CardTitle>测试结果</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto relative bg-secondary/30 rounded-lg p-3 min-h-[150px]">
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {testResult ? (
                            <p className="whitespace-pre-wrap">{testResult}</p>
                        ) : (
                            !isGenerating && <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                <p>点击“测试”按钮以查看模型输出。</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
