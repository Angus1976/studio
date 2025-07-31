
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, User, Wand2, GalleryVerticalEnd, ToyBrick, Send } from "lucide-react";


export default function CreatorWorkbenchPage() {
    const { user } = useAuth();

    if (!user || user.role !== 'creator') {
        return (
            <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-headline font-bold text-destructive/90">访问受限</h1>
                <p className="mt-2 text-muted-foreground max-w-md">
                    只有创意者才能访问此页面。请使用创意者账户登录。
                </p>
                <Button asChild className="mt-6">
                    <Link href="/login">前往登录</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">创意者工作台</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    在这里，您可以接受任务、响应需求，并利用AI工具将您的创意变为现实。
                </p>
            </div>

            <Tabs defaultValue="tasks" className="mx-auto max-w-6xl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tasks"><GalleryVerticalEnd className="mr-2 h-4 w-4"/>任务与需求</TabsTrigger>
                    <TabsTrigger value="creation"><ToyBrick className="mr-2 h-4 w-4"/>3D AI 创作</TabsTrigger>
                    <TabsTrigger value="submissions"><Send className="mr-2 h-4 w-4"/>我的提交</TabsTrigger>
                </TabsList>
                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <CardTitle>任务需求池</CardTitle>
                            <CardDescription>查看平台发布的任务以及开放的需求，选择您感兴趣的进行创作。</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="text-center py-20 text-muted-foreground">
                             <p>当前暂无开放任务。</p>
                             <p className="text-sm">请稍后查看或等待平台派发任务。</p>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="creation">
                     <Card>
                        <CardHeader>
                            <CardTitle>3D AI 创作引擎</CardTitle>
                            <CardDescription>
                                基于 Tripo Studio 的下一代 AI 3D 生成技术。请在下方输入您的创意描述。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Textarea 
                                    placeholder="例如：一只正在看书的赛博朋克风格的猫，戴着眼镜，背景是下雨的东京街头。"
                                    rows={4}
                                    className="text-base"
                                />
                                <div className="flex justify-end">
                                    <Button size="lg">
                                        <Wand2 className="mr-2 h-5 w-5" />
                                        生成 3D 模型
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="submissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>我的创意提交</CardTitle>
                            <CardDescription>您提交的所有创意作品将在这里展示和管理。</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="text-center py-20 text-muted-foreground">
                             <p>您还没有提交任何作品。</p>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}
