

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { LoaderCircle, Save, Sparkles, Bot, Settings, PlusCircle, Trash2, Globe, Building } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getExpertDomains, saveExpertDomain, deleteExpertDomain } from '@/ai/flows/admin-management-flows';
import type { ExpertDomain } from '@/lib/data-types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


export type PromptData = {
    id: string | null;
    name: string;
    expertId: string;
    systemPrompt: string;
    userPrompt: string;
    context: string;
    negativePrompt: string;
    scope: '通用' | '专属';
    tenantId?: string;
};

type PromptEditorProps = {
    prompt: PromptData;
    onPromptChange: (prompt: PromptData) => void;
    onSave: (prompt: PromptData, saveAs: 'universal' | 'tenant') => void;
    isSaving: boolean;
};

const domainFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "领域名称至少需要2个字符。" }),
  domainId: z.string().min(3, "ID至少需要3个字符。").regex(/^[a-z0-9-]+$/, "ID只能包含小写字母、数字和连字符。"),
});

function ManageDomainsDialog({ onDomainsUpdate }: { onDomainsUpdate: () => void }) {
    const { toast } = useToast();
    const [domains, setDomains] = useState<ExpertDomain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<z.infer<typeof domainFormSchema>>({
        resolver: zodResolver(domainFormSchema),
        defaultValues: { name: "", domainId: "" },
    });
    
    const fetchDomains = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedDomains = await getExpertDomains();
            setDomains(fetchedDomains);
        } catch(e: any) {
            toast({ title: "加载领域失败", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);
    
    const onSubmit = async (values: z.infer<typeof domainFormSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await saveExpertDomain(values);
            if (result.success) {
                toast({ title: result.message });
                form.reset();
                await fetchDomains();
                onDomainsUpdate(); // Notify parent to refetch
            } else {
                toast({ title: "保存失败", description: result.message, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "发生错误", description: e.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            const result = await deleteExpertDomain({ id });
            if (result.success) {
                toast({ title: result.message });
                await fetchDomains();
                onDomainsUpdate(); // Notify parent to refetch
            } else {
                toast({ title: "删除失败", description: result.message, variant: "destructive" });
            }
        } catch(e: any) {
            toast({ title: "发生错误", description: e.message, variant: "destructive" });
        }
    }
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>管理专家领域</DialogTitle>
                <DialogDescription>
                    添加、编辑或删除平台上的专家领域分类。
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">现有领域</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <LoaderCircle className="animate-spin" /> : (
                            <ul className="space-y-2">
                                {domains.map(d => (
                                    <li key={d.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                        <span>{d.name} <span className="text-muted-foreground text-xs font-mono">({d.domainId})</span></span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(d.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">添加新领域</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({field}) => (<FormItem><FormLabel>名称</FormLabel><FormControl><Input placeholder="例如: 法律专家" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={form.control} name="domainId" render={({field}) => (<FormItem><FormLabel>ID</FormLabel><FormControl><Input placeholder="e.g. legal-expert" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
                                    添加领域
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">关闭</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}


export function PromptEditor({ prompt, onPromptChange, onSave, isSaving }: PromptEditorProps) {
    const { toast } = useToast();
    const [expertDomains, setExpertDomains] = useState<ExpertDomain[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);
    const [isManageDomainsOpen, setIsManageDomainsOpen] = useState(false);
    const [saveAs, setSaveAs] = useState<'universal' | 'tenant'>('tenant');

    const fetchDomains = useCallback(async () => {
        setIsLoadingDomains(true);
        try {
            const domains = await getExpertDomains();
            setExpertDomains(domains);
        } catch (error) {
            console.error("Failed to fetch expert domains", error);
            toast({
                variant: "destructive",
                title: "加载专家领域失败",
                description: "无法从数据库获取专家领域列表。"
            });
        } finally {
            setIsLoadingDomains(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);
    
    const handleChange = (field: keyof Omit<PromptData, 'tenantId'>, value: string | '通用' | '专属') => {
        onPromptChange({ ...prompt, [field]: value });
    };

    return (
        <Dialog open={isManageDomainsOpen} onOpenChange={setIsManageDomainsOpen}>
            <Card className="shadow-lg h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                       <Sparkles className="h-6 w-6 text-accent" />
                       结构化提示词编辑器
                    </CardTitle>
                    <CardDescription>
                        在此设计和编排您的提示词。在用户指令中使用 <code className="bg-muted px-1 py-0.5 rounded text-muted-foreground">{`{{variable}}`}</code> 语法来定义可替换的变量。
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto p-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="prompt-name">提示词名称</Label>
                            <Input id="prompt-name" value={prompt.name} onChange={(e) => handleChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="expert-id">专家领域</Label>
                             <Select 
                                onValueChange={(value) => {
                                    if (value === 'manage-domains') {
                                        setIsManageDomainsOpen(true);
                                    } else {
                                        handleChange('expertId', value);
                                    }
                                }} 
                                value={prompt.expertId}
                             >
                                <SelectTrigger id="expert-id" disabled={isLoadingDomains}>
                                    <SelectValue placeholder={isLoadingDomains ? "正在加载..." : "选择一个专家领域..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>专家领域</SelectLabel>
                                        {expertDomains.map(domain => (
                                            <SelectItem key={domain.domainId} value={domain.domainId}>
                                                <span className="flex items-center gap-2"><Bot className="h-4 w-4" />{domain.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectSeparator />
                                    <DialogTrigger asChild>
                                        <SelectItem value="manage-domains" className="focus:bg-accent/50">
                                            <span className="flex items-center gap-2 text-accent">
                                                <Settings className="h-4 w-4"/>
                                                管理领域...
                                            </span>
                                        </SelectItem>
                                    </DialogTrigger>
                                </SelectContent>
                            </Select>
                        </div>
                   </div>
                   <div className="grid gap-4">
                        <div>
                            <Label htmlFor="system-prompt">系统提示 (System)</Label>
                            <Textarea id="system-prompt" placeholder="例如：你是一个专业的翻译家..." value={prompt.systemPrompt} onChange={(e) => handleChange('systemPrompt', e.target.value)} className="h-24" />
                        </div>
                         <div>
                            <Label htmlFor="user-prompt">用户指令 (User)</Label>
                            <Textarea id="user-prompt" placeholder="例如：将下面的文本翻译成 {{language}}: '{{text}}'" value={prompt.userPrompt} onChange={(e) => handleChange('userPrompt', e.target.value)} className="h-28" />
                        </div>
                   </div>
                   <div className="grid gap-4">
                        <div>
                            <Label htmlFor="context">示例/上下文 (Context)</Label>
                            <Textarea id="context" placeholder="提供一些一次性或少样本示例..." value={prompt.context} onChange={(e) => handleChange('context', e.target.value)} className="h-24" />
                        </div>
                         <div>
                            <Label htmlFor="negative-prompt">反向提示 (Negative)</Label>
                            <Textarea id="negative-prompt" placeholder="描述不希望在输出中看到的内容..." value={prompt.negativePrompt} onChange={(e) => handleChange('negativePrompt', e.target.value)} className="h-24" />
                        </div>
                   </div>
                </CardContent>
                 <CardFooter className="flex items-center justify-between gap-4">
                    <RadioGroup defaultValue={saveAs} onValueChange={(value: 'universal' | 'tenant') => setSaveAs(value)} className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tenant" id="r2" />
                            <Label htmlFor="r2" className="flex items-center gap-1.5"><Building className="h-4 w-4"/>保存为租户专属</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="universal" id="r1" />
                            <Label htmlFor="r1" className="flex items-center gap-1.5"><Globe className="h-4 w-4"/>保存为平台通用</Label>
                        </div>
                    </RadioGroup>

                    <Button className="w-1/3" onClick={() => onSave(prompt, saveAs)} disabled={isSaving || isLoadingDomains}>
                        {isSaving ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        保存到库
                    </Button>
                </CardFooter>
            </Card>
            <ManageDomainsDialog onDomainsUpdate={fetchDomains} />
        </Dialog>
    );
}
