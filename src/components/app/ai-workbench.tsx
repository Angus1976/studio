
"use client";

import { useState, useEffect } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { RequirementsNavigator } from './requirements-navigator';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { ScenarioArchitectView } from './scenario-architect-view';
import { UserActionPanel } from './user-action-panel';
import { useToast } from '@/hooks/use-toast';
import { getPrompts } from '@/ai/flows/get-prompts-flow';
import type { Prompt } from './prompt-library';
import { TaskDispatchCenter } from './task-dispatch-center';
import { Button } from '../ui/button';
import { Lightbulb, Wand2 } from 'lucide-react';
import { Card, CardHeader } from '../ui/card';

export interface Scenario {
    id: string;
    title: string;
    description: string;
    prompt: string;
    expertId: string;
}

type WorkbenchMode = 'guide' | 'expert';

export function AIWorkbench() {
    const { toast } = useToast();
    const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
    const [recommendedScenarios, setRecommendedScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>('guide');
    
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [tuningScenario, setTuningScenario] = useState<Scenario | null>(null);
    const [expertId, setExpertId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const fetchedPrompts: Prompt[] = await getPrompts();
                const scenarios: Scenario[] = fetchedPrompts.map(p => ({
                    id: p.id,
                    title: p.name,
                    description: p.context || '未提供描述。',
                    prompt: p.userPrompt,
                    expertId: p.expertId, 
                }));
                setAllScenarios(scenarios);
            } catch (error) {
                console.error("Failed to fetch scenarios", error);
                toast({
                    variant: "destructive",
                    title: "加载场景失败",
                    description: "无法从数据库获取能力场景列表。"
                })
            } finally {
                setIsLoading(false);
            }
        }
        fetchScenarios();
    }, [toast]);
    
    useEffect(() => {
        if(expertId) {
            const filtered = allScenarios.filter(s => s.expertId === expertId);
            setRecommendedScenarios(filtered);
        } else {
            setRecommendedScenarios([]); // Or show all as default
        }
    }, [expertId, allScenarios]);


    const handleNavigationFinish = (finishedExpertId: string) => {
        setExpertId(finishedExpertId);
        toast({
            title: "需求分析完成!",
            description: "已为您筛选出最匹配的能力场景。"
        });
    };

    const handleSelectScenario = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setTuningScenario(null); // Close tuning view if open
        toast({ title: `已选用场景: ${scenario.title}`, description: "您可以在右侧面板进行测试。" });
    };

    const handleTuneScenario = (scenario: Scenario) => {
        setTuningScenario(scenario);
        setSelectedScenario(null); // Deselect from main panel
    };

    const handleSaveTunedScenario = (tunedScenario: Scenario) => {
        setTuningScenario(null);
        setSelectedScenario(tunedScenario);
        toast({ title: `已保存自定义场景: ${tunedScenario.title}`, description: "您现在可以测试这个微调后的版本。" });
    };

    const handleCancelTuning = () => {
        setTuningScenario(null);
    };
    
    const LeftPanel = () => {
        if (workbenchMode === 'expert') {
            return <TaskDispatchCenter />;
        }
        return <RequirementsNavigator onFinish={handleNavigationFinish} />;
    };
    
    const ToggleButton = () => {
        const isGuide = workbenchMode === 'guide';
        const text = isGuide ? "切换到专家模式" : "切换到引导模式";
        const Icon = isGuide ? Wand2 : Lightbulb;
        
        return (
            <Button variant="ghost" size="sm" onClick={() => setWorkbenchMode(isGuide ? 'expert' : 'guide')} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {text}
            </Button>
        )
    }


  return (
    <ThreeColumnLayout>
        <ThreeColumnLayout.Left>
            <Card className="shadow-none border-none bg-transparent">
                <CardHeader className="p-0 mb-4">
                     <ToggleButton />
                </CardHeader>
                <LeftPanel />
            </Card>
        </ThreeColumnLayout.Left>
        
        {workbenchMode === 'guide' && (
            <>
                <ThreeColumnLayout.Main>
                    <div className="h-full flex flex-col gap-6">
                        <ScenarioLibraryViewer
                            scenarios={recommendedScenarios}
                            isLoading={isLoading && !expertId}
                            onSelect={handleSelectScenario}
                            onTune={handleTuneScenario}
                        />
                        {tuningScenario && (
                            <ScenarioArchitectView
                                scenario={tuningScenario}
                                onSave={handleSaveTunedScenario}
                                onCancel={handleCancelTuning}
                            />
                        )}
                    </div>
                </ThreeColumnLayout.Main>
                <ThreeColumnLayout.Right>
                     <UserActionPanel scenario={selectedScenario} />
                </ThreeColumnLayout.Right>
            </>
        )}
        
        {workbenchMode === 'expert' && (
             <div className="lg:col-span-9 h-full flex flex-col gap-6">
                <Card className="h-full flex items-center justify-center text-center">
                   <p className="text-muted-foreground">专家模式的任务历史和结果区域将在此处显示。</p>
                </Card>
             </div>
        )}

    </ThreeColumnLayout>
  );
}
