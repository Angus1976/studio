
"use client";

import { useState, useEffect } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { RequirementsNavigator } from './requirements-navigator';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { ScenarioArchitectView } from './scenario-architect-view';
import { UserActionPanel } from './user-action-panel';
import { useToast } from '@/hooks/use-toast';
import { getPrompts, GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import type { Scenario } from '@/lib/prompt-scenarios';


export function AIWorkbench() {
    const { toast } = useToast();
    const [allScenarios, setAllScenarios] = useState<Scenario[]>([]);
    const [recommendedScenarios, setRecommendedScenarios] = useState<Scenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [tuningScenario, setTuningScenario] = useState<Scenario | null>(null);
    const [expertId, setExpertId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const fetchedPrompts = await getPrompts();
                const scenarios = fetchedPrompts.map(p => ({
                    id: p.id,
                    title: p.name,
                    description: p.context || '未提供描述。',
                    prompt: p.userPrompt,
                    expertId: p.scope === '专属' ? 'tenant-specific' : 'recruitment-expert', // This mapping can be improved
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

  return (
    <ThreeColumnLayout>
        <ThreeColumnLayout.Left>
             <RequirementsNavigator onFinish={handleNavigationFinish} />
        </ThreeColumnLayout.Left>
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
    </ThreeColumnLayout>
  );
}
