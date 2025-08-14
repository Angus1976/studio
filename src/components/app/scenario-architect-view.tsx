
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Scenario } from "./designer";
import { Sparkles, Save } from "lucide-react";
import { Input } from "../ui/input";

type ScenarioArchitectViewProps = {
  scenario: Scenario;
  onScenarioChange: (newScenario: Scenario) => void;
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

  const handleFieldChange = (field: keyof Scenario, value: string) => {
    onScenarioChange({ ...scenario, [field]: value });
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
          <Label htmlFor="optimized-scenario-title" className="text-base font-medium">
            优化场景标题
          </Label>
          <Input
            id="optimized-scenario-title"
            value={scenario.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="mt-2"
            placeholder="优化的工作场景标题..."
          />
        </div>
        <div>
          <Label htmlFor="optimized-scenario-desc" className="text-base font-medium">
            优化场景描述
          </Label>
          <Textarea
            id="optimized-scenario-desc"
            value={scenario.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="mt-2 min-h-[100px]"
            placeholder="优化的工作场景描述..."
          />
        </div>
        <div>
          <Label htmlFor="improvement-suggestions" className="text-base font-medium">
            核心提示词 (Prompt)
          </Label>
          <Textarea
            id="improvement-suggestions"
            value={scenario.prompt}
            onChange={(e) => handleFieldChange('prompt', e.target.value)}
            className="mt-2 min-h-[120px]"
            placeholder="改进或自定义核心提示词..."
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
