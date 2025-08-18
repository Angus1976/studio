
"use client";

import { useState, useEffect } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { TaskDispatchCenter } from './task-dispatch-center';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { ScenarioArchitectView } from './scenario-architect-view';
import { UserActionPanel } from './user-action-panel';
import { useToast } from '@/hooks/use-toast';
import { getPrompts, GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import type { Prompt } from './prompt-library';


export function UserPersonaView() {
    const { toast } = useToast();
    const [scenarios, setScenarios] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState<Prompt | null>(null);
    const [tuningScenario, setTuningScenario] = useState<Prompt | null>(null);

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const fetchedPrompts = await getPrompts();
                setScenarios(fetchedPrompts);
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


    const handleSelectScenario = (scenario: Prompt) => {
        setSelectedScenario(scenario);
        setTuningScenario(null); // Close tuning view if open
        toast({ title: `已选用场景: ${scenario.name}`, description: "您可以在右侧面板进行测试。" });
    };

    const handleTuneScenario = (scenario: Prompt) => {
        setTuningScenario(scenario);
        setSelectedScenario(null); // Deselect from main panel
    };

    const handleSaveTunedScenario = (tunedScenario: Prompt) => {
        // Here you would typically save the tuned scenario to the user's private library.
        // For this demo, we'll just select it for testing.
        setTuningScenario(null);
        setSelectedScenario(tunedScenario);
        toast({ title: `已保存自定义场景: ${tunedScenario.name}`, description: "您现在可以测试这个微调后的版本。" });
    };

    const handleCancelTuning = () => {
        setTuningScenario(null);
    };

  // This view is now simplified to directly use the TaskDispatchCenter,
  // representing the evolution of the user workbench as per the PRD.
  // The previous components for requirements navigation and scenario browsing
  // can be considered as a separate feature or integrated differently later.
  return (
    <ThreeColumnLayout>
        <ThreeColumnLayout.Left className="lg:col-span-4">
             {/* This part can be reinstated if the AI Navigator flow is needed */}
             {/* <RequirementsNavigator onFinish={handleFinishNavigation} /> */}
            <TaskDispatchCenter />
        </ThreeColumnLayout.Left>
        <ThreeColumnLayout.Main className="lg:col-span-8">
            <div className="h-full flex flex-col gap-6">
                <ScenarioLibraryViewer
                    scenarios={scenarios.map(p => ({...p, expertId: 'recruitment-expert', prompt: p.userPrompt, title: p.name, description: p.context || ''}))} // Adapt prompt to scenario type
                    isLoading={isLoading}
                    onSelect={handleSelectScenario}
                    onTune={handleTuneScenario}
                />
                {tuningScenario && (
                    <ScenarioArchitectView
                        scenario={{...tuningScenario, expertId: 'recruitment-expert', prompt: tuningScenario.userPrompt, title: tuningScenario.name, description: tuningScenario.context || ''}}
                        onSave={handleSaveTunedScenario}
                        onCancel={handleCancelTuning}
                    />
                )}
                 <div className="mt-auto">
                    <UserActionPanel scenario={selectedScenario ? {...selectedScenario, title: selectedScenario.name, description: selectedScenario.context || '', expertId: 'expert', prompt: selectedScenario.userPrompt} : null} />
                </div>
            </div>
        </ThreeColumnLayout.Main>
    </ThreeColumnLayout>
  );
}
