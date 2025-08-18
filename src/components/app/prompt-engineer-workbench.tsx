
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getPrompts, GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { PromptLibrary, Prompt } from './prompt-library';
import { PromptEditor, PromptData } from './prompt-editor';
import { PromptTestbed } from './prompt-testbed';
import { MetadataAnalyzer } from './metadata-analyzer';
import { savePrompt } from '@/ai/flows/save-prompt-flow';

export function PromptEngineerWorkbench() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Active prompt state being edited
    const [activePrompt, setActivePrompt] = useState<PromptData>({
        id: null,
        name: '新的提示词',
        scope: '通用',
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Translate the following text to {{language}}: "{{text}}"',
        context: '',
        negativePrompt: '',
    });
    
    // Prompt Library State
    const [prompts, setPrompts] = useState<GetPromptsOutput>([]);
    const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);

    // Fetches all prompts from the library
    const fetchPrompts = async () => {
        setIsLoadingPrompts(true);
        try {
            const fetchedPrompts = await getPrompts();
            setPrompts(fetchedPrompts);
        } catch (error) {
            console.error("Error fetching prompts:", error);
            toast({
                variant: "destructive",
                title: "加载提示词库失败",
                description: "无法从数据库获取提示词列表。",
            });
        } finally {
            setIsLoadingPrompts(false);
        }
    };

    // Initial fetch of prompts
    useEffect(() => {
        fetchPrompts();
    }, []);

    const handleSelectPrompt = (prompt: Prompt) => {
        setActivePrompt({
            id: prompt.id,
            name: prompt.name,
            scope: prompt.scope,
            systemPrompt: prompt.systemPrompt || '',
            userPrompt: prompt.userPrompt,
            context: prompt.context || '',
            negativePrompt: prompt.negativePrompt || '',
        });
        
        toast({
            title: `提示词已加载: ${prompt.name}`,
            description: "内容已填充到编辑器中。",
        });
    };

    const handleSavePrompt = async (promptToSave: PromptData, metadata: any) => {
        setIsSaving(true);
        try {
            const result = await savePrompt({
                id: promptToSave.id || undefined,
                name: promptToSave.name,
                scope: promptToSave.scope,
                systemPrompt: promptToSave.systemPrompt,
                userPrompt: promptToSave.userPrompt,
                context: promptToSave.context,
                negativePrompt: promptToSave.negativePrompt,
                metadata: metadata ? {
                    recommendedModel: metadata.recommendedModel,
                    constraints: metadata.constraints,
                    scenario: metadata.scenario
                } : undefined
            });

            if (result.success) {
                toast({ title: result.message });
                await fetchPrompts(); // Refresh library
                if (!activePrompt.id) { // If it was a new prompt
                   setActivePrompt(prev => ({ ...prev, id: result.id }));
                }
            } else {
                 toast({ variant: "destructive", title: "保存失败", description: result.message });
            }
        } catch (error) {
            console.error("Error saving prompt:", error);
            toast({ variant: "destructive", title: "保存时发生错误", description: "无法连接到后端服务。" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ThreeColumnLayout>
            <ThreeColumnLayout.Left>
                 <PromptLibrary 
                    prompts={prompts} 
                    onSelectPrompt={handleSelectPrompt}
                    isLoading={isLoadingPrompts}
                />
            </ThreeColumnLayout.Left>
            
            <ThreeColumnLayout.Main>
                 <PromptEditor 
                    prompt={activePrompt}
                    onPromptChange={setActivePrompt}
                    onSave={handleSavePrompt}
                    isSaving={isSaving}
                 />
            </ThreeColumnLayout.Main>

            <ThreeColumnLayout.Right>
                <div className="flex flex-col gap-6 h-full">
                   <PromptTestbed prompt={activePrompt} />
                   <MetadataAnalyzer prompt={activePrompt} onApply={(metadata) => {
                       setActivePrompt(p => ({...p, name: `${metadata.scope} - ${metadata.scenario}`}));
                   }} />
                </div>
            </ThreeColumnLayout.Right>
        </ThreeColumnLayout>
    );
}
