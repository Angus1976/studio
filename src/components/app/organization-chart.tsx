
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Wand2, ArrowRight, User, Users, Briefcase } from 'lucide-react';
import { analyzeOrgStructure, AnalyzeOrgStructureOutput } from '@/ai/flows/analyze-org-structure';
import { ScrollArea } from '../ui/scroll-area';

type OrgNode = {
  name: string;
  title: string;
  icon: React.ElementType;
  children?: OrgNode[];
};

const orgData: OrgNode = {
  name: 'Tech Innovators Inc.',
  title: 'CEO',
  icon: User,
  children: [
    {
      name: '研发部',
      title: 'CTO',
      icon: Users,
      children: [
        { name: '前端团队', title: '负责人', icon: Briefcase },
        { name: '后端团队', title: '负责人', icon: Briefcase },
      ],
    },
    {
      name: '市场部',
      title: 'CMO',
      icon: Users,
      children: [
        { name: '营销团队', title: '负责人', icon: Briefcase },
        { name: '公关团队', title: '负责人', icon: Briefcase },
      ],
    },
     {
      name: '人事部',
      title: 'HRD',
      icon: Users,
      children: [
        { name: '招聘团队', title: '负责人', icon: Briefcase },
      ],
    },
  ],
};

const OrgChartNode = ({ node }: { node: OrgNode }) => (
  <div className="flex flex-col items-center">
    <Card className="min-w-40 text-center shadow">
      <CardContent className="p-3">
        <node.icon className="mx-auto h-6 w-6 text-accent mb-2" />
        <p className="font-semibold text-sm">{node.name}</p>
        <p className="text-xs text-muted-foreground">{node.title}</p>
      </CardContent>
    </Card>
    {node.children && (
      <div className="flex justify-center gap-6 pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-px bg-border" />
        {node.children.map((child, index) => (
          <div key={index} className="flex flex-col items-center relative">
            <div className="absolute -top-8 left-0 right-0 h-px bg-border" />
            <div className="absolute top-[-2rem] left-1/2 h-8 w-px bg-border" />
            <OrgChartNode node={child} />
          </div>
        ))}
      </div>
    )}
  </div>
);

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>组织架构可视化</CardTitle>
                        <CardDescription>这是一个示例组织架构图。请在右侧输入您企业的真实信息以进行分析。</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ScrollArea className="w-full h-[60vh] p-4 border rounded-lg bg-background/50 flex items-center justify-center">
                            支持企业方导入和自主编排组织架构
                       </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>AI 组织分析</CardTitle>
                        <CardDescription>输入关于您企业结构、决策流程、管理规则等信息，AI将为您提供分析和建议。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="org-info">企业组织信息</Label>
                            <Textarea 
                                id="org-info"
                                rows={10}
                                placeholder="例如：我司实行部门负责制，重大决策需由总经办审批。人事招聘流程为：部门申请->HR筛选->部门面试->总监复试..."
                                value={orgInfo}
                                onChange={(e) => setOrgInfo(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
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
                            <h3 className="text-lg font-semibold flex items-center"><ArrowRight className="mr-2"/>分析结果</h3>
                            <div className="space-y-4 text-sm w-full">
                                <div>
                                    <h4 className="font-semibold mb-1">关键决策点</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.decisionPoints}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">潜在瓶颈</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.potentialBottlenecks}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">改进建议</h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.improvementSuggestions}</p>
                                </div>
                            </div>
                         </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
