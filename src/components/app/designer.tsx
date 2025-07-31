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
import { PlusCircle, UploadCloud, Library, Bot } from 'lucide-react';

const sampleScenarios = [
    { 
        id: 'recruitment-01', 
        title: '智能招聘助理', 
        description: '自动筛选简历、进行初步评估并安排面试。', 
        industry: '人力资源', 
        task: '招聘' 
    },
    { 
        id: 'support-01', 
        title: '客户支持机器人', 
        description: '7x24小时回答常见问题，并能将复杂问题转给人工座席。', 
        industry: '客户服务', 
        task: '支持' 
    },
    { 
        id: 'marketing-01', 
        title: '社交媒体内容生成', 
        description: '根据产品信息和市场趋势，自动生成吸引人的社交媒体帖子。', 
        industry: '市场营销', 
        task: '内容创作' 
    },
];


export function Designer() {
  const [scenarios, setScenarios] = useState(sampleScenarios);
  const [newScenario, setNewScenario] = useState({ title: '', description: '', industry: '', task: '' });
  const { toast } = useToast();

  const handlePublish = () => {
    toast({
      title: "场景已发布",
      description: "新的 AI 数字员工能力已成功添加到库中。",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-screen-2xl mx-auto">
      {/* Left Column: Library */}
      <div className="lg:col-span-8 h-full">
        <Card className="h-full flex flex-col">
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
                     <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 cursor-pointer">
                        <PlusCircle className="h-8 w-8" />
                    </div>
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Designer */}
      <div className="lg:col-span-4 h-full">
         <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="h-6 w-6 text-accent"/>
                    数字员工设计器
                </CardTitle>
                <CardDescription>
                    在这里创建和配置新的 AI 数字员工能力场景。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="scenario-title">能力标题</Label>
                        <Input id="scenario-title" placeholder="例如：智能招聘助理" />
                    </div>
                    <div>
                        <Label htmlFor="scenario-desc">能力描述</Label>
                        <Textarea id="scenario-desc" placeholder="简要描述此能力解决了什么问题..." />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="scenario-industry">适用行业</Label>
                            <Input id="scenario-industry" placeholder="例如：人力资源" />
                        </div>
                        <div>
                            <Label htmlFor="scenario-task">核心任务</Label>
                            <Input id="scenario-task" placeholder="例如：招聘" />
                        </div>
                    </div>
                    <div>
                         <Label htmlFor="scenario-prompt">核心提示词 (Prompt)</Label>
                         <Textarea id="scenario-prompt" placeholder="定义数字员工的核心指令..." rows={5}/>
                    </div>
                </div>

                <div className="mt-auto">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePublish}>
                        <UploadCloud className="mr-2" />
                        发布到库
                    </Button>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
