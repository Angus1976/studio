
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Code, ShieldCheck, User, BarChart3, AlertTriangle, Info } from "lucide-react";
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

const managementPanels = [
    { 
        title: "多租户企业管理",
        description: "管理平台上的所有企业租户账户。",
        icon: Building,
        buttonText: "增、改、删企业注册租户",
        placeholderText: "功能待开发：租户列表、审核、权限设置...",
    },
    {
        title: "个人用户管理",
        description: "查看和管理所有个人用户。",
        icon: User,
        buttonText: "管理个人用户",
        placeholderText: "功能待开发：用户搜索、禁用、数据查看...",
    },
    {
        title: "技术工程师管理",
        description: "审核、认证和管理平台的技术工程师。",
        icon: Code,
        buttonText: "管理技术工程师",
        placeholderText: "功能待开发：工程师申请列表、能力审核...",
    },
    {
        title: "权限与资产管理",
        description: "配置各角色的权限和管理平台软件资产。",
        icon: ShieldCheck,
        buttonText: "配置权限",
        placeholderText: "功能待开发：角色权限矩阵、系统配置...",
    }
];

function PlaceholderDialog({ triggerButton, title, description, buttonText }: { triggerButton: React.ReactNode, title: string, description: string, buttonText: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" /> {title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <Card className="bg-muted/50 border-dashed">
                        <CardContent className="p-4 text-center text-sm text-muted-foreground">
                            <Info className="h-8 w-8 mx-auto mb-2 text-primary/50"/>
                            此功能仍在开发中，将在未来版本中提供。
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button variant="outline">关闭</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto p-4 md:p-6 lg:p-8">
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
                 {managementPanels.map((panel, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><panel.icon className="text-accent"/> {panel.title}</CardTitle>
                            <CardDescription>{panel.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{panel.placeholderText}</p>
                        </CardContent>
                        <CardFooter>
                             <PlaceholderDialog 
                                triggerButton={<Button>{panel.buttonText}</Button>}
                                title={`管理功能：${panel.title}`}
                                description={`这里是管理“${panel.title}”的操作界面。`}
                                buttonText={panel.buttonText}
                             />
                        </CardFooter>
                    </Card>
                ))}
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
