

"use client";

import * as LucideReact from "lucide-react";
import React, { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Activity, KeyRound, ShoppingCart, Mail, Cloud, Cpu, Bot, Router, Phone, Mail as MailIcon, Palette, Video, FileEdit, Send, LoaderCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";
import type { IndividualUser, Role, Order, ProcurementItem, ApiKey, Department, Position } from "@/lib/data-types";
import { 
    getTenantData, 
    inviteUsers, 
    updateTenantUser,
    saveTenantRole,
    deleteTenantRole,
    createPreOrder,
    getProcurementItems,
} from "@/ai/flows/tenant-management-flows";
import { MembersCard } from "./members-card";
import { OrganizationAndRolesCard } from "./organization-and-roles-card";
import { MyOrdersCard } from "./my-orders-card";
import { ApiKeyManagementCard } from "./api-key-management-card";


const chartConfig = {
  tokens: {
    label: "Tokens",
    color: "hsl(var(--accent))",
  },
};

type ChatMessage = {
  role: 'user' | 'manager';
  content: string;
};

function ChatDialog() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([
          { role: 'manager', content: '您好！我是您的客户成功经理李经理，请问有什么可以帮助您的吗？' }
        ]);
      }, 500);
    }
  }, [messages]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const managerResponse: ChatMessage = { role: 'manager', content: '感谢您的提问。我正在查看相关信息，请稍候...' };
      setMessages(prev => [...prev, managerResponse]);
    }, 1200);
  };
  
  return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>与客户成功经理在线沟通</DialogTitle>
                <DialogDescription>
                    您正在与客户经理 <b>李经理</b> 对话。
                </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
                <div className="h-80 w-full pr-4 overflow-y-auto" ref={scrollAreaRef}>
                    <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? "justify-end" : "justify-start"}`}>
                        {msg.role === 'manager' && (
                            <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="manager portrait" />
                            <AvatarFallback>李</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none"}`}>
                            {msg.content}
                        </div>
                        {msg.role === 'user' && (
                            <Avatar className="h-8 w-8">
                            <AvatarFallback>您</AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="mt-4">
                <div className="relative">
                    <Textarea
                    placeholder="输入您想咨询的问题..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                        }
                    }}
                    className="pr-14"
                    />
                    <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-10">
                    <Send className="h-4 w-4"/>
                    </Button>
                </div>
            </form>
        </DialogContent>
  )
}

function LiveChatDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="mt-2">发起在线会话</Button>
            </DialogTrigger>
            <ChatDialog />
        </Dialog>
    );
}

