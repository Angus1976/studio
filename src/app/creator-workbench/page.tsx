
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Wand2, GalleryVerticalEnd, ToyBrick, Send, Hand, CheckCircle, LoaderCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { KnowledgeBaseEntry } from "../knowledge-base/page";
import { useToast } from "@/hooks/use-toast";


type Demand = {
  id: string;
  title: string;
  budget: string;
  category: string;
  status: string;
};

type Submission = KnowledgeBaseEntry;


export default function CreatorWorkbenchPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Demand[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        try {
            const response = await api.get('/api/demands');
            const openDemands = response.data.filter((d: any) => d.status === '开放中');
            setTasks(openDemands);
        } catch (error) {
            console.error("Failed to fetch tasks (demands):", error);
            toast({ title: "加载任务失败", variant: "destructive" });
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const fetchSubmissions = async () => {
        setIsLoadingSubmissions(true);
        try {
            const response = await api.get('/api/knowledge-base');
            // For now, we assume all knowledge base entries can be submissions
            setSubmissions(response.data);
        } catch (error) {
            console.error("Failed to fetch submissions (knowledge base):", error);
            toast({ title: "加载提交记录失败", variant: "destructive" });
        } finally {
            setIsLoadingSubmissions(false);
        }
    };
    
    useEffect(() => {
        if (user?.role === 'creator') {
            fetchTasks();
            fetchSubmissions();
        }
    }, [user]);

    const handleTakeOrder = async (demandId: string) => {
        if (!user) {
            toast({ title: "请先登录", description: "登录后才能响应需求。", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(demandId);
        try {
            await api.post(`/api/demands/${demandId}/respond`, { supplier_id: user.id });
            toast({
                title: "接受成功",
                description: "您已成功接受此任务，状态已更新。",
            });
            await fetchTasks(); // Refresh list to show updated status
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "操作失败，请稍后重试。";
            toast({
                title: "接受失败",
                description: errorMessage,
                variant: "destructive",
            });
            console.error("Failed to respond to demand:", error);
        } finally {
            setIsSubmitting(null);
        }
    };


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
                           <div className="border rounded-lg overflow-hidden">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>任务标题</TableHead>
                                        <TableHead>类别</TableHead>
                                        <TableHead>预算/报酬</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTasks ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin inline-block"/> 正在加载任务...
                                            </TableCell>
                                        </TableRow>
                                    ) : tasks.length > 0 ? (
                                        tasks.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">{task.title}</TableCell>
                                                <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                                                <TableCell className="font-semibold text-primary">{task.budget}</TableCell>
                                                <TableCell>
                                                     <Badge variant={task.status === '开放中' ? 'default' : 'secondary'}>{task.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {task.status === '开放中' ? (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleTakeOrder(task.id)}
                                                            disabled={isSubmitting === task.id}
                                                        >
                                                            {isSubmitting === task.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Hand className="mr-2 h-4 w-4" />}
                                                            接受任务
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" disabled><CheckCircle className="mr-2 h-4 w-4" />已接受</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">暂无可接受的任务。</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
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
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="prompt-input">创意描述 (Prompt)</Label>
                                    <Textarea 
                                        id="prompt-input"
                                        placeholder="例如：一只正在看书的赛博朋克风格的猫，戴着眼镜，背景是下雨的东京街头。"
                                        rows={4}
                                        className="text-base"
                                    />
                                </div>
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
                            <CardDescription>您提交的创意作品将进入供应商产品库，并在此处进行管理。</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>作品名称</TableHead>
                                            <TableHead>类别</TableHead>
                                            <TableHead>价格</TableHead>
                                            <TableHead>最后更新</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingSubmissions ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin inline-block"/> 正在加载提交记录...
                                                </TableCell>
                                            </TableRow>
                                        ) : submissions.length > 0 ? (
                                            submissions.map((sub) => (
                                                <TableRow key={sub.id}>
                                                    <TableCell className="font-medium">{sub.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{sub.category}</Badge></TableCell>
                                                    <TableCell>{sub.price || 'N/A'}</TableCell>
                                                    <TableCell>{new Date(sub.last_updated).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">暂无提交记录。</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}
