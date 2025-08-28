
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, TestTube2, Trash2, PlusCircle, Bot } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { executePrompt } from '@/ai/flows/prompt-execution-flow';
import { getPlatformAssets } from '@/ai/flows/admin-management-flows';
import type { PromptData } from './prompt-editor';
import type { LlmConnection } from '@/lib/data-types';

type Variable = {
    id: string;
    key: string;
    value: string;
};

type PromptTestbedProps = {
    prompt: PromptData;
};


export function PromptTestbed({ prompt }: PromptTestbedProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [temperature, setTemperature] = useState(0.7);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [testResult, setTestResult] = useState('');
    
    const [models, setModels] = useState<LlmConnection[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isLoadingModels, setIsLoadingModels] = useState(true);

    useEffect(() => {
        async function fetchModels() {
            try {
                const { llmConnections } = await getPlatformAssets();
                setModels(llmConnections);
                if (llmConnections.length > 0) {
                    setSelectedModel(llmConnections[0].id);
                }
            } catch (error: any) {
                console.error("Failed to fetch models", error);
                toast({
                    variant: "destructive",
                    title: "加载模型失败",
                    description: error.message || "无法从数据库获取已配置的模型列表。"
                });
            } finally {
                setIsLoadingModels(false);
            }
        }
        fetchModels();
    }, [toast]);
    
    // Auto-update variables when prompt changes
    useEffect(() => {
        const regex = /{{\s*(\w+)\s*}}/g;
        const newVars = new Set<string>();
        let match;
        while(match = regex.exec(prompt.userPrompt)) {
            newVars.add(match[1]);
        }
        setVariables(Array.from(newVars).map((key, i) => ({
            id: `var-${key}-${i}`,
            key: key,
            value: ''
        })));
    }, [prompt.userPrompt]);


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
        
        if (!selectedModel) {
             toast({
                variant: "destructive",
                title: "未选择模型",
                description: "请先从下拉框中选择一个模型进行测试。",
            });
            setIsGenerating(false);
            return;
        }

        try {
            const varsAsObject = variables.reduce((acc, v) => {
                if (v.key) acc[v.key] = v.value;
                return acc;
            }, {} as Record<string, string>);

            const result = await executePrompt({
                modelId: selectedModel,
                systemPrompt: prompt.systemPrompt,
                userPrompt: prompt.userPrompt,
                variables: varsAsObject,
                temperature,
            });
            
            setTestResult(result.response);
            toast({
                title: "生成成功",
                description: "模型已成功返回结果。",
            });
        } catch (error: any) {
            console.error("Error executing prompt flow:", error);
            toast({
                variant: "destructive",
                title: "生成失败",
                description: error.message || "调用 AI 流程时发生未知错误。",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <TestTube2 className="h-6 w-6 text-accent"/>
                        配置与测试
                    </CardTitle>
                    <CardDescription>
                        选择一个已对接的模型，调整参数，并使用测试变量来验证您的提示词效果。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="model-select">模型选择</Label>
                        <Select onValueChange={setSelectedModel} value={selectedModel} disabled={isLoadingModels}>
                            <SelectTrigger id="model-select">
                                <SelectValue placeholder={isLoadingModels ? "正在加载模型..." : "选择一个模型"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>已对接模型</SelectLabel>
                                    {models.map(model => (
                                        <SelectItem key={model.id} value={model.id}>
                                            <span className="flex items-center gap-2">
                                                <Bot className="h-4 w-4" />
                                                {model.modelName} ({model.provider})
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="temperature" className="flex justify-between"><span>Temperature</span><span>{temperature}</span></Label>
                        <Slider id="temperature" min={0} max={1} step={0.1} value={[temperature]} onValueChange={([val]) => setTemperature(val)} />
                    </div>
                    <div className="space-y-2">
                        <Label>测试变量</Label>
                        {variables.map((variable) => (
                            <div key={variable.id} className="flex items-center gap-2">
                                <Input disabled className="w-1/3 font-mono text-xs" value={variable.key} />
                                <Input placeholder={`Value for ${variable.key}`} value={variable.value} onChange={e => handleVariableChange(variable.id, 'value', e.target.value)} />
                            </div>
                        ))}
                        {variables.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">此提示词没有可替换的变量。</p>}
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleTestPrompt} disabled={isGenerating || isLoadingModels}>
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
                    <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto relative bg-secondary/30 rounded-lg p-3 min-h-[100px]">
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {testResult ? (
                            <p className="whitespace-pre-wrap">{testResult}</p>
                        ) : (
                            !isGenerating && <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                <p>点击“生成”按钮以查看模型输出。</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
