

"use client";

import { useState, useEffect } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { RequirementsNavigator } from './requirements-navigator';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { ScenarioArchitectView } from './scenario-architect-view';
import { UserActionPanel } from './user-action-panel';
import { useToast } from '@/hooks/use-toast';
import { getPrompts } from '@/ai/flows/get-prompts-flow';
import { savePrompt } from '@/ai/flows/save-prompt-flow';
import type { Prompt } from '@/lib/data-types';
import { TaskDispatchCenter } from './task-dispatch-center';
import { Button } from '../ui/button';
import { Lightbulb, Wand2, Bot, BookCopy, TestTube2, AlertTriangle, Workflow } from 'lucide-react';
import { Card } from '../ui/card';
import { CollapsiblePanel, CollapsiblePanelHeader } from './layouts/collapsible-panel';

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

    const handleSaveTunedScenario = async (tunedScenario: Scenario) => {
        try {
            const result = await savePrompt({
                name: tunedScenario.title,
                expertId: tunedScenario.expertId,
                userPrompt: tunedScenario.prompt,
                context: tunedScenario.description,
                scope: "专属",
                tenantId: "mock-tenant-id-123", // Should come from user session
            });
            
            if (result.success) {
                const newScenarioWithId = { ...tunedScenario, id: result.id };
                setAllScenarios(prev => [...prev, newScenarioWithId]);
                setTuningScenario(null);
                setSelectedScenario(newScenarioWithId); // Select the newly saved scenario
                toast({ title: `已保存自定义场景: ${newScenarioWithId.title}`, description: "您现在可以测试这个新的专属场景。" });
            } else {
                toast({ variant: 'destructive', title: '保存失败', description: result.message });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: '发生错误', description: error.message });
        }
    };

    const handleCancelTuning = () => {
        setTuningScenario(null);
    };
    
    const LeftPanelContent = () => {
        if (workbenchMode === 'expert') {
            return <TaskDispatchCenter />;
        }
        return <RequirementsNavigator onFinish={handleNavigationFinish} />;
    };
    
    const LeftPanelHeader = () => (
        <CollapsiblePanelHeader>
            <span className="flex items-center gap-2">
                {workbenchMode === 'expert' ? <Workflow className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                {workbenchMode === 'expert' ? 'AI 智能工作台' : 'AI 需求导航器'}
            </span>
        </CollapsiblePanelHeader>
    );

    return (
        <div className="h-full flex flex-col">
             <div className="p-4 border-b">
                 <Button variant="outline" size="sm" onClick={() => setWorkbenchMode(workbenchMode === 'guide' ? 'expert' : 'guide')} className="flex items-center gap-2">
                    {workbenchMode === 'guide' ? <Wand2 className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                    切换到{workbenchMode === 'guide' ? "专家模式" : "引导模式"}
                </Button>
            </div>
            <div className="flex-1 p-4 md:p-6 lg:p-8 h-[calc(100%-73px)]">
                <ThreeColumnLayout autoSaveId="ai-workbench-layout">
                    <ThreeColumnLayout.Left id="left-panel" defaultSize={25} minSize={20} maxSize={40}>
                        <CollapsiblePanel id="left-panel">
                            <LeftPanelHeader />
                            <div className="p-4 h-full">
                                <LeftPanelContent />
                            </div>
                        </CollapsiblePanel>
                    </ThreeColumnLayout.Left>
                    
                    <ThreeColumnLayout.Handle withHandle />

                    {workbenchMode === 'guide' ? (
                        <>
                            <ThreeColumnLayout.Main id="main-panel" defaultSize={45} minSize={30}>
                                <CollapsiblePanel id="main-panel">
                                     <CollapsiblePanelHeader>
                                        <span className="flex items-center gap-2">
                                            <BookCopy className="h-5 w-5" /> 能力场景推荐与微调
                                        </span>
                                    </CollapsiblePanelHeader>
                                    <div className="p-4 h-full flex flex-col gap-4 overflow-y-auto">
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
                                </CollapsiblePanel>
                            </ThreeColumnLayout.Main>

                            <ThreeColumnLayout.Handle withHandle />

                            <ThreeColumnLayout.Right id="right-panel" defaultSize={30} minSize={25} maxSize={40}>
                                <CollapsiblePanel id="right-panel">
                                     <CollapsiblePanelHeader>
                                        <span className="flex items-center gap-2">
                                            <TestTube2 className="h-5 w-5" /> 操作面板
                                        </span>
                                    </CollapsiblePanelHeader>
                                    <div className="p-4 h-full overflow-y-auto">
                                        <UserActionPanel scenario={selectedScenario} />
                                    </div>
                                </CollapsiblePanel>
                            </ThreeColumnLayout.Right>
                        </>
                    ) : (
                        <ThreeColumnLayout.Main id="expert-main" defaultSize={75} minSize={30}>
                            <CollapsiblePanel id="expert-main">
                                <CollapsiblePanelHeader>
                                    <span className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" /> 任务历史与结果
                                    </span>
                                </CollapsiblePanelHeader>
                               <div className="p-4 h-full">
                                    <Card className="h-full flex items-center justify-center text-center">
                                       <p className="text-muted-foreground">专家模式的任务历史和结果区域将在此处显示。</p>
                                    </Card>
                                </div>
                            </CollapsiblePanel>
                        </ThreeColumnLayout.Main>
                    )}
                </ThreeColumnLayout>
            </div>
        </div>
    );
}
