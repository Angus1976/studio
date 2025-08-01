
"use client";

import * as LucideReact from "lucide-react";
import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FileText, Users, DollarSign, Activity, PlusCircle, KeyRound, ShieldCheck, ShoppingCart, Briefcase, Mail, Cloud, Cpu, Bot, Router, Phone, Mail as MailIcon, Palette, AlertTriangle, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const initialInvoices = [
    { id: "INV-2024-005", date: "2024-06-01", amount: "¥1,500.00", status: "已支付" },
    { id: "INV-2024-004", date: "2024-05-01", amount: "¥1,250.00", status: "已支付" },
    { id: "INV-2024-003", date: "2024-04-01", amount: "¥1,100.00", status: "已支付" },
]

const initialUsers = [
    { name: "王经理", email: "wang.m@examplecorp.com", role: "管理员", status: "活跃" },
    { name: "李工", email: "li.e@examplecorp.com", role: "成员", status: "活跃" },
    { name: "赵分析师", email: "zhao.a@examplecorp.com", role: "成员", status: "已禁用" },
]

const procurementItems = [
    { title: "企业邮箱服务", description: "安全、稳定、高效的企业级邮件解决方案。", icon: "Mail", tag: "办公基础" },
    { title: "视频会议服务", description: "高清、流畅、支持多方协作的在线会议平台。", icon: "Video", tag: "办公基础" },
    { title: "云计算资源", description: "弹性、可扩展的云服务器和计算能力。", icon: "Cloud", tag: "IT设施" },
    { title: "云存储", description: "大容量、高可靠性的对象存储和文件存储服务。", icon: "Cpu", tag: "IT设施" },
    { title: "LLM Token 包", description: "批量采购大语言模型调用 Token，成本更优。", icon: "Bot", tag: "AI能力" },
    { title: "IT 设备和服务", description: "提供办公电脑、服务器等硬件及运维服务。", icon: "Briefcase", tag: "硬件与服务" },
    { title: "网络租赁", description: "高速、稳定的企业专线和网络解决方案。", icon: "Router", tag: "IT设施" },
    { title: "RPA 流程设计", description: "定制化设计机器人流程自动化解决方案。", icon: "Palette", tag: "专业服务" },
    { title: "AI 数字员工", description: "购买或租赁预设的 AI 数字员工以完成特定任务。", icon: "Bot", tag: "AI能力" },
]

const inviteUserSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  role: z.string().min(1, { message: "请为用户选择一个角色。" }),
});


const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const Icon = (LucideReact as any)[name] as React.ElementType;
    if (!Icon) return <LucideReact.Package {...props} />; // Fallback icon
    return <Icon {...props} />;
};

function InviteUserDialog({ onInvite }: { onInvite: (values: z.infer<typeof inviteUserSchema>) => void }) {
  const form = useForm<z.infer<typeof inviteUserSchema>>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: "" },
  });
  const [open, setOpen] = useState(false);

  const onSubmit = (values: z.infer<typeof inviteUserSchema>) => {
    onInvite(values);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2"/>邀请新成员</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>邀请新成员加入企业</DialogTitle>
          <DialogDescription>输入新成员的邮箱并为其分配一个角色。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input placeholder="member@examplecorp.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择一个角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="成员">成员</SelectItem>
                      <SelectItem value="管理员">管理员</SelectItem>
                      <SelectItem value="访客">访客</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">发送邀请</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export function TenantDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);

  const handleInviteUser = (values: z.infer<typeof inviteUserSchema>) => {
    const newUser = { ...values, name: "新成员", status: "邀请中" };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "邀请已发送",
      description: `已成功向 ${values.email} 发送邀请。`,
    });
  };
  
  const handlePlaceholderClick = (title: string) => {
    toast({
      title: '功能待开发',
      description: `${title} 功能正在开发中。`
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold font-headline">企业仪表盘</h1>
        
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="overview"><Activity className="mr-2"/>概览</TabsTrigger>
                <TabsTrigger value="procurement"><ShoppingCart className="mr-2"/>集采市场</TabsTrigger>
                <TabsTrigger value="billing"><DollarSign className="mr-2"/>账单与发票</TabsTrigger>
                <TabsTrigger value="users"><Users className="mr-2"/>成员管理</TabsTrigger>
                <TabsTrigger value="settings"><KeyRound className="mr-2"/>资源与权限</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Token 使用量统计</CardTitle>
                                <CardDescription>过去六个月的每月 Token 总消耗量。</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pl-2">
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={usageData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={30}/>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Bar dataKey="tokens" fill="var(--color-tokens)" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                             <CardHeader>
                                <CardTitle>您的专属客户成功经理</CardTitle>
                                <CardDescription>随时联系我们以获得帮助。</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="manager portrait" />
                                        <AvatarFallback>李</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-lg">李经理</p>
                                        <p className="text-sm text-muted-foreground">大客户服务</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>138-0013-8000</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MailIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>li.manager@example.com</span>
                                    </div>
                                </div>
                                <Button className="mt-2" onClick={() => handlePlaceholderClick('在线会话')}>发起在线会话</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

             <TabsContent value="procurement" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>集中采购市场</CardTitle>
                        <CardDescription>为您的企业统一采购软件、服务和各类资源。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {procurementItems.map((item) => (
                             <Dialog key={item.title}>
                                <Card className="flex flex-col hover:shadow-md transition-shadow">
                                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                                        <div className="p-3 bg-accent/10 rounded-full">
                                            <IconComponent name={item.icon} className="h-6 w-6 text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                            <Badge variant="outline" className="mt-1 font-normal">{item.tag}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <DialogTrigger asChild>
                                            <Button className="w-full">进入采购</Button>
                                        </DialogTrigger>
                                    </CardFooter>
                                </Card>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>采购: {item.title}</DialogTitle>
                                        <DialogDescription>{item.description}</DialogDescription>
                                    </DialogHeader>
                                    <div className="text-center py-8 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">采购详情与配置界面待开发...</p>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">关闭</Button>
                                        </DialogClose>
                                         <DialogClose asChild>
                                            <Button>确认采购</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ))}
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
                        <Button onClick={() => handlePlaceholderClick('下载全部')}><FileText className="mr-2"/>下载全部</Button>
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
                                {initialInvoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.id}</TableCell>
                                        <TableCell>{invoice.date}</TableCell>
                                        <TableCell>{invoice.amount}</TableCell>
                                        <TableCell><Badge variant={invoice.status === '已支付' ? 'default' : 'secondary'}>{invoice.status}</Badge></TableCell>
                                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handlePlaceholderClick(`查看发票 ${invoice.id}`)}>查看</Button></TableCell>
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
                        <InviteUserDialog onInvite={handleInviteUser} />
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
                                        <TableCell>
                                          <Badge 
                                            variant={user.status === '活跃' ? 'default' : user.status === '邀请中' ? 'secondary' : 'destructive'}
                                          >
                                            {user.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handlePlaceholderClick(`编辑用户 ${user.name}`)}>编辑</Button></TableCell>
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
                            <Button onClick={() => handlePlaceholderClick('管理 API 密钥')}>管理 API 密钥</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck/> 权限角色配置</CardTitle>
                            <CardDescription>自定义企业内部的角色及其权限。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">功能待开发：创建新角色、配置权限矩阵。</p>
                            <Button onClick={() => handlePlaceholderClick('配置角色')}>配置角色</Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}

    