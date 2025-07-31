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
      title: "Customizations Saved!",
      description: "Your changes to the AI scenario have been saved.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          Digital Employee Customizer
        </CardTitle>
        <CardDescription>
          Fine-tune the AI-generated scenario to perfectly match your needs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="optimized-scenario" className="text-base font-medium">
            Optimized Scenario
          </Label>
          <Textarea
            id="optimized-scenario"
            value={scenario.optimizedScenario}
            onChange={(e) => onScenarioChange({ ...scenario, optimizedScenario: e.target.value })}
            className="mt-2 min-h-[120px]"
            placeholder="Optimized work scenario..."
          />
        </div>
        <div>
          <Label htmlFor="improvement-suggestions" className="text-base font-medium">
            Improvement Suggestions
          </Label>
          <Textarea
            id="improvement-suggestions"
            value={scenario.improvementSuggestions}
            onChange={(e) => onScenarioChange({ ...scenario, improvementSuggestions: e.target.value })}
            className="mt-2 min-h-[100px]"
            placeholder="Suggestions for improvement..."
          />
        </div>
        <div className="flex justify-end">
            <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Customizations
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
