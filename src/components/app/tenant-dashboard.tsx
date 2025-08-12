
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
import { FileText, Users, DollarSign, Activity, PlusCircle, KeyRound, ShieldCheck, ShoppingCart, Briefcase, Mail, Cloud, Cpu, Bot, Router, Phone, Mail as MailIcon, Palette, AlertTriangle, Video, FileEdit, Send, Info, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";


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

type User = {
    name: string;
    email: string;
    role: string;
    status: string;
};


const initialUsers: User[] = [
    { name: "王经理", email: "wang.m@examplecorp.com", role: "管理员", status: "活跃" },
    { name: "李工", email: "li.e@examplecorp.com", role: "成员", status: "活跃" },
    { name: "赵分析师", email: "zhao.a@examplecorp.com", role: "成员", status: "已禁用" },
]

const procurementItems = [
    { id: 'prod-001', title: "企业邮箱服务", description: "安全、稳定、高效的企业级邮件解决方案。", icon: "Mail", tag: "办公基础", price: 50, unit: "用户/年" },
    { id: 'prod-002', title: "视频会议服务", description: "高清、流畅、支持多方协作的在线会议平台。", icon: "Video", tag: "办公基础", price: 100, unit: "许可/年" },
    { id: 'prod-003', title: "云计算资源", description: "弹性、可扩展的云服务器和计算能力。", icon: "Cloud", tag: "IT设施", price: 500, unit: "vCPU/月" },
    { id: 'prod-004', title: "云存储", description: "大容量、高可靠性的对象存储和文件存储服务。", icon: "Cpu", tag: "IT设施", price: 200, unit: "TB/月" },
    { id: 'prod-005', title: "LLM Token 包", description: "批量采购大语言模型调用 Token，成本更优。", icon: "Bot", tag: "AI能力", price: 100, unit: "百万Token" },
    { id: 'prod-006', title: "IT 设备和服务", description: "提供办公电脑、服务器等硬件及运维服务。", icon: "Briefcase", tag: "硬件与服务", price: 5000, unit: "台" },
    { id: 'prod-007', title: "网络租赁", description: "高速、稳定的企业专线和网络解决方案。", icon: "Router", tag: "IT设施", price: 2000, unit: "Mbps/月" },
    { id: 'prod-008', title: "RPA 流程设计", description: "定制化设计机器人流程自动化解决方案。", icon: "Palette", tag: "专业服务", price: 10000, unit: "流程" },
    { id: 'prod-009', title: "AI 数字员工", description: "购买或租赁预设的 AI 数字员工以完成特定任务。", icon: "Bot", tag: "AI能力", price: 8000, unit: "个/月" },
]

type ProcurementItem = typeof procurementItems[0];
type OrderStatus = "待平台确认" | "待支付" | "配置中" | "已完成" | "已取消";

type Order = {
    id: string;
    items: (ProcurementItem & { quantity: number })[];
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}

const initialOrders: Order[] = [
    {
        id: `PO-${Date.now() - 100000}`,
        items: [{...procurementItems[0], quantity: 10}],
        totalAmount: 500,
        status: "已完成",
        createdAt: "2024-07-20",
        updatedAt: "2024-07-21"
    },
     {
        id: `PO-${Date.now() - 50000}`,
        items: [{...procurementItems[4], quantity: 5}],
        totalAmount: 500,
        status: "待支付",
        createdAt: "2024-07-22",
        updatedAt: "2024-07-22"
    }
]

const preOrderSchema = z.object({
  quantity: z.coerce.number().min(1, { message: "数量必须大于0。" }),
  notes: z.string().optional(),
});


const inviteUserSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  role: z.string().min(1, { message: "请为用户选择一个角色。" }),
});

const editUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.string().min(1, { message: "请为用户选择一个角色。" }),
});



const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const Icon = (LucideReact as any)[name] as React.ElementType;
    if (!Icon) return <LucideReact.Package {...props} />; // Fallback icon
    return <Icon {...props} />;
};

function CreatePreOrderDialog({ item, onConfirm }: { item: ProcurementItem, onConfirm: (values: z.infer<typeof preOrderSchema>) => void }) {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof preOrderSchema>>({
        resolver: zodResolver(preOrderSchema),
        defaultValues: { quantity: 1, notes: "" },
    });

    const onSubmit = (values: z.infer<typeof preOrderSchema>) => {
        onConfirm(values);
        form.reset();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">加入预购单</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>创建预购单: {item.title}</DialogTitle>
                    <DialogDescription>
                        确认采购数量和备注，提交后将生成预购单，待平台客户经理确认。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                           <div className="p-3 bg-accent/10 rounded-full">
                               <IconComponent name={item.icon} className="h-8 w-8 text-accent" />
                           </div>
                           <div>
                               <h4 className="font-semibold">{item.title}</h4>
                               <p className="text-sm text-muted-foreground">
                                   单价: ¥{item.price} / {item.unit}
                                </p>
                           </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>采购数量</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="输入采购数量" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注 (可选)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="如有特殊要求，请在此说明" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">取消</Button></DialogClose>
                            <Button type="submit">提交预购单</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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

function EditUserDialog({ user, onUpdate, children }: { user: User, onUpdate: (values: z.infer<typeof editUserSchema>) => void, children: React.ReactNode }) {
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: user,
  });
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    if (open) {
      form.reset(user);
    }
  }, [open, user, form]);

  const onSubmit = (values: z.infer<typeof editUserSchema>) => {
    onUpdate(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑成员: {user.name}</DialogTitle>
          <DialogDescription>修改成员的角色信息。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
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
              <Button type="submit">保存更改</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


type ChatMessage = {
  role: 'user' | 'manager';
  content: string;
};

function LiveChatDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          { role: 'manager', content: '您好！我是您的客户成功经理李经理，请问有什么可以帮助您的吗？' }
        ]);
      }, 500);
    }
  }, [isOpen, messages]);

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mt-2">发起在线会话</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>与客户成功经理在线沟通</DialogTitle>
          <DialogDescription>
            您正在与客户经理 <b>李经理</b> 对话。
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-80 w-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'manager' && (
                    <Avatar className="h-8 w-8">
                       <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="manager portrait" />
                       <AvatarFallback>李</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                      "max-w-xs rounded-lg px-3 py-2 text-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary text-secondary-foreground rounded-bl-none"
                    )}>
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
          </ScrollArea>
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
    </Dialog>
  );
}


