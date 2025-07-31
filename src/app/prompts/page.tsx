
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { User, Settings, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const promptLibrary = {
    generateUserProfile: `You are an AI assistant that generates user profiles based on user input.

Analyze the following user input and generate a profile summary and a list of tags associated with the user.
The tags should reflect the user's interests, preferences, and needs.

Your response must be in Chinese.

Input: {textInput}
{if imageDataUri}
Image: {media url=imageDataUri}
{/if}

Profile Summary:
Tags:`,
    recommendProducts: `You are an AI recommendation engine that suggests products or services to users based on their needs and available information.

Analyze the user's needs, user profile (if available), available knowledge, public resources, and supplier databases to identify the most suitable options.

Your response must be in Chinese.

User Needs: {userNeeds}
User Profile: {userProfile}
Available Knowledge: {availableKnowledge}
Public Resources: {publicResources}
Supplier Databases: {supplierDatabases}

Provide a list of recommended products or services, along with a clear explanation of why each recommendation is suitable for the user.

Format your response as a JSON object with 'recommendations' (an array of product/service names) and 'reasoning' (an explanation for each recommendation).`,
    intelligentSearch: `You are an AI-powered search engine. Your task is to find the most relevant information from the provided knowledge base based on the user's query.

Your response must be in Chinese.

Knowledge Base:
"""
{knowledgeBase}
"""

User Query: "{query}"

Analyze the query and the knowledge base, and return a list of relevant results. For each result, provide a title, a short snippet, and a relevance score from 0 to 1.`,
};


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
                <h1 className="font-headline text-3xl md:text-4xl font-bold">提示词管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    平台方可在此配置不同场景下使用的提示词（Prompt）。
                </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <User className="w-5 h-5" />
                            用户画像生成
                        </CardTitle>
                        <CardDescription>用于根据用户输入生成用户画像的提示词模板。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label htmlFor="user-profile-prompt">提示词 ID: generateUserProfilePrompt</Label>
                        <Textarea id="user-profile-prompt" readOnly value={promptLibrary.generateUserProfile} rows={12} className="font-code text-xs bg-muted/50"/>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            产品服务推荐
                        </CardTitle>
                        <CardDescription>用于分析用户信息并推荐产品或服务的提示词模板。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label htmlFor="recommend-prompt">提示词 ID: recommendProductsOrServicesPrompt</Label>
                        <Textarea id="recommend-prompt" readOnly value={promptLibrary.recommendProducts} rows={12} className="font-code text-xs bg-muted/50"/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            智能搜索
                        </CardTitle>
                        <CardDescription>用于在知识库中进行智能搜索的提示词模板。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label htmlFor="search-prompt">提示词 ID: intelligentSearchPrompt</Label>
                        <Textarea id="search-prompt" readOnly value={promptLibrary.intelligentSearch} rows={12} className="font-code text-xs bg-muted/50"/>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
