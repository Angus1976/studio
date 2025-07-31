
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Code, ShieldCheck, User, BarChart3 } from "lucide-react";
import { UsersRound } from "@/components/app/icons";

const kpiData = [
    { title: "总收入", value: "¥1,250,345", change: "+12.5%", icon: BarChart3 },
    { title: "活跃租户", value: "1,402", change: "+30", icon: Building },
    { title: "活跃工程师", value: "89", change: "+4", icon: Code },
    { title: "个人用户", value: "15,723", change: "+201", icon: User },
];

const recentUsers = [
    { name: "Tech Innovators Inc.", role: "企业租户", date: "2024-07-20", status: "活跃" },
    { name: "张三", role: "技术工程师", date: "2024-07-19", status: "待审核" },
    { name: "李四", role: "个人用户", date: "2024-07-19", status: "活跃" },
    { name: "A.I. Solutions Ltd.", role: "企业租户", date: "2024-07-18", status: "已禁用" },
];


export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto">
        <h1 className="text-3xl font-bold font-headline">管理员仪表盘</h1>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((item, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground">{item.change} from last month</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Management Panels */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="text-accent"/> 多租户企业管理</CardTitle>
                        <CardDescription>管理平台上的所有企业租户账户。</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">功能待开发：租户列表、审核、权限设置...</p>
                    </CardContent>
                    <CardContent>
                        <Button>管理企业租户</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="text-accent"/> 个人用户管理</CardTitle>
                        <CardDescription>查看和管理所有个人用户。</CardDescription>
                    </CardHeader>
                     <CardContent>
                       <p className="text-sm text-muted-foreground">功能待开发：用户搜索、禁用、数据查看...</p>
                    </CardContent>
                    <CardContent>
                        <Button>管理个人用户</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Code className="text-accent"/> 技术工程师管理</CardTitle>
                        <CardDescription>审核、认证和管理平台的技术工程师。</CardDescription>
                    </CardHeader>
                     <CardContent>
                       <p className="text-sm text-muted-foreground">功能待开发：工程师申请列表、能力审核...</p>
                    </CardContent>
                    <CardContent>
                        <Button>管理技术工程师</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-accent"/> 权限与资产管理</CardTitle>
                        <CardDescription>配置各角色的权限和管理平台软件资产。</CardDescription>
                    </CardHeader>
                     <CardContent>
                       <p className="text-sm text-muted-foreground">功能待开发：角色权限矩阵、系统配置...</p>
                    </CardContent>
                    <CardContent>
                        <Button>配置权限</Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Users */}
            <div className="lg:col-span-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UsersRound className="h-6 w-6 text-accent"/> 最近用户活动</CardTitle>
                        <CardDescription>最近加入或有状态变更的用户。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>名称</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>状态</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentUsers.map(user => (
                                    <TableRow key={user.name}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === '活跃' ? 'default' : user.status === '待审核' ? 'secondary' : 'destructive'}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
