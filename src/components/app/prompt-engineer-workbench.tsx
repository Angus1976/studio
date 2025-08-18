
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getPrompts, type GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { PromptLibrary } from './prompt-library';
import { PromptEditor, PromptData } from './prompt-editor';
import { PromptTestbed } from './prompt-testbed';
import { MetadataAnalyzer } from './metadata-analyzer';
import { savePrompt } from '@/ai/flows/save-prompt-flow';
import { deletePrompt } from '@/ai/flows/delete-prompt-flow';
import { analyzePromptMetadata, type AnalyzePromptMetadataOutput } from '@/ai/flows/analyze-prompt-metadata';
import type { Prompt } from '@/lib/data-types';

export function PromptEngineerWorkbench() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Active prompt state being edited
    const [activePrompt, setActivePrompt] = useState<PromptData>({
        id: null,
        name: '新的提示词',
        expertId: 'general-expert',
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectPrompt = (prompt: Prompt) => {
        setActivePrompt({
            id: prompt.id,
            name: prompt.name,
            expertId: prompt.expertId,
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

    const handleSavePrompt = async (promptToSave: PromptData) => {
        setIsSaving(true);
        try {
            // Step 1: Always analyze metadata first
            toast({ title: "正在分析元数据...", description: "AI 正在为您的提示词生成元数据。" });
            const metadata = await analyzePromptMetadata({
                systemPrompt: promptToSave.systemPrompt,
                userPrompt: promptToSave.userPrompt,
                context: promptToSave.context,
                negativePrompt: promptToSave.negativePrompt,
            });

            // Step 2: Save the prompt with the generated metadata
            toast({ title: "正在保存提示词...", description: "元数据分析完成，正在保存..." });
            const result = await savePrompt({
                id: promptToSave.id || undefined,
                name: promptToSave.name,
                expertId: promptToSave.expertId,
                systemPrompt: promptToSave.systemPrompt,
                userPrompt: promptToSave.userPrompt,
                context: promptToSave.context,
                negativePrompt: promptToSave.negativePrompt,
                metadata: metadata,
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
    
    const handleDeletePrompt = async (promptId: string) => {
        try {
            const result = await deletePrompt({ id: promptId });
            if (result.success) {
                toast({ title: "提示词已删除" });
                await fetchPrompts(); // Refresh the list
                 if(activePrompt.id === promptId) {
                    // Clear the editor if the active prompt was deleted
                    setActivePrompt({
                        id: null, name: '新的提示词', expertId: 'general-expert',
                        systemPrompt: '', userPrompt: '', context: '', negativePrompt: ''
                    });
                }
            } else {
                toast({ variant: "destructive", title: "删除失败", description: result.message });
            }
        } catch (error) {
            console.error("Error deleting prompt:", error);
            toast({ variant: "destructive", title: "删除时发生错误" });
        }
    }

    const handleApplyMetadata = (metadata: AnalyzePromptMetadataOutput) => {
        setActivePrompt(p => ({...p, name: `${metadata.scope} - ${metadata.scenario}`}));
    };

    return (
        <ThreeColumnLayout>
            <ThreeColumnLayout.Left>
                 <PromptLibrary 
                    prompts={prompts} 
                    onSelectPrompt={handleSelectPrompt}
                    isLoading={isLoadingPrompts}
                    onDeletePrompt={handleDeletePrompt}
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
                   <MetadataAnalyzer prompt={activePrompt} onApply={handleApplyMetadata} />
                </div>
            </ThreeColumnLayout.Right>
        </ThreeColumnLayout>
    );
}
