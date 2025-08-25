
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Sparkles, BrainCircuit, Zap as Apply } from 'lucide-react';
import { analyzePromptMetadata } from '@/ai/flows/analyze-prompt-metadata';
import type { PromptData } from './prompt-editor';
import type { AnalyzePromptMetadataOutput } from '@/lib/data-types';


type MetadataAnalyzerProps = {
    prompt: PromptData;
    onApply: (metadata: AnalyzePromptMetadataOutput) => void;
};


export function MetadataAnalyzer({ prompt, onApply }: MetadataAnalyzerProps) {
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [metadata, setMetadata] = useState<AnalyzePromptMetadataOutput | null>(null);

    const handleAnalyzeMetadata = async () => {
        setIsAnalyzing(true);
        setMetadata(null);
        try {
            const result = await analyzePromptMetadata({
                systemPrompt: prompt.systemPrompt,
                userPrompt: prompt.userPrompt,
                context: prompt.context,
                negativePrompt: prompt.negativePrompt
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
    
    const handleApplyMetadata = () => {
        if (!metadata) {
            toast({ variant: 'destructive', title: '无元数据可应用', description: '请先生成元数据。'});
            return;
        }
        onApply(metadata);
        toast({ title: '元数据已应用', description: '提示词名称已根据AI建议更新。'});
    };

    return (
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
    );
}
