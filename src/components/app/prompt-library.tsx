
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageSearch, BookCopy } from "lucide-react";

export type Prompt = {
    id: string;
    name: string;
    scope: '通用' | '专属';
    tenantId?: string;
    systemPrompt?: string;
    userPrompt: string;
    context?: string;
    negativePrompt?: string;
};

const mockPrompts: Prompt[] = [
    {
        id: 'prompt-translate-pro',
        name: '专业翻译器',
        scope: '通用',
        systemPrompt: 'You are a professional translator. Your task is to accurately translate the given text into the specified language, preserving the original tone and nuances.',
        userPrompt: 'Translate the following text into {{language}}:\n\n"{{text}}"',
    },
    {
        id: 'prompt-mktg-email',
        name: '营销邮件生成器',
        scope: '通用',
        systemPrompt: 'You are an expert marketing copywriter specializing in high-converting email campaigns.',
        userPrompt: 'Write a compelling marketing email for the following product:\n\nProduct Name: {{productName}}\nTarget Audience: {{audience}}\nKey Benefit: {{benefit}}',
        context: 'Example successful subject line: "✨ Your Exclusive Offer Awaits!"',
    },
    {
        id: 'prompt-tenant-support',
        name: '专属客服机器人',
        scope: '专属',
        tenantId: 'tenant-1',
        systemPrompt: 'You are a support agent for "Tech Innovators Inc.". Your tone should be helpful, patient, and professional. Always refer to our product as "The Innovator Suite". Do not mention competitors.',
        userPrompt: 'Respond to the following customer query: "{{query}}"',
        negativePrompt: 'Do not use informal language like "hey" or "cool".'
    },
     {
        id: 'prompt-code-explainer',
        name: '代码解释器',
        scope: '通用',
        systemPrompt: 'You are a senior software engineer skilled at explaining complex code in simple terms.',
        userPrompt: 'Explain the following code snippet written in {{language}} and describe its time complexity:\n\n```\n{{codeBlock}}\n```',
    }
];

export function PromptLibrary({ onSelectPrompt }: { onSelectPrompt: (prompt: Prompt) => void }) {
    const [search, setSearch] = useState('');

    const filteredPrompts = mockPrompts.filter(p =>
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
                                <TableHead>名称</TableHead>
                                <TableHead>范围</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPrompts.map((prompt) => (
                                <TableRow key={prompt.id}>
                                    <TableCell className="font-medium">{prompt.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={prompt.scope === '通用' ? 'secondary' : 'default'}>
                                            {prompt.scope}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => onSelectPrompt(prompt)}>选用</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
