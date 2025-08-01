
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Library, PlusCircle, Upload, Download, FilePenLine, Trash2, ExternalLink, KeyRound, LoaderCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


type ExternalLinkType = {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  last_updated: string;
};

type ApiInterface = {
  id: number;
  name: string;
  endpoint: string;
  auth_method: string;
  status: 'active' | 'inactive';
  docs_url: string;
};


export default function PublicResourcesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [links, setLinks] = useState<ExternalLinkType[]>([]);
    const [apis, setApis] = useState<ApiInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (user?.role !== 'admin') {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [linksRes, apisRes] = await Promise.all([
                api.get('/api/external-links'),
                api.get('/api/api-interfaces')
            ]);
            setLinks(linksRes.data);
            setApis(apisRes.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch public resources:", err);
            setError("无法加载公共资源，请稍后重试。");
            toast({ title: "加载失败", description: "无法从服务器获取公共资源。", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [user]);

    const handleDelete = async (type: 'link' | 'api', id: number) => {
        const url = type === 'link' ? `/api/external-links/${id}` : `/api/api-interfaces/${id}`;
        try {
            await api.delete(url);
            toast({ title: "删除成功", description: "资源已从库中移除。" });
            await fetchData(); // Refresh data
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
            toast({ title: "删除失败", description: "无法删除该资源，请稍后重试。", variant: "destructive" });
        }
    };

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

    const renderTableContent = (
        type: 'links' | 'apis',
        data: ExternalLinkType[] | ApiInterface[],
        columns: any[],
        renderRow: (item: any) => React.ReactNode
    ) => {
        if (isLoading) {
            return (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            正在加载...
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        if (error) {
            return (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                        {error}
                    </TableCell>
                </TableRow>
            );
        }
        if (data.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        暂无数据。
                    </TableCell>
                </TableRow>
            );
        }
        return data.map(renderRow);
    };

    const linkColumns = [
        { key: 'name', label: '名称' },
        { key: 'url', label: 'URL' },
        { key: 'description', label: '描述' },
        { key: 'category', label: '类别' },
        { key: 'last_updated', label: '最后更新' },
        { key: 'actions', label: '操作', className: 'text-right' },
    ];
    
    const apiColumns = [
        { key: 'name', label: '接口名称' },
        { key: 'endpoint', label: '端点 (Endpoint)' },
        { key: 'auth_method', label: '认证方式' },
        { key: 'status', label: '状态' },
        { key: 'docs_url', label: '相关文档' },
        { key: 'actions', label: '操作', className: 'text-right' },
    ];

    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center mb-8">
                 <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <Library className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">公共资源库管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    管理外部链接、API接口及其他关联信息。支持批量导入和导出，丰富AI的数据维度。
                </p>
            </div>

            <Card className="mx-auto mt-8 max-w-7xl">
                 <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <CardTitle>资源列表</CardTitle>
                            <CardDescription>管理所有外部链接和API接口。</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> 导入</Button>
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> 导出</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="links">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="links"><ExternalLink className="mr-2 h-4 w-4"/>外部链接</TabsTrigger>
                            <TabsTrigger value="apis"><KeyRound className="mr-2 h-4 w-4"/>API 接口</TabsTrigger>
                        </TabsList>
                        <TabsContent value="links" className="mt-6">
                            <div className="flex justify-end mb-4">
                                <Button disabled><PlusCircle className="mr-2 h-4 w-4"/>新增链接 (待实现)</Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {linkColumns.map(c => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {renderTableContent('links', links, linkColumns as any, (link: ExternalLinkType) => (
                                            <TableRow key={link.id}>
                                                <TableCell className="font-medium">{link.name}</TableCell>
                                                <TableCell><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{link.url} <ExternalLink className="h-3 w-3"/></a></TableCell>
                                                <TableCell className="text-muted-foreground">{link.description}</TableCell>
                                                <TableCell><Badge variant="outline">{link.category}</Badge></TableCell>
                                                <TableCell>{new Date(link.last_updated).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" disabled><FilePenLine className="h-4 w-4" /><span className="sr-only">编辑</span></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                 <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">删除</span></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        此操作无法撤销。这将永久删除 “{link.name}”。
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete('link', link.id)}>继续删除</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="apis" className="mt-6">
                             <div className="flex justify-end mb-4">
                                <Button disabled><PlusCircle className="mr-2 h-4 w-4"/>新增接口 (待实现)</Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                           {apiColumns.map(c => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                         {renderTableContent('apis', apis, apiColumns as any, (api: ApiInterface) => (
                                            <TableRow key={api.id}>
                                                <TableCell className="font-medium">{api.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{api.endpoint}</TableCell>
                                                <TableCell><Badge variant="secondary">{api.auth_method}</Badge></TableCell>
                                                <TableCell>
                                                  <Badge variant={api.status === 'active' ? 'default' : 'secondary'}>
                                                    {api.status === 'active' ? '生效中' : '已停用'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <a href={api.docs_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    查看文档 <ExternalLink className="inline-block h-3 w-3" />
                                                  </a>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" disabled><FilePenLine className="h-4 w-4" /><span className="sr-only">编辑</span></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">删除</span></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                         此操作无法撤销。这将永久删除 “{api.name}”。
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete('api', api.id)}>继续删除</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}