function ViewOrderDialog({ order }: { order: Order }) {
    const getStatusBadgeVariant = (status: OrderStatus) => {
        switch (status) {
            case "待支付": return "destructive";
            case "待平台确认": return "secondary";
            case "配置中": return "default";
            case "已完成": return "outline";
            case "已取消": return "destructive";
            default: return "default";
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">查看</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>订单详情: {order.id}</DialogTitle>
                    <DialogDescription>
                        创建于 {order.createdAt}，最后更新于 {order.updatedAt}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">状态</span>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">总金额</span>
                        <span className="font-semibold">¥{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <h4 className="font-semibold">订单内容</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>项目</TableHead>
                                <TableHead>单价</TableHead>
                                <TableHead className="text-center">数量</TableHead>
                                <TableHead className="text-right">小计</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.title}</TableCell>
                                    <TableCell>¥{item.price.toFixed(2)} / {item.unit}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">关闭</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function TenantDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("overview");

  const handleCreatePreOrder = (item: ProcurementItem, values: z.infer<typeof preOrderSchema>) => {
      const newOrder: Order = {
          id: `PO-${Date.now()}`,
          items: [{ ...item, quantity: values.quantity }],
          totalAmount: item.price * values.quantity,
          status: "待平台确认",
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
      };
      setOrders(prev => [newOrder, ...prev]);
      toast({
          title: "预购单已提交",
          description: `您的 “${item.title}” 采购请求已提交，请在“我的订单”中查看状态。`,
      });
      // Switch to orders tab
      setActiveTab("orders");
  };

  const handlePayOrder = (orderId: string) => {
    // In a real app, this would redirect to a payment gateway
    setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: "配置中", updatedAt: new Date().toISOString().split('T')[0] } : order
    ));
    toast({
        title: "支付成功！",
        description: "订单支付成功，平台将尽快为您完成资源配置。"
    });
  };

  const handleInviteUser = (values: z.infer<typeof inviteUserSchema>) => {
    const newUser = { ...values, name: "新成员", status: "邀请中" };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "邀请已发送",
      description: `已成功向 ${values.email} 发送邀请。`,
    });
  };

  const handleUpdateUser = (values: z.infer<typeof editUserSchema>) => {
    setUsers(prev => prev.map(u => u.email === values.email ? { ...u, ...values } : u));
    toast({
      title: "成员已更新",
      description: `成员 ${values.name} 的信息已更新。`,
    });
  };
  
  const handlePlaceholderClick = (title: string) => {
    toast({
      title: '功能待开发',
      description: `${title} 功能正在开发中。`
    });
  };
  
  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
        case "待支付":
            return "destructive";
        case "待平台确认":
            return "secondary";
        case "配置中":
            return "default";
        case "已完成":
            return "outline";
        case "已取消":
            return "destructive";
        default:
            return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold font-headline">企业仪表盘</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="overview"><Activity className="mr-2"/>概览</TabsTrigger>
                <TabsTrigger value="procurement"><ShoppingCart className="mr-2"/>集采市场</TabsTrigger>
                <TabsTrigger value="orders"><FileEdit className="mr-2"/>我的订单</TabsTrigger>
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
                                <LiveChatDialog />
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
                             <Card key={item.id} className="flex flex-col hover:shadow-md transition-shadow">
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
                                    <p className="text-sm font-semibold mt-2">¥{item.price} <span className="text-xs text-muted-foreground">/ {item.unit}</span></p>
                                </CardContent>
                                <CardFooter>
                                     <CreatePreOrderDialog 
                                        item={item} 
                                        onConfirm={(values) => handleCreatePreOrder(item, values)}
                                     />
                                </CardFooter>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
            
             <TabsContent value="orders" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>我的订单</CardTitle>
                        <CardDescription>查看和管理您的采购订单。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>订单号</TableHead>
                                    <TableHead>内容</TableHead>
                                    <TableHead>总金额</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>最后更新</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>
                                            {order.items.map(item => 
                                                <div key={item.id}>{item.title} (x{item.quantity})</div>
                                            )}
                                        </TableCell>
                                        <TableCell>¥{order.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{order.updatedAt}</TableCell>
                                        <TableCell className="text-right">
                                            {order.status === '待支付' ? (
                                                <Button size="sm" onClick={() => handlePayOrder(order.id)}>在线支付</Button>
                                            ) : (
                                                <ViewOrderDialog order={order} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            暂无订单。
                                        </TableCell>
                                    </TableRow>
                                )}
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
                                        <TableCell className="text-right">
                                            <EditUserDialog user={user} onUpdate={handleUpdateUser}>
                                                <Button variant="outline" size="sm">
                                                    <Pencil className="mr-2 h-3 w-3" />
                                                    编辑
                                                </Button>
                                            </EditUserDialog>
                                        </TableCell>
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

    