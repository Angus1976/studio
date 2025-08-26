
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { LoaderCircle, Save, Sparkles, Bot } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getExpertDomains } from '@/ai/flows/admin-management-flows';
import type { ExpertDomain } from '@/lib/data-types';
import { useToast } from '@/hooks/use-toast';

export type PromptData = {
    id: string | null;
    name: string;
    expertId: string;
    systemPrompt: string;
    userPrompt: string;
    context: string;
    negativePrompt: string;
};

type PromptEditorProps = {
    prompt: PromptData;
    onPromptChange: (prompt: PromptData) => void;
    onSave: (prompt: PromptData, metadata?: any) => void;
    isSaving: boolean;
};

export function PromptEditor({ prompt, onPromptChange, onSave, isSaving }: PromptEditorProps) {
    const { toast } = useToast();
    const [expertDomains, setExpertDomains] = useState<ExpertDomain[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);

    useEffect(() => {
        async function fetchDomains() {
            try {
                const domains = await getExpertDomains();
                setExpertDomains(domains);
            } catch (error) {
                console.error("Failed to fetch expert domains:", error);
                toast({
                    title: "加载专家领域失败",
                    description: "无法从数据库获取列表。",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingDomains(false);
            }
        }
        fetchDomains();
    }, [toast]);
    
    const handleChange = (field: keyof PromptData, value: string) => {
        onPromptChange({ ...prompt, [field]: value });
    };

    return (
        <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                   <Sparkles className="h-6 w-6 text-accent" />
                   结构化提示词编辑器
                </CardTitle>
                <CardDescription>
                    在此设计和编排您的提示词。在用户指令中使用 <code className="bg-muted px-1 py-0.5 rounded text-muted-foreground">{`{{variable}}`}</code> 语法来定义可替换的变量。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto p-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="prompt-name">提示词名称</Label>
                        <Input id="prompt-name" value={prompt.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="expert-id">专家领域</Label>
                         <Select onValueChange={(value) => handleChange('expertId', value)} value={prompt.expertId} disabled={isLoadingDomains}>
                            <SelectTrigger id="expert-id">
                                <SelectValue placeholder={isLoadingDomains ? "正在加载..." : "选择一个专家领域..."} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>专家领域</SelectLabel>
                                    {expertDomains.map(domain => (
                                        <SelectItem key={domain.id} value={domain.id}>
                                            <span className="flex items-center gap-2"><Bot className="h-4 w-4" />{domain.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
               </div>
               <div className="grid gap-4">
                    <div>
                        <Label htmlFor="system-prompt">系统提示 (System)</Label>
                        <Textarea id="system-prompt" placeholder="例如：你是一个专业的翻译家..." value={prompt.systemPrompt} onChange={(e) => handleChange('systemPrompt', e.target.value)} className="h-24" />
                    </div>
                     <div>
                        <Label htmlFor="user-prompt">用户指令 (User)</Label>
                        <Textarea id="user-prompt" placeholder="例如：将下面的文本翻译成 {{language}}: '{{text}}'" value={prompt.userPrompt} onChange={(e) => handleChange('userPrompt', e.target.value)} className="h-28" />
                    </div>
               </div>
               <div className="grid gap-4">
                    <div>
                        <Label htmlFor="context">示例/上下文 (Context)</Label>
                        <Textarea id="context" placeholder="提供一些一次性或少样本示例..." value={prompt.context} onChange={(e) => handleChange('context', e.target.value)} className="h-24" />
                    </div>
                     <div>
                        <Label htmlFor="negative-prompt">反向提示 (Negative)</Label>
                        <Textarea id="negative-prompt" placeholder="描述不希望在输出中看到的内容..." value={prompt.negativePrompt} onChange={(e) => handleChange('negativePrompt', e.target.value)} className="h-24" />
                    </div>
               </div>
            </CardContent>
             <CardFooter>
                <Button className="w-full" onClick={() => onSave(prompt)} disabled={isSaving || isLoadingDomains}>
                    {isSaving ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    保存到库
                </Button>
            </CardFooter>
        </Card>
    );
}

    