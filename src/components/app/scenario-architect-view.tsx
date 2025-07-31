
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { AIScenarioArchitectOutput } from "@/ai/flows/ai-scenario-architect";
import { Sparkles, Save } from "lucide-react";

type ScenarioArchitectViewProps = {
  scenario: AIScenarioArchitectOutput;
  onScenarioChange: (newScenario: AIScenarioArchitectOutput) => void;
};

export function ScenarioArchitectView({ scenario, onScenarioChange }: ScenarioArchitectViewProps) {
  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, this would save to a backend.
    toast({
      title: "自定义已保存！",
      description: "您对 AI 场景的更改已保存。",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          AI 场景架构师
        </CardTitle>
        <CardDescription>
          微调 AI 生成的场景以完全满足您的需求。您也可以直接编辑下面的文本来自定义。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="optimized-scenario" className="text-base font-medium">
            优化场景
          </Label>
          <Textarea
            id="optimized-scenario"
            value={scenario.optimizedScenario}
            onChange={(e) => onScenarioChange({ ...scenario, optimizedScenario: e.target.value })}
            className="mt-2 min-h-[120px]"
            placeholder="优化的工作场景..."
          />
        </div>
        <div>
          <Label htmlFor="improvement-suggestions" className="text-base font-medium">
            改进建议
          </Label>
          <Textarea
            id="improvement-suggestions"
            value={scenario.improvementSuggestions}
            onChange={(e) => onScenarioChange({ ...scenario, improvementSuggestions: e.target.value })}
            className="mt-2 min-h-[100px]"
            placeholder="改进建议..."
          />
        </div>
        <div className="flex justify-end">
            <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存自定义
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
