"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, TestTube2, Trash2, PlusCircle, Sparkles, BrainCircuit } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { executePrompt } from '@/ai/flows/prompt-execution-flow';
import { analyzePromptMetadata, AnalyzePromptMetadataOutput } from '@/ai/flows/analyze-prompt-metadata';


type Variable = {
    id: string;
    key: string;
    value: string;
};

export function PromptEngineerWorkbench() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Prompt state
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


    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-4 md:p-6 lg:p-8">
            {/* Main Column: Editor */}
            <div className="lg:col-span-5 h-full flex flex-col gap-6">
                <Card className="flex-1 flex flex-col shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Sparkles className="h-6 w-6 text-accent" />
                           结构化提示词编辑器
                        </CardTitle>
                        <CardDescription>
                            在此设计和编排您的提示词。在用户指令中使用 `{{variable}}` 语法来定义可替换的变量。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 grid grid-cols-1 gap-4">
                       <div className="space-y-4">
                            <div>
                                <Label htmlFor="system-prompt">系统提示 (System)</Label>
                                <Textarea id="system-prompt" placeholder="例如：你是一个专业的翻译家..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="h-24" />
                            </div>
                             <div>
                                <Label htmlFor="user-prompt">用户指令 (User)</Label>
                                <Textarea id="user-prompt" placeholder="例如：将下面的文本翻译成 {{language}}: '{{text}}'" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} className="h-28" />
                            </div>
                       </div>
                       <div className="space-y-4">
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
                </Card>
            </div>
            
             {/* Middle Column: Config & Test */}
            <div className="lg:col-span-4 h-full flex flex-col gap-6">
                 <Card className="shadow-lg">
                     <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <TestTube2 className="h-6 w-6 text-accent"/>
                           配置与测试
                        </CardTitle>
                        <CardDescription>
                            调整模型参数和变量，然后生成并查看结果。
                        </CardDescription>
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
                        {isGenerating && (
                            <div className="flex items-center justify-center h-full">
                                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {testResult && (
                           <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto">
                                <p className="whitespace-pre-wrap">{testResult}</p>
                           </div>
                        )}
                         {!isGenerating && !testResult && (
                            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                <p>点击“生成”按钮以查看模型输出。</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* Right Column: Metadata */}
            <div className="lg:col-span-3 h-full flex flex-col gap-6">
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
                    <CardContent>
                        <Button className="w-full" onClick={handleAnalyzeMetadata} disabled={isAnalyzing}>
                             {isAnalyzing ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            一键生成元数据
                        </Button>
                    </CardContent>
                </Card>
                
                <Card className="flex-1 flex flex-col shadow-lg">
                    <CardHeader>
                        <CardTitle>生成的元数据</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                         {isAnalyzing && (
                            <div className="flex items-center justify-center h-full">
                                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {metadata && (
                           <div className="space-y-4 text-sm h-full overflow-y-auto">
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
                           </div>
                        )}
                         {!isAnalyzing && !metadata && (
                            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                <p>点击上方按钮以生成元数据。</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
