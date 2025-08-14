
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, ArrowRight } from 'lucide-react';
import { analyzeOrgStructure, AnalyzeOrgStructureOutput } from '@/ai/flows/analyze-org-structure';

export function OrganizationChart() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeOrgStructureOutput | null>(null);
    const [orgInfo, setOrgInfo] = useState('');
    
    const handleAnalyze = async () => {
        if (!orgInfo.trim()) {
            toast({
                title: '信息不足',
                description: '请输入您的企业组织相关信息以供AI分析。',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeOrgStructure({ orgInfo });
            setAnalysisResult(result);
            toast({
                title: '分析完成',
                description: 'AI已完成对您的组织结构的分析。',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: '分析失败',
                description: 'AI分析时发生错误，请稍后重试。',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI 组织分析与流程优化</CardTitle>
                <CardDescription>
                    输入您企业的组织结构、决策流程、管理规则等信息。AI将分析这些信息，识别关键决策点、潜在瓶颈，并提供优化建议，以提升人事和经营管理效率。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="org-info" className="text-base font-medium">企业组织信息</Label>
                    <Textarea 
                        id="org-info"
                        rows={12}
                        placeholder="例如：我司实行部门负责制，重大决策需由总经办审批。人事招聘流程为：部门申请->HR筛选->部门面试->总监复试..."
                        value={orgInfo}
                        onChange={(e) => setOrgInfo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        您可以粘贴内部的规章制度、流程图描述或任何有助于AI理解您公司运作方式的文本。
                    </p>
                </div>
                <Button onClick={handleAnalyze} disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            正在分析...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            开始 AI 分析
                        </>
                    )}
                </Button>
            </CardContent>
            {analysisResult && (
                 <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                    <h3 className="text-xl font-semibold flex items-center"><ArrowRight className="mr-2 text-accent"/>分析结果</h3>
                    <div className="space-y-6 text-sm w-full">
                        <div>
                            <h4 className="font-semibold text-base mb-2">关键决策点</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.decisionPoints}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-base mb-2">潜在瓶颈</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.potentialBottlenecks}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-base mb-2">改进建议</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">{analysisResult.improvementSuggestions}</p>
                        </div>
                    </div>
                 </CardFooter>
            )}
        </Card>
    );
}
