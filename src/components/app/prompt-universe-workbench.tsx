
"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getPrompts, type GetPromptsOutput } from '@/ai/flows/get-prompts-flow';
import { ThreeColumnLayout } from './layouts/three-column-layout';
import { CollapsiblePanel, CollapsiblePanelHeader } from './layouts/collapsible-panel';
import { PromptLibrary } from './prompt-library';
import { PromptEditor, PromptData } from './prompt-editor';
import { PromptTestbed } from './prompt-testbed';
import { MetadataAnalyzer } from './metadata-analyzer';
import { savePrompt } from '@/ai/flows/save-prompt-flow';
import { deletePrompt } from '@/ai/flows/delete-prompt-flow';
import { analyzePromptMetadata, type AnalyzePromptMetadataOutput } from '@/ai/flows/analyze-prompt-metadata';
import type { Prompt } from '@/lib/data-types';
import { BookCopy, Sparkles, TestTube2 } from 'lucide-react';


export function PromptUniverseWorkbench({ tenantId }: { tenantId: string | null }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Active prompt state being edited
    const [activePrompt, setActivePrompt] = useState<PromptData>({
        id: null,
        name: '新的提示词',
        expertId: 'recruitment-expert',
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Translate the following text to {{language}}: "{{text}}"',
        context: '',
        negativePrompt: '',
        scope: '专属', // Default to tenant-specific
        tenantId: tenantId || undefined,
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
            expertId: prompt.expertId || 'recruitment-expert',
            systemPrompt: prompt.systemPrompt || '',
            userPrompt: prompt.userPrompt,
            context: prompt.context || '',
            negativePrompt: prompt.negativePrompt || '',
            scope: prompt.scope || '专属',
            tenantId: prompt.tenantId
        });
        
        toast({
            title: `提示词已加载: ${prompt.name}`,
            description: "内容已填充到编辑器中。",
        });
    };

    const handleSavePrompt = async (promptToSave: PromptData, saveAs: 'universal' | 'tenant') => {
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
                scope: saveAs === 'universal' ? '通用' : '专属',
                tenantId: saveAs === 'tenant' ? tenantId || undefined : undefined
            });

            if (result.success) {
                toast({ title: result.message });
                await fetchPrompts(); // Refresh library
                if (!activePrompt.id) { // If it was a new prompt
                   // update the active prompt with the new ID
                   setActivePrompt(prev => ({ ...prev, id: result.id }));
                }
            } else {
                 toast({ variant: "destructive", title: "保存失败", description: result.message });
            }
        } catch (error: any) {
            console.error("Error saving prompt:", error);
            toast({ variant: "destructive", title: "保存时发生错误", description: error.message || "无法连接到后端服务。" });
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
                        id: null, name: '新的提示词', expertId: 'recruitment-expert',
                        systemPrompt: '', userPrompt: '', context: '', negativePrompt: '',
                        scope: '专属', tenantId: tenantId || undefined
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
        // A smarter way to name could be implemented, but this is a good starting point.
        // e.g. "营销文案 - 为新产品生成社交媒体帖子"
        const newName = `${metadata.scope} - ${metadata.scenario.split('\n')[0]}`;
        setActivePrompt(p => ({...p, name: newName}));
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 h-full">
            <ThreeColumnLayout autoSaveId="prompt-universe-workbench-layout">
                <ThreeColumnLayout.Left id="prompt-library" defaultSize={25} minSize={20} maxSize={30}>
                    <CollapsiblePanel id="prompt-library">
                        <CollapsiblePanelHeader>
                            <span className="flex items-center gap-2">
                                <BookCopy className="h-5 w-5" /> 提示词库
                            </span>
                        </CollapsiblePanelHeader>
                        <div className="p-4 h-full flex flex-col">
                            <PromptLibrary 
                                prompts={prompts} 
                                onSelectPrompt={handleSelectPrompt}
                                isLoading={isLoadingPrompts}
                                onDeletePrompt={handleDeletePrompt}
                            />
                        </div>
                    </CollapsiblePanel>
                </ThreeColumnLayout.Left>
                
                <ThreeColumnLayout.Handle withHandle />

                <ThreeColumnLayout.Main id="prompt-editor" defaultSize={45} minSize={30}>
                    <CollapsiblePanel id="prompt-editor">
                         <CollapsiblePanelHeader>
                             <span className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> 结构化提示词编辑器
                            </span>
                        </CollapsiblePanelHeader>
                        <div className="p-4 h-full">
                            <PromptEditor 
                                prompt={activePrompt}
                                onPromptChange={setActivePrompt}
                                onSave={handleSavePrompt}
                                isSaving={isSaving}
                            />
                        </div>
                    </CollapsiblePanel>
                </ThreeColumnLayout.Main>

                <ThreeColumnLayout.Handle withHandle />

                <ThreeColumnLayout.Right id="prompt-tools" defaultSize={30} minSize={20} maxSize={40}>
                    <CollapsiblePanel id="prompt-tools">
                         <CollapsiblePanelHeader>
                             <span className="flex items-center gap-2">
                                <TestTube2 className="h-5 w-5" /> 测试与分析
                            </span>
                        </CollapsiblePanelHeader>
                        <div className="p-4 h-full flex flex-col gap-4 overflow-y-auto">
                        <PromptTestbed prompt={activePrompt} />
                        <MetadataAnalyzer prompt={activePrompt} onApply={handleApplyMetadata} />
                        </div>
                    </CollapsiblePanel>
                </ThreeColumnLayout.Right>
            </ThreeColumnLayout>
        </div>
    );
}
