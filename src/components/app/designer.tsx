
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScenarioCard } from '@/components/app/scenario-card';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, UploadCloud, Library, Bot, LoaderCircle, Wand2 } from 'lucide-react';
import { digitalEmployee } from '@/ai/flows/digital-employee';
import { Separator } from '../ui/separator';

type Scenario = {
    id: string;
    title: string;
    description: string;
    industry: string;
    task: string;
    prompt: string;
};


const sampleScenarios: Scenario[] = [
    { 
        id: 'recruitment-expert', 
        title: '智能招聘助理', 
        description: '自动筛选简历、进行初步评估并安排面试。', 
        industry: '人力资源', 
        task: '招聘',
        prompt: 'You are an expert recruitment specialist. Analyze the provided job description and candidate resume to determine suitability.',
    },
    { 
        id: 'marketing-guru', 
        title: '营销内容生成器', 
        description: '根据产品信息和市场趋势，自动生成吸引人的社交媒体帖子。', 
        industry: '市场营销', 
        task: '内容创作',
        prompt: 'You are a marketing guru. Generate three creative and engaging social media posts based on the following product description.',
    },
    { 
        id: 'code-optimizer', 
        title: '代码优化机器人', 
        description: '审查代码片段并提供提高其性能和可读性的建议。', 
        industry: '软件开发', 
        task: '代码审查',
        prompt: 'You are a code optimization expert. Review the following code snippet and provide suggestions to improve its performance and readability.',
    },
];


export function Designer() {
  const [scenarios, setScenarios] = useState(sampleScenarios);
  const [newScenario, setNewScenario] = useState<Omit<Scenario, 'id'>>({ title: '', description: '', industry: '', task: '', prompt: '' });
  const [testContext, setTestContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testPromptId, setTestPromptId] = useState('');
  const { toast } = useToast();
  
  const handleInputChange = (field: keyof typeof newScenario, value: string) => {
    setNewScenario(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddScenario = () => {
    if (!newScenario.title || !newScenario.prompt) {
         toast({
            variant: 'destructive',
            title: '缺少信息',
            description: '请填写能力标题和核心提示词以添加新场景。',
        });
        return;
    }
    const newId = `custom-${newScenario.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const scenarioToAdd = { ...newScenario, id: newId };
    setScenarios(prev => [...prev, scenarioToAdd]);
    setNewScenario({ title: '', description: '', industry: '', task: '', prompt: '' });
    toast({
        title: '场景已添加',
        description: `能力 "${scenarioToAdd.title}" 已添加到场景库中。`,
    });
  }

  const handlePublishAndTest = async () => {
    const usePromptId = !!testPromptId.trim();
    const useNewPrompt = !usePromptId && !!newScenario.prompt.trim();

    if (!usePromptId && !useNewPrompt) {
        toast({
            variant: 'destructive',
            title: '缺少提示词',
            description: '请填写新的核心提示词，或提供一个已有的提示ID进行测试。',
        });
        return;
    }

    if (!testContext) {
        toast({
            variant: 'destructive',
            title: '缺少测试内容',
            description: '请输入需要AI处理的具体内容来测试效果。',
        });
        return;
    }


    setIsLoading(true);
    setTestResult('');
    
    try {
        const promptIdForCall = usePromptId ? testPromptId : `new-prompt-${Date.now()}`;
        const promptContentForCall = useNewPrompt ? newScenario.prompt : undefined;
        
        if (usePromptId) {
            toast({
                title: "正在测试已有提示...",
                description: `正在调用提示 ID: "${testPromptId}"。`,
            });
        } else {
             toast({
                title: "正在测试新提示...",
                description: `能力 "${newScenario.title || '新能力'}" 正在被测试。`,
            });
        }

        const result = await digitalEmployee({
            promptId: promptIdForCall,
            promptContent: promptContentForCall,
            userContext: testContext,
        });

        setTestResult(result.response);

    } catch (error) {
      console.error("Error testing digital employee flow:", error);
      toast({
        variant: "destructive",
        title: "测试失败",
        description: "调用 AI 流程时发生错误。",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-screen-2xl mx-auto">
      {/* Left Column: Library */}
      <div className="lg:col-span-7 h-full">
        <Card className="h-full flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Library className="h-6 w-6 text-accent"/>
                能力场景库
            </CardTitle>
            <CardDescription>
                浏览、搜索和管理已发布的 AI 数字员工能力场景。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                    {scenarios.map(scenario => (
                        <ScenarioCard key={scenario.id} scenario={scenario} />
                    ))}
                     <div 
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 cursor-pointer min-h-[220px]"
                        onClick={handleAddScenario}
                        role="button"
                        aria-label="添加新场景"
                     >
                        <PlusCircle className="h-8 w-8" />
                        <p className="mt-2 text-sm text-center">点击添加当前<br/>设计器中的场景</p>
                    </div>
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Designer */}
      <div className="lg:col-span-5 h-full">
         <Card className="h-full flex flex-col shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="h-6 w-6 text-accent"/>
                    数字员工设计器
                </CardTitle>
                <CardDescription>
                    在这里创建、配置和测试新的 AI 数字员工能力场景。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4 overflow-y-auto">
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 pr-4">
                        <div>
                            <Label htmlFor="scenario-title">能力标题</Label>
                            <Input id="scenario-title" placeholder="例如：智能招聘助理" value={newScenario.title} onChange={e => handleInputChange('title', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="scenario-desc">能力描述</Label>
                            <Textarea id="scenario-desc" placeholder="简要描述此能力解决了什么问题..." value={newScenario.description} onChange={e => handleInputChange('description', e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="scenario-industry">适用行业</Label>
                                <Input id="scenario-industry" placeholder="例如：人力资源" value={newScenario.industry} onChange={e => handleInputChange('industry', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="scenario-task">核心任务</Label>
                                <Input id="scenario-task" placeholder="例如：招聘" value={newScenario.task} onChange={e => handleInputChange('task', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="scenario-prompt">核心提示词 (Prompt)</Label>
                            <Textarea id="scenario-prompt" placeholder="创建新的提示词，或留空以使用下面的ID..." rows={5} value={newScenario.prompt} onChange={e => handleInputChange('prompt', e.target.value)} />
                        </div>
                        
                        <div className='flex items-center gap-2'>
                            <Separator className='flex-1' />
                            <span className='text-xs text-muted-foreground'>或</span>
                            <Separator className='flex-1' />
                        </div>
                        
                        <div>
                            <Label htmlFor="prompt-id">调用已有提示词ID进行测试</Label>
                            <Input id="prompt-id" placeholder="例如: recruitment-expert" value={testPromptId} onChange={e => setTestPromptId(e.target.value)} />
                        </div>

                        <Separator />

                        <div>
                            <Label htmlFor="scenario-test">测试内容</Label>
                            <Textarea id="scenario-test" placeholder="输入需要AI处理的具体内容来测试提示词效果..." value={testContext} onChange={e => setTestContext(e.target.value)} />
                        </div>
                        
                        {isLoading && (
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <LoaderCircle className="animate-spin h-5 w-5" />
                                <span>正在调用AI进行测试...</span>
                            </div>
                        )}
                        {testResult && (
                            <Card className="bg-secondary/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Wand2 className="h-5 w-5 text-accent" />
                                        测试输出
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm">
                                    <p className="whitespace-pre-wrap">{testResult}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>


                <div className="mt-auto pt-4 border-t">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePublishAndTest} disabled={isLoading}>
                        <UploadCloud className="mr-2 h-5 w-5" />
                        发布并测试
                    </Button>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