export function TenantDashboard({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<IndividualUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tokenUsage, setTokenUsage] = useState<{ month: string, tokens: number }[]>([]);
  const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>([]);
  const [isLoading, setIsLoading] = useState({ data: true, procurement: true });
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const fetchData = React.useCallback(async () => {
    setIsLoading(prev => ({ ...prev, data: true }));
    try {
        const data = await getTenantData({ tenantId });
        setUsers(data.users);
        setOrders(data.orders);
        setRoles(data.roles);
        setDepartments(data.departments);
        setPositions(data.positions);
        setTokenUsage(data.tokenUsage);
    } catch (error: any) {
        toast({ title: "数据加载失败", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(prev => ({...prev, data: false }));
    }
  }, [toast, tenantId]);
  
  const fetchProcurementItems = React.useCallback(async () => {
    setIsLoading(prev => ({ ...prev, procurement: true }));
    try {
        const items = await getProcurementItems();
        setProcurementItems(items);
    } catch (error: any) {
        toast({ title: "加载商品失败", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(prev => ({...prev, procurement: false }));
    }
  }, [toast]);


  useEffect(() => {
    fetchData();
    fetchProcurementItems();
  }, [fetchData, fetchProcurementItems]);


  const handleCreatePreOrder = async (item: ProcurementItem, values: any) => {
      try {
        await createPreOrder({ tenantId: tenantId, item, quantity: values.quantity, notes: values.notes });
        toast({
            title: "预购单已提交",
            description: `您的 “${item.title}” 采购请求已提交，请在“我的订单”中查看状态。`,
        });
        setActiveTab("orders");
        await fetchData(); // Refresh data
      } catch (e: any) {
          toast({ title: "提交失败", description: e.message, variant: "destructive" });
      }
  };

  const handlePayOrder = (orderId: string) => {
    // In a real app, this would redirect to a payment gateway
    // For now, we simulate the status change
    toast({
        title: "支付成功！ (模拟)",
        description: "订单支付成功，平台将尽快为您完成资源配置。"
    });
  };

  const handleInviteUser = async (values: any) => {
    try {
      await inviteUsers({ tenantId: tenantId, users: [{ ...values, name: "新成员", status: "待审核" }] });
      toast({ title: "邀请已发送", description: `已成功向 ${values.email} 发送邀请。` });
      await fetchData();
    } catch (e: any) {
      toast({ title: "邀请失败", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdateUser = async (values: any) => {
    try {
      await updateTenantUser({ 
          tenantId: tenantId, 
          userId: values.id, 
          role: values.role,
          departmentId: values.departmentId === 'none' ? null : values.departmentId,
          positionId: values.positionId === 'none' ? null : values.positionId,
      });
      toast({ title: "成员已更新", description: `成员 ${values.name} 的信息已更新。` });
      await fetchData();
    } catch (e: any) {
      toast({ title: "更新失败", description: e.message, variant: "destructive" });
    }
  };
  
  const handleBatchImport = async (newUsers: any[]) => {
    try {
        await inviteUsers({ tenantId: tenantId, users: newUsers });
        toast({ title: "导入成功", description: `成功导入 ${newUsers.length} 名新成员。` });
        await fetchData();
    } catch (e: any) {
        toast({ title: "导入失败", description: e.message, variant: "destructive" });
    }
  };
  
  const handleExport = () => {
    toast({ title: "正在导出成员列表..." });
    const headers = ["姓名", "邮箱", "角色", "状态"];
    const csvContent = [
      headers.join(","),
      ...users.map(user => [user.name, user.email, user.role, user.status].join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "members.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleSaveRole = async (role: Role) => {
    try {
        await saveTenantRole({ tenantId: tenantId, role });
        toast({ title: "角色已保存" });
        await fetchData();
    } catch(e: any) {
         toast({ title: "保存角色失败", description: e.message, variant: "destructive" });
    }
  }
  
  const handleDeleteRole = async (roleId: string) => {
      try {
        if (roles.length <= 1) {
            toast({ title: "删除失败", description: "至少需要保留一个角色。", variant: "destructive" });
            return;
        }
        await deleteTenantRole({ tenantId: tenantId, roleId });
        toast({ title: "角色已删除" });
        await fetchData();
      } catch(e: any) {
          toast({ title: "删除角色失败", description: e.message, variant: "destructive" });
      }
  }

  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold font-headline">企业仪表盘</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <TabsTrigger value="overview"><Activity className="mr-2"/>概览</TabsTrigger>
                <TabsTrigger value="procurement"><ShoppingCart className="mr-2"/>集采市场</TabsTrigger>
                <TabsTrigger value="orders"><FileEdit className="mr-2"/>我的订单</TabsTrigger>
                <TabsTrigger value="users"><LucideReact.Users className="mr-2"/>成员与组织</TabsTrigger>
                <TabsTrigger value="settings"><KeyRound className="mr-2"/>资源与权限</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Token 使用量统计</CardTitle>
                                <CardDescription>过去六个月的每月 Token 总消耗量（基于已完成订单模拟）。</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pl-2">
                                {isLoading.data ? (
                                     <div className="flex justify-center items-center h-full">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={tokenUsage} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                            <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={30}/>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                            <Bar dataKey="tokens" fill="var(--color-tokens)" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                                )}
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
                                <LiveChatDialog />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            
             <TabsContent value="procurement" className="mt-6">
                <MyOrdersCard 
                    isLoading={isLoading.procurement}
                    items={procurementItems}
                    onConfirm={handleCreatePreOrder}
                />
            </TabsContent>
            
             <TabsContent value="orders" className="mt-6">
                 <MyOrdersCard
                    isLoading={isLoading.data}
                    orders={orders}
                    onPay={handlePayOrder}
                 />
            </TabsContent>

             <TabsContent value="users" className="mt-6 space-y-6">
                 <MembersCard 
                    isLoading={isLoading.data}
                    users={users} 
                    roles={roles}
                    departments={departments}
                    positions={positions}
                    onInviteUser={handleInviteUser}
                    onUpdateUser={handleUpdateUser}
                    onBatchImport={handleBatchImport}
                    onExport={handleExport}
                 />
                 <OrganizationAndRolesCard 
                    tenantId={tenantId}
                    roles={roles}
                    departments={departments}
                    positions={positions}
                    onSaveRole={handleSaveRole}
                    onDeleteRole={handleDeleteRole}
                    onOrgChange={fetchData}
                 />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
                 <ApiKeyManagementCard tenantId={tenantId} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
