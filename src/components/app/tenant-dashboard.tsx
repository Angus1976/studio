
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FileText, Users, DollarSign, Activity, PlusCircle, KeyRound, ShieldCheck } from "lucide-react";

const usageData = [
  { month: "一月", tokens: 120000 },
  { month: "二月", tokens: 180000 },
  { month: "三月", tokens: 150000 },
  { month: "四月", tokens: 210000 },
  { month: "五月", tokens: 250000 },
  { month: "六月", tokens: 310000 },
];

const chartConfig = {
  tokens: {
    label: "Tokens",
    color: "hsl(var(--accent))",
  },
};

const invoices = [
    { id: "INV-2024-005", date: "2024-06-01", amount: "¥1,500.00", status: "已支付" },
    { id: "INV-2024-004", date: "2024-05-01", amount: "¥1,250.00", status: "已支付" },
    { id: "INV-2024-003", date: "2024-04-01", amount: "¥1,100.00", status: "已支付" },
]

const users = [
    { name: "王经理", email: "wang.m@examplecorp.com", role: "管理员", status: "活跃" },
    { name: "李工", email: "li.e@examplecorp.com", role: "成员", status: "活跃" },
    { name: "赵分析师", email: "zhao.a@examplecorp.com", role: "成员", status: "已禁用" },
]


export function TenantDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto">
        <h1 className="text-3xl font-bold font-headline">企业仪表盘</h1>
        
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview"><Activity className="mr-2"/>概览</TabsTrigger>
                <TabsTrigger value="billing"><DollarSign className="mr-2"/>账单与发票</TabsTrigger>
                <TabsTrigger value="users"><Users className="mr-2"/>成员管理</TabsTrigger>
                <TabsTrigger value="settings"><KeyRound className="mr-2"/>资源与权限</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Token 使用量统计</CardTitle>
                        <CardDescription>过去六个月的每月 Token 总消耗量。</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ChartContainer config={chartConfig}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={usageData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="tokens" fill="var(--color-tokens)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="billing" className="mt-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>账单与发票</CardTitle>
                            <CardDescription>查看和下载您的历史账单。</CardDescription>
                        </div>
                        <Button><FileText className="mr-2"/>下载全部</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>发票号</TableHead>
                                    <TableHead>日期</TableHead>
                                    <TableHead>金额</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.id}</TableCell>
                                        <TableCell>{invoice.date}</TableCell>
                                        <TableCell>{invoice.amount}</TableCell>
                                        <TableCell><Badge variant={invoice.status === '已支付' ? 'default' : 'secondary'}>{invoice.status}</Badge></TableCell>
                                        <TableCell className="text-right"><Button variant="outline" size="sm">查看</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="users" className="mt-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle>成员管理</CardTitle>
                            <CardDescription>管理您企业下的成员账户和权限。</CardDescription>
                        </div>
                        <Button><PlusCircle className="mr-2"/>邀请新成员</Button>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>姓名</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.email}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                        <TableCell><Badge variant={user.status === '活跃' ? 'default' : 'destructive'}>{user.status}</Badge></TableCell>
                                        <TableCell className="text-right"><Button variant="outline" size="sm">编辑</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound/> API 密钥管理</CardTitle>
                            <CardDescription>管理用于调用平台服务的 API 密钥。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">功能待开发：创建、吊销、轮换密钥。</p>
                            <Button>管理 API 密钥</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck/> 权限角色配置</CardTitle>
                            <CardDescription>自定义企业内部的角色及其权限。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">功能待开发：创建新角色、配置权限矩阵。</p>
                            <Button>配置角色</Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
