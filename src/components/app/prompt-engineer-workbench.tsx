
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, TestTube2, Trash2, PlusCircle, Sparkles, BrainCircuit, Save, Library, BookCopy } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { executePrompt } from '@/ai/flows/prompt-execution-flow';
import { analyzePromptMetadata, AnalyzePromptMetadataOutput } from '@/ai/flows/analyze-prompt-metadata';
import { savePrompt } from '@/ai/flows/save-prompt-flow';
import { getPrompts, GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { PromptLibrary, Prompt } from './prompt-library';
import { Apply } from 'lucide-react';

type Variable = {
    id: string;
    key: string;
    value: string;
};

export function PromptEngineerWorkbench() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Prompt state
    const [activePromptId, setActivePromptId] = useState<string | null>(null);
    const [promptName, setPromptName] = useState('新的提示词');
    const [promptScope, setPromptScope] = useState<'通用' | '专属'>('通用');
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
    const [userPrompt, setUserPrompt] = useState('Translate the following text to {{language}}: "{{text}}"');
    const [context, setContext] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    // Config state
    const [temperature, setTemperature] = useState(0.7);
    const [variables, setVariables] = useState<Variable[]>([
        { id: 'var1', key: 'language', value: 'French' },
        { id: 'var2', key: 'text', value: 'Hello, world!' }
    ]);
    const [testResult, setTestResult] = useState('');
    const [metadata, setMetadata] = useState<AnalyzePromptMetadataOutput | null>(null);

    // Prompt Library State
    const [prompts, setPrompts] = useState<GetPromptsOutput>([]);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);

     const fetchPrompts = async () => {
        setIsLoadingPrompts(true);
        try {
            const fetchedPrompts = await getPrompts();
            setPrompts(fetchedPrompts);
        } catch (error) {
            console.error("Error fetching prompts:", error);
            toast({
                variant: "destructive",
                title: "加载提示词库失败",
                description: "无法从数据库获取提示词列表。",
            });
        } finally {
            setIsLoadingPrompts(false);
        }
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    const handleAddVariable = () => {
        setVariables([...variables, { id: `var${Date.now()}`, key: '', value: '' }]);
    };
    
    const handleRemoveVariable = (id: string) => {
        setVariables(variables.filter(v => v.id !== id));
    };

    const handleVariableChange = (id: string, field: 'key' | 'value', value: string) => {
        setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const handleTestPrompt = async () => {
        setIsGenerating(true);
        setTestResult('');
        
        try {
            const varsAsObject = variables.reduce((acc, v) => {
                if (v.key) acc[v.key] = v.value;
                return acc;
            }, {} as Record<string, string>);

            const result = await executePrompt({
                systemPrompt,
                userPrompt,
                context,
                negativePrompt,
                variables: varsAsObject,
                temperature,
            });
            
            setTestResult(result.response);
            toast({
                title: "生成成功",
                description: "模型已成功返回结果。",
            });
        } catch (error) {
            console.error("Error executing prompt flow:", error);
            toast({
                variant: "destructive",
                title: "生成失败",
                description: "调用 AI 流程时发生错误。",
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleAnalyzeMetadata = async () => {
        setIsAnalyzing(true);
        setMetadata(null);
        try {
            const result = await analyzePromptMetadata({
                systemPrompt,
                userPrompt,
                context,
                negativePrompt
            });
            setMetadata(result);
            toast({
                title: "元数据分析完成",
                description: "AI 已成功为您的提示词生成元数据。"
            });
        } catch (error) {
            console.error("Error analyzing metadata:", error);
            toast({
                variant: "destructive",
                title: "分析失败",
                description: "AI 分析元数据时发生错误。",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSelectPrompt = (prompt: Prompt) => {
        setActivePromptId(prompt.id);
        setPromptName(prompt.name);
        setPromptScope(prompt.scope);
        setSystemPrompt(prompt.systemPrompt || '');
        setUserPrompt(prompt.userPrompt);
        setContext(prompt.context || '');
        setNegativePrompt(prompt.negativePrompt || '');
        setMetadata(null); // Clear metadata when loading a new prompt
        
        toast({
            title: `提示词已加载: ${prompt.name}`,
            description: "内容已填充到编辑器中。",
        });
    };

    const handleSavePrompt = async () => {
        setIsSaving(true);
        try {
            const result = await savePrompt({
                id: activePromptId || undefined,
                name: promptName,
                scope: promptScope,
                systemPrompt,
                userPrompt,
                context,
                negativePrompt,
                metadata: metadata ? {
                    recommendedModel: metadata.recommendedModel,
                    constraints: metadata.constraints,
                    scenario: metadata.scenario
                } : undefined
            });

            if (result.success) {
                toast({
                    title: result.message,
                });
                // Refresh the prompt list to show the new/updated prompt
                await fetchPrompts();
                // If it was a new prompt, select it
                if (!activePromptId) {
                   setActivePromptId(result.id);
                }
            } else {
                 toast({ variant: "destructive", title: "保存失败", description: result.message });
            }

        } catch (error) {
            console.error("Error saving prompt:", error);
            toast({ variant: "destructive", title: "保存时发生错误", description: "无法连接到后端服务。" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleApplyMetadata = () => {
        if (!metadata) {
            toast({ variant: 'destructive', title: '无元数据可应用', description: '请先生成元数据。'});
            return;
        }
        setPromptName(`${metadata.scope} - ${metadata.scenario}`);
        setPromptScope('通用');
        toast({ title: '元数据已应用', description: '提示词名称已根据AI建议更新。'});
    };


    return (
        <ThreeColumnLayout>
            <ThreeColumnLayout.Left>
                 <PromptLibrary 
                    prompts={prompts} 
                    onSelectPrompt={handleSelectPrompt}
                    isLoading={isLoadingPrompts}
                />
            </ThreeColumnLayout.Left>
            
            <ThreeColumnLayout.Main>
                 <Card className="shadow-lg h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Sparkles className="h-6 w-6 text-accent" />
                           结构化提示词编辑器
                        </CardTitle>
                        <CardDescription>
                            在此设计和编排您的提示词。在用户指令中使用 `{"{{variable}}"`} 语法来定义可替换的变量。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto p-4">
                       <div className="space-y-1">
                            <Label htmlFor="prompt-name">提示词名称</Label>
                            <Input id="prompt-name" value={promptName} onChange={(e) => setPromptName(e.target.value)} />
                       </div>
                       <div className="grid gap-4">
                            <div>
                                <Label htmlFor="system-prompt">系统提示 (System)</Label>
                                <Textarea id="system-prompt" placeholder="例如：你是一个专业的翻译家..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="h-24" />
                            </div>
                             <div>
                                <Label htmlFor="user-prompt">用户指令 (User)</Label>
                                <Textarea id="user-prompt" placeholder="例如：将下面的文本翻译成 {{language}}: '{{text}}'" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} className="h-28" />
                            </div>
                       </div>
                       <div className="grid gap-4">
                            <div>
                                <Label htmlFor="context">示例/上下文 (Context)</Label>
                                <Textarea id="context" placeholder="提供一些一次性或少样本示例..." value={context} onChange={(e) => setContext(e.target.value)} className="h-24" />
                            </div>
                             <div>
                                <Label htmlFor="negative-prompt">反向提示 (Negative)</Label>
                                <Textarea id="negative-prompt" placeholder="描述不希望在输出中看到的内容..." value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="h-24" />
                            </div>
                       </div>
                    </CardContent>
                     <CardFooter>
                        <Button className="w-full" onClick={handleSavePrompt} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            保存到库
                        </Button>
                    </CardFooter>
                </Card>
                
            </ThreeColumnLayout.Main>

            <ThreeColumnLayout.Right>
                <div className="flex flex-col gap-6 h-full">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                            <TestTube2 className="h-6 w-6 text-accent"/>
                            配置与测试
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="temperature" className="flex justify-between"><span>Temperature</span><span>{temperature}</span></Label>
                                <Slider id="temperature" min={0} max={1} step={0.1} value={[temperature]} onValueChange={([val]) => setTemperature(val)} />
                            </div>
                            <div className="space-y-2">
                                <Label>测试变量</Label>
                                {variables.map((variable, index) => (
                                    <div key={variable.id} className="flex items-center gap-2">
                                        <Input placeholder="Key" value={variable.key} onChange={e => handleVariableChange(variable.id, 'key', e.target.value)} />
                                        <Input placeholder="Value" value={variable.value} onChange={e => handleVariableChange(variable.id, 'value', e.target.value)} />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveVariable(variable.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={handleAddVariable}><PlusCircle className="mr-2 h-4 w-4"/>添加变量</Button>
                            </div>
                            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleTestPrompt} disabled={isGenerating}>
                                {isGenerating ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                                生成
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="flex-1 flex flex-col shadow-lg">
                        <CardHeader>
                            <CardTitle>输出结果</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto relative bg-secondary/30 rounded-lg p-2">
                                {isGenerating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {testResult ? (
                                <p className="whitespace-pre-wrap">{testResult}</p>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                        <p>点击“生成”按钮以查看模型输出。</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                            <BrainCircuit className="h-6 w-6 text-accent"/>
                            AI 辅助元数据
                            </CardTitle>
                            <CardDescription>
                                让 AI 分析您的提示词并自动生成专业的元数据。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" onClick={handleAnalyzeMetadata} disabled={isAnalyzing}>
                                {isAnalyzing ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                一键生成元数据
                            </Button>
                            {isAnalyzing && (
                                <div className="flex items-center justify-center text-sm text-muted-foreground">
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                    正在分析中...
                                </div>
                            )}
                            {metadata && (
                                <div className="space-y-4 text-sm pt-4 border-t">
                                <div>
                                    <h4 className="font-semibold mb-1">适用范围</h4>
                                    <p className="text-muted-foreground">{metadata.scope}</p>

                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">推荐模型</h4>
                                    <p className="text-muted-foreground">{metadata.recommendedModel}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">约束条件</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{metadata.constraints}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">适用场景</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{metadata.scenario}</p>
                                </div>
                                    <Button variant="outline" className="w-full" onClick={handleApplyMetadata}>
                                        <Apply className="mr-2 h-4 w-4"/>
                                        应用元数据到名称
                                    </Button>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ThreeColumnLayout.Right>
        </ThreeColumnLayout>
    );
}
