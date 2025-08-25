
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, TestTube2, Trash2, PlusCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
// import { executePrompt } from '@/ai/flows/prompt-execution-flow';
import type { PromptData } from './prompt-editor';

type Variable = {
    id: string;
    key: string;
    value: string;
};

type PromptTestbedProps = {
    prompt: PromptData;
};

// Mock executePrompt function
const executePrompt = async (options: any): Promise<{ response: string }> => {
    console.log("Executing prompt (mocked):", options);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { response: "This is a mocked response from the AI model based on your inputs." };
};


export function PromptTestbed({ prompt }: PromptTestbedProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [temperature, setTemperature] = useState(0.7);
    const [variables, setVariables] = useState<Variable[]>([
        { id: 'var1', key: 'language', value: 'French' },
        { id: 'var2', key: 'text', value: 'Hello, world!' }
    ]);
    const [testResult, setTestResult] = useState('');

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
                systemPrompt: prompt.systemPrompt,
                userPrompt: prompt.userPrompt,
                context: prompt.context,
                negativePrompt: prompt.negativePrompt,
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

    return (
        <>
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
                        {variables.map((variable) => (
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
                    <div className="prose prose-sm dark:prose-invert max-w-none h-full overflow-y-auto relative bg-secondary/30 rounded-lg p-2 min-h-[100px]">
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
