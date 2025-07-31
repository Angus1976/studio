
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Library, PlusCircle, Upload, Download, FilePenLine, Trash2, ExternalLink, KeyRound } from "lucide-react";

// Mock data for public resources
const externalLinks = [
  {
    id: "link-001",
    name: "TechCrunch - 最新科技新闻",
    url: "https://techcrunch.com/",
    description: "提供技术和创业公司新闻、分析和观点。",
    category: "科技新闻",
    lastUpdated: "2024-07-29",
  },
  {
    id: "link-002",
    name: "中国家电网",
    url: "http://www.cheaa.com/",
    description: "中国家用电器协会主办的官方网站，提供行业动态和数据。",
    category: "行业资讯",
    lastUpdated: "2024-07-28",
  },
  {
    id: "link-003",
    name: "Statista - 市场数据统计",
    url: "https://www.statista.com/",
    description: "全球领先的商业数据平台，提供各类市场和消费者数据。",
    category: "数据分析",
    lastUpdated: "2024-07-27",
  },
];

const apiInterfaces = [
  {
    id: "api-001",
    name: "天气查询 API",
    endpoint: "https://api.weather.com/v3/weather/...",
    authMethod: "API Key",
    status: "active",
    docsUrl: "https://weather.com/dev/docs",
  },
  {
    id: "api-002",
    name: "地图与地理编码 API",
    endpoint: "https://api.mapbox.com/geocoding/v5/...",
    authMethod: "OAuth 2.0",
    status: "active",
    docsUrl: "https://docs.mapbox.com/api/search/geocoding/",
  },
  {
    id: "api-003",
    name: "内部产品价格查询",
    endpoint: "https://internal.api/products/price",
    authMethod: "JWT",
    status: "inactive",
    docsUrl: "https://internal.docs/product-price-api",
  },
];


export default function PublicResourcesPage() {
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
                    <Library className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">公共资源库管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    管理外部链接、API接口及其他关联信息。支持批量导入和导出，丰富AI的数据维度。
                </p>
            </div>

            <Card className="mx-auto mt-8 max-w-7xl">
                 <CardHeader>
                    <div className="flex items-center justify-between">
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
                                <Button><PlusCircle className="mr-2 h-4 w-4"/>新增链接</Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>名称</TableHead>
                                            <TableHead>URL</TableHead>
                                            <TableHead>描述</TableHead>
                                            <TableHead>类别</TableHead>
                                            <TableHead>最后更新</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {externalLinks.map((link) => (
                                            <TableRow key={link.id}>
                                                <TableCell className="font-medium">{link.name}</TableCell>
                                                <TableCell><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link.url}</a></TableCell>
                                                <TableCell className="text-muted-foreground">{link.description}</TableCell>
                                                <TableCell><Badge variant="outline">{link.category}</Badge></TableCell>
                                                <TableCell>{link.lastUpdated}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon"><FilePenLine className="h-4 w-4" /><span className="sr-only">编辑</span></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">删除</span></Button>
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
                                <Button><PlusCircle className="mr-2 h-4 w-4"/>新增接口</Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>接口名称</TableHead>
                                            <TableHead>端点 (Endpoint)</TableHead>
                                            <TableHead>认证方式</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead>相关文档</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiInterfaces.map((api) => (
                                            <TableRow key={api.id}>
                                                <TableCell className="font-medium">{api.name}</TableCell>
                                                <TableCell className="font-mono text-xs">{api.endpoint}</TableCell>
                                                <TableCell><Badge variant="secondary">{api.authMethod}</Badge></TableCell>
                                                <TableCell>
                                                  <Badge variant={api.status === 'active' ? 'default' : 'destructive'}>
                                                    {api.status === 'active' ? '生效中' : '已停用'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    查看文档 <ExternalLink className="inline-block ml-1 h-3 w-3" />
                                                  </a>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon"><FilePenLine className="h-4 w-4" /><span className="sr-only">编辑</span></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /><span className="sr-only">删除</span></Button>
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

    