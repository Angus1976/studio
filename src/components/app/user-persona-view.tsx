"use client";

import { useState } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { RequirementsNavigator } from './requirements-navigator';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { promptScenarios, Scenario } from '@/lib/prompt-scenarios';
import { ScenarioArchitectView } from './scenario-architect-view';
import { UserActionPanel } from './user-action-panel';
import { useToast } from '@/hooks/use-toast';

export function UserPersonaView() {
  const { toast } = useToast();
  const [recommendedScenarios, setRecommendedScenarios] = useState<Scenario[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);


  const handleNavigationFinish = (expertId: string) => {
    const filteredScenarios = promptScenarios.filter(s => s.expertId === expertId);
    setRecommendedScenarios(filteredScenarios);
    if(filteredScenarios.length > 0) {
        setSelectedScenario(filteredScenarios[0]);
    }
    setShowRecommendations(true);
  };
  
  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setEditingScenario(null); // Close architect view if it was open
    toast({
        title: "场景已选用",
        description: `“${scenario.title}” 已加载到右侧操作面板。`,
    });
  }

  const handleStartTuneScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setSelectedScenario(scenario); // Also select it for testing
     toast({
        title: "开始微调场景",
        description: `“${scenario.title}” 已加载到下方的场景架构师视图。`,
    });
  }
  
  const handleSaveTuneScenario = (tunedScenario: Scenario) => {
    // In a real app, this would save to a user's custom scenarios
    // For now, we'll just update the state and give feedback
    setEditingScenario(null);
    setSelectedScenario(tunedScenario); // The tuned scenario is now the selected one
    toast({
        title: "自定义场景已保存",
        description: `您的修改已被保存并加载到操作面板。`,
    });
  }

  return (
    <ThreeColumnLayout>
      <ThreeColumnLayout.Left className="lg:col-span-4 xl:col-span-3">
        <RequirementsNavigator onFinish={handleNavigationFinish} />
      </ThreeColumnLayout.Left>
      
      <ThreeColumnLayout.Main className="lg:col-span-5 xl:col-span-6">
        <div className="flex flex-col gap-6 h-full">
            <ScenarioLibraryViewer 
                scenarios={recommendedScenarios} 
                isLoading={!showRecommendations}
                onSelect={handleSelectScenario}
                onTune={handleStartTuneScenario}
            />
            {editingScenario && (
                <ScenarioArchitectView 
                    scenario={editingScenario}
                    onSave={handleSaveTuneScenario}
                    onCancel={() => setEditingScenario(null)}
                />
            )}
        </div>
      </ThreeColumnLayout.Main>

      <ThreeColumnLayout.Right className="lg:col-span-3 xl:col-span-3">
         <UserActionPanel scenario={selectedScenario} />
      </ThreeColumnLayout.Right>
    </ThreeColumnLayout>
  );
}
