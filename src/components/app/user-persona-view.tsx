"use client";

import { useState } from 'react';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { RequirementsNavigator } from './requirements-navigator';
import { ScenarioLibraryViewer } from './scenario-library-viewer';
import { promptScenarios, Scenario } from '@/lib/prompt-scenarios';

export function UserPersonaView() {
  const [recommendedExpertId, setRecommendedExpertId] = useState<string | null>(null);
  const [recommendedScenarios, setRecommendedScenarios] = useState<Scenario[]>([]);

  const handleNavigationFinish = (expertId: string) => {
    setRecommendedExpertId(expertId);
    const filteredScenarios = promptScenarios.filter(s => s.expertId === expertId);
    setRecommendedScenarios(filteredScenarios);
  };

  return (
    <ThreeColumnLayout>
      <ThreeColumnLayout.Left className="lg:col-span-4 xl:col-span-3">
        <RequirementsNavigator onFinish={handleNavigationFinish} />
      </ThreeColumnLayout.Left>
      
      <ThreeColumnLayout.Main className="lg:col-span-8 xl:col-span-9">
        <ScenarioLibraryViewer 
            scenarios={recommendedScenarios} 
            isLoading={!recommendedExpertId}
        />
      </ThreeColumnLayout.Main>
    </ThreeColumnLayout>
  );
}
