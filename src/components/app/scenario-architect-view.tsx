"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Wrench, Save, XCircle } from 'lucide-react';
import { Scenario } from './ai-workbench';

type ScenarioArchitectViewProps = {
    scenario: Scenario;
    onSave: (tunedScenario: Scenario) => void;
    onCancel: () => void;
};

export function ScenarioArchitectView({ scenario, onSave, onCancel }: ScenarioArchitectViewProps) {
    const [tunedScenario, setTunedScenario] = useState<Scenario>(scenario);

    useEffect(() => {
        setTunedScenario(scenario);
    }, [scenario]);

    const handleChange = (field: keyof Omit<Scenario, 'id' | 'expertId'>, value: string) => {
        setTunedScenario(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Wrench className="h-6 w-6 text-accent" />
                    AI 场景架构师
                </CardTitle>
                <CardDescription>
                    在这里微调场景的标题、描述和核心提示词，以更好地满足您的个性化需求。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="scenario-title">优化场景(标题)</Label>
                        <Input 
                            id="scenario-title" 
                            value={tunedScenario.title} 
                            onChange={(e) => handleChange('title', e.target.value)} 
                        />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="scenario-desc">优化场景(描述)</Label>
                         <Input 
                            id="scenario-desc" 
                            value={tunedScenario.description} 
                            onChange={(e) => handleChange('description', e.target.value)} 
                        />
                    </div>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="scenario-prompt">改进建议(核心提示词)</Label>
                    <Textarea 
                        id="scenario-prompt" 
                        value={tunedScenario.prompt} 
                        onChange={(e) => handleChange('prompt', e.target.value)} 
                        className="h-32 font-mono text-xs"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>
                    <XCircle className="mr-2 h-4 w-4" />
                    取消
                </Button>
                <Button onClick={() => onSave(tunedScenario)}>
                    <Save className="mr-2 h-4 w-4" />
                    保存自定义
                </Button>
            </CardFooter>
        </Card>
    );
}
