
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { User, Settings, AlertTriangle, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const promptLibrary = [
    {
        id: 'generateUserProfilePrompt',
        name: '用户画像生成',
        description: '根据用户输入生成用户画像的提示词模板。',
        scope: '智能匹配',
        status: 'active',
        content: `You are an AI assistant that generates user profiles based on user input.

Analyze the following user input and generate a profile summary and a list of tags associated with the user.
The tags should reflect the user's interests, preferences, and needs.

Your response must be in Chinese.

Input: {textInput}
{if imageDataUri}
Image: {media url=imageDataUri}
{/if}

Profile Summary:
Tags:`
    },
    {
        id: 'recommendProductsOrServicesPrompt',
        name: '产品服务推荐',
        description: '分析用户信息并推荐产品或服务的提示词模板。',
        scope: '智能匹配',
        status: 'active',
        content: `You are an AI recommendation engine that suggests products or services to users based on their needs and available information.

Analyze the user's needs, user profile (if available), available knowledge, public resources, and supplier databases to identify the most suitable options.

Your response must be in Chinese.

User Needs: {userNeeds}
User Profile: {userProfile}
Available Knowledge: {availableKnowledge}
Public Resources: {publicResources}
Supplier Databases: {supplierDatabases}

Provide a list of recommended products or services, along with a clear explanation of why each recommendation is suitable for the user.

Format your response as a JSON object with 'recommendations' (an array of product/service names) and 'reasoning' (an explanation for each recommendation).`
    },
    {
        id: 'intelligentSearchPrompt',
        name: '智能搜索',
        description: '在知识库中进行智能搜索的提示词模板。',
        scope: '智能搜索',
        status: 'active',
        content: `You are an AI-powered search engine. Your task is to find the most relevant information from the provided knowledge base based on the user's query.

Your response must be in Chinese.

Knowledge Base:
"""
{knowledgeBase}
"""

User Query: "{query}"

Analyze the query and the knowledge base, and return a list of relevant results. For each result, provide a title, a short snippet, and a relevance score from 0 to 1.`
    },
     {
        id: 'processSupplierDataPrompt',
        name: '供应商数据处理',
        description: '解析CSV数据并评估供应商匹配度。',
        scope: '供应商整合',
        status: 'inactive',
        content: `你是一个智能数据处理助手。你的任务是解析以下 CSV 格式的供应商数据...`
    }
];


export default function PromptsPage() {
    const { user } = useAuth();

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-headline font-bold text-destructive/90">访问受限</h1>
                <p className="mt-2 text-muted-foreground max-w-md">
                    只有管理员才能访问此页面。请使用管理员账户登录。
                </p>
                <Button asChild className="mt-6">
                    <Link href="/login">前往登录</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
                 <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <Settings className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">提示词工程配置</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    平台方可在此集中配置、管理不同业务场景下使用的专业提示词（Prompt）。
                </p>
            </div>

            <Card className="mx-auto mt-8 max-w-7xl">
                <CardHeader>
                    <CardTitle className="font-headline">提示词库</CardTitle>
                    <CardDescription>管理系统中所有生效的AI提示词。</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>提示词名称</TableHead>
                                <TableHead>提示词ID</TableHead>
                                <TableHead>功能简述</TableHead>
                                <TableHead>生效范围</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promptLibrary.map((prompt) => (
                                <TableRow key={prompt.id}>
                                    <TableCell className="font-medium">{prompt.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{prompt.id}</TableCell>
                                    <TableCell className="text-muted-foreground">{prompt.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{prompt.scope}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={prompt.status === 'active' ? 'default' : 'secondary'}>
                                            {prompt.status === 'active' ? '生效中' : '已停用'}
                                        </dge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon">
                                                <FileText className="h-4 w-4" />
                                                <span className="sr-only">查看详情</span>
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                                 <span className="sr-only">编辑</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                                 <span className="sr-only">停用</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
