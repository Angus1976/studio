
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageSearch, BookCopy, LoaderCircle, Trash2, Bot, Globe, Building } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Prompt, ExpertDomain } from '@/lib/data-types';
import { getExpertDomains } from '@/ai/flows/admin-management-flows';
import { useToast } from '@/hooks/use-toast';

export function PromptLibrary({ prompts, onSelectPrompt, isLoading, onDeletePrompt }: { prompts: Prompt[], onSelectPrompt: (prompt: Prompt) => void, isLoading: boolean, onDeletePrompt: (promptId: string) => void }) {
    const [search, setSearch] = useState('');
    const [expertDomainsMap, setExpertDomainsMap] = useState<Record<string, string>>({});
    const [isLoadingDomains, setIsLoadingDomains] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchDomains() {
            setIsLoadingDomains(true);
            try {
                const domains = await getExpertDomains();
                const domainMap = domains.reduce((acc: Record<string, string>, domain: ExpertDomain) => {
                    acc[domain.domainId] = domain.name;
                    return acc;
                }, {});
                setExpertDomainsMap(domainMap);
            } catch (error) {
                console.error("Failed to fetch expert domains map", error);
                toast({
                    variant: "destructive",
                    title: "加载领域失败",
                    description: "无法获取专家领域映射。"
                });
            } finally {
                setIsLoadingDomains(false);
            }
        }
        fetchDomains();
    }, [toast]);


    const filteredPrompts = prompts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card className="flex-1 flex flex-col shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <BookCopy className="h-6 w-6 text-accent" />
                    提示词库
                </CardTitle>
                <CardDescription>
                    选用一个标准或专属的提示词模板开始。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div className="relative">
                    <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="搜索提示词..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>名称</TableHead>
                                <TableHead>领域</TableHead>
                                <TableHead>范围</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading || isLoadingDomains ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPrompts.length > 0 ? (
                                filteredPrompts.map((prompt) => (
                                    <TableRow key={prompt.id}>
                                        <TableCell className="font-mono text-xs" title={prompt.id}>{prompt.id.substring(0, 8)}...</TableCell>
                                        <TableCell className="font-medium">{prompt.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={'secondary'}>
                                                <Bot className="h-3 w-3 mr-1" />
                                                {expertDomainsMap[prompt.expertId] || '未知'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={prompt.scope === '通用' ? 'default' : 'outline'} className="text-xs">
                                                 {prompt.scope === '通用' ? <Globe className="h-3 w-3 mr-1"/> : <Building className="h-3 w-3 mr-1"/>}
                                                 {prompt.scope}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button size="sm" variant="outline" onClick={() => onSelectPrompt(prompt)}>选用</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive" className="px-2">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            此操作无法撤销。这将把提示词归档，您将无法再使用它。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeletePrompt(prompt.id)}>
                                                            确认删除
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        没有找到提示词。
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
