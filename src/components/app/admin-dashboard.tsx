

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Code, ShieldCheck, User, BarChart3, PlusCircle, Pencil, Trash2, BrainCircuit, KeyRound, Package, FileText, LoaderCircle, ShoppingBag, BotMessageSquare, GraduationCap } from "lucide-react";
import { UsersRound } from "@/components/app/icons";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import type { Tenant, IndividualUser } from '@/lib/data-types';
import { getTenantsAndUsers, saveTenant, deleteTenant, saveUser, deleteUser } from '@/ai/flows/admin-management-flows';


// --- Tenant Management ---

const tenantSchema = z.object({
  companyName: z.string().min(2, { message: "公司名称至少需要2个字符。" }),
  adminEmail: z.string().email({ message: "请输入有效的邮箱地址。" }),
  status: z.enum(["活跃", "待审核", "已禁用"]),
});

function TenantForm({ tenant, onSubmit, onCancel }: { tenant?: Tenant | null, onSubmit: (values: z.infer<typeof tenantSchema>) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof tenantSchema>>({
        resolver: zodResolver(tenantSchema),
        defaultValues: tenant ? {
            companyName: tenant.companyName,
            adminEmail: tenant.adminEmail,
            status: tenant.status,
        } : { companyName: "", adminEmail: "", status: "待审核" },
    });
     
    React.useEffect(() => {
        form.reset(tenant ? {
            companyName: tenant.companyName,
            adminEmail: tenant.adminEmail,
            status: tenant.status,
        } : { companyName: "", adminEmail: "", status: "待审核" });
    }, [tenant, form]);


    const handleSubmit = (values: z.infer<typeof tenantSchema>) => {
        onSubmit(values);
        form.reset();
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>公司名称</FormLabel>
                            <FormControl><Input placeholder="例如：未来动力公司" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>管理员邮箱</FormLabel>
                            <FormControl><Input placeholder="admin@company.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>状态</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="活跃">活跃</SelectItem>
                                    <SelectItem value="待审核">待审核</SelectItem>
                                    <SelectItem value="已禁用">已禁用</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                    <Button type="submit">保存</Button>
                </div>
            </form>
        </Form>
    );
}


function TenantManagementDialog({ tenants, setTenants, onRefresh, buttonText, title, description }: { tenants: Tenant[], setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>, onRefresh: () => Promise<void>, buttonText: string, title: string, description: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateTenant = async (values: z.infer<typeof tenantSchema>) => {
    setIsLoading(true);
    try {
        const result = await saveTenant({
            id: editingTenant?.id,
            ...values
        });
        if(result.success) {
            toast({ title: result.message });
            await onRefresh();
        } else {
            toast({ title: "操作失败", description: result.message, variant: "destructive" });
        }
    } catch(error: any) {
        toast({ title: "发生错误", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setEditingTenant(null);
        setIsFormOpen(false);
    }
  };
  
  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTenant(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (tenantId: string) => {
    setIsLoading(true);
    try {
        const result = await deleteTenant({ id: tenantId });
        if(result.success) {
            toast({ title: result.message });
            await onRefresh();
        } else {
             toast({ title: "删除失败", description: result.message, variant: "destructive" });
        }
    } catch(error: any) {
        toast({ title: "发生错误", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCancelForm = () => {
      setEditingTenant(null);
      setIsFormOpen(false);
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) handleCancelForm() }}>
        <DialogTrigger asChild>
            <Button>{buttonText}</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">租户列表</CardTitle>
                             <Button size="sm" onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> 添加新租户</Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>公司名称</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tenants.map(tenant => (
                                            <TableRow key={tenant.id}>
                                                <TableCell>
                                                    <div className="font-medium">{tenant.companyName}</div>
                                                    <div className="text-xs text-muted-foreground">{tenant.adminEmail}</div>
                                                </TableCell>
                                                <TableCell>
                                                     <Badge variant={tenant.status === '活跃' ? 'default' : tenant.status === '待审核' ? 'secondary' : 'destructive'}>
                                                        {tenant.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tenant)}><Pencil className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80" onClick={() => handleDelete(tenant.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <Card>
                         <CardHeader>
                            <CardTitle className="text-lg">{editingTenant ? '编辑租户' : (isFormOpen ? '添加新租户' : '管理')}</CardTitle>
                            <CardDescription>{editingTenant ? '修改租户信息。' : (isFormOpen ? '添加一个新企业到平台。' : '选择或添加租户')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isFormOpen ? (
                                <TenantForm 
                                    tenant={editingTenant} 
                                    onSubmit={handleAddOrUpdateTenant} 
                                    onCancel={handleCancelForm}
                                />
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-10 h-full flex items-center justify-center">
                                    <p>点击“添加新租户”或选择一个现有租户进行编辑。</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter className="mt-2">
                 <DialogClose asChild>
                    <Button variant="outline">关闭</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

// --- User Management ---

const userSchema = z.object({
  name: z.string().min(2, { message: "用户姓名至少需要2个字符。" }),
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  role: z.enum(["个人用户", "技术工程师", "租户管理员", "平台管理员"]),
  status: z.enum(["活跃", "待审核", "已禁用"]),
});

function UserForm({ user, onSubmit, onCancel }: { user?: IndividualUser | null, onSubmit: (values: z.infer<typeof userSchema>) => void; onCancel: () => void }) {
    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: user ? {
            name: user.name,
            email: user.email,
            role: user.role as any, // Cast because enum is restrictive
            status: user.status
        } : { name: "", email: "", role: "个人用户", status: "待审核" },
    });

    React.useEffect(() => {
        form.reset(user ? {
            name: user.name,
            email: user.email,
            role: user.role as any,
            status: user.status
        } : { name: "", email: "", role: "个人用户", status: "待审核" });
    }, [user, form]);


    const handleSubmit = (values: z.infer<typeof userSchema>) => {
        onSubmit(values);
        form.reset();
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>姓名</FormLabel>
                            <FormControl><Input placeholder="例如：张三" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>邮箱</FormLabel>
                            <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
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
                                    <SelectValue placeholder="选择角色" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="个人用户">个人用户</SelectItem>
                                    <SelectItem value="技术工程师">技术工程师</SelectItem>
                                    <SelectItem value="租户管理员">租户管理员</SelectItem>
                                    <SelectItem value="平台管理员">平台管理员</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>状态</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="活跃">活跃</SelectItem>
                                    <SelectItem value="待审核">待审核</SelectItem>
                                    <SelectItem value="已禁用">已禁用</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                    <Button type="submit">保存</Button>
                </div>
            </form>
        </Form>
    );
}

function UserManagementDialog({ users, onRefresh, buttonText, title, description }: { users: IndividualUser[], onRefresh: () => Promise<void>, buttonText: string, title: string, description: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<IndividualUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateUser = async (values: z.infer<typeof userSchema>) => {
    setIsLoading(true);
     try {
        const result = await saveUser({
            id: editingUser?.id,
            ...values,
            tenantId: editingUser?.tenantId || undefined, 
        });
        if(result.success) {
            toast({ title: result.message });
            await onRefresh();
        } else {
            toast({ title: "操作失败", description: result.message, variant: "destructive" });
        }
    } catch(error: any) {
        toast({ title: "发生错误", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setEditingUser(null);
        setIsFormOpen(false);
    }
  };
  
  const handleEdit = (user: IndividualUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    setIsLoading(true);
    try {
        const result = await deleteUser({ id: userId });
        if(result.success) {
            toast({ title: result.message });
            await onRefresh();
        } else {
             toast({ title: "删除失败", description: result.message, variant: "destructive" });
        }
    } catch(error: any) {
        toast({ title: "发生错误", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancelForm = () => {
      setEditingUser(null);
      setIsFormOpen(false);
  };
  
  return (
    <Dialog onOpenChange={(open) => { if (!open) handleCancelForm() }}>
        <DialogTrigger asChild>
            <Button>{buttonText}</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">用户列表</CardTitle>
                             <Button size="sm" onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> 添加新用户</Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>用户</TableHead>
                                            <TableHead>角色</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </TableCell>
                                                 <TableCell>{user.role}</TableCell>
                                                <TableCell>
                                                     <Badge variant={user.status === '活跃' ? 'default' : user.status === '待审核' ? 'secondary' : 'destructive'}>
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}><Pencil className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <Card>
                         <CardHeader>
                            <CardTitle className="text-lg">{editingUser ? '编辑用户' : (isFormOpen ? '添加新用户' : '管理')}</CardTitle>
                            <CardDescription>{editingUser ? '修改用户信息。' : (isFormOpen ? '添加一个新用户到平台。' : '选择或添加用户')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isFormOpen ? (
                                <UserForm user={editingUser} onSubmit={handleAddOrUpdateUser} onCancel={handleCancelForm} />
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-10 h-full flex items-center justify-center">
                                    <p>点击“添加新用户”或选择一个现有用户进行编辑。</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter className="mt-2">
                 <DialogClose asChild>
                    <Button variant="outline">关闭</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}


// --- Asset Management (placeholder for now) ---
function AssetManagementDialog({ triggerButtonText, title }: { triggerButtonText: string, title: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild><Button>{triggerButtonText}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        管理平台级的LLM，对接全球LLM及其不同版本，分配TOKEN KEY,统计分析用量、充值、控制盗用，其他各类软件资产及其许可管理。
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="llm" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="llm"><BrainCircuit className="mr-2 h-4 w-4" />LLM</TabsTrigger>
                        <TabsTrigger value="tokens"><KeyRound className="mr-2 h-4 w-4" />Token/用量</TabsTrigger>
                        <TabsTrigger value="software"><Package className="mr-2 h-4 w-4" />软件资产</TabsTrigger>
                    </TabsList>
                    <TabsContent value="llm">
                        <Card>
                            <CardHeader><CardTitle>LLM 对接</CardTitle></CardHeader>
                            <CardContent className="text-center text-muted-foreground p-8">此功能正在开发中。</CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="tokens">
                         <Card>
                            <CardHeader><CardTitle>Token/用量</CardTitle></CardHeader>
                            <CardContent className="text-center text-muted-foreground p-8">此功能正在开发中。</CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="software">
                         <Card>
                            <CardHeader><CardTitle>软件资产</CardTitle></CardHeader>
                            <CardContent className="text-center text-muted-foreground p-8">此功能正在开发中。</CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// --- Transaction Management (placeholder for now) ---
function TransactionManagementDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>{buttonText}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                 <div className="text-center text-muted-foreground p-8">此功能正在开发中。</div>
            </DialogContent>
        </Dialog>
    );
}

export function AdminDashboard() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<IndividualUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const { tenants: fetchedTenants, users: fetchedUsers } = await getTenantsAndUsers();
        setTenants(fetchedTenants);
        setUsers(fetchedUsers);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "数据加载失败",
            description: "无法从数据库获取管理员数据。",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const recentActivity = [...tenants, ...users]
    .sort((a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime())
    .slice(0, 5);

  const kpiData = [
    { title: "总收入", value: "¥1,250,345", change: "+12.5%", icon: BarChart3, isLoading: true },
    { title: "活跃租户", value: tenants.filter(t => t.status === '活跃').length, change: "+30", icon: Building, isLoading },
    { title: "活跃工程师", value: users.filter(u => u.role === '技术工程师' && u.status === '活跃').length, change: "+4", icon: Code, isLoading },
    { title: "个人用户", value: users.filter(u => u.role === '个人用户' && u.status === '活跃').length, change: "+201", icon: User, isLoading },
  ];

  const managementPanels = [
    { 
        id: "tenants",
        title: "多租户企业管理",
        description: "管理平台上的所有企业租户账户。",
        icon: Building,
        buttonText: "管理企业用户",
    },
    {
        id: "users",
        title: "用户与工程师管理",
        description: "查看和管理所有个人用户与技术工程师。",
        icon: User,
        buttonText: "管理个人用户",
    },
     {
        id: "transactions",
        title: "交易管理",
        description: "审核订单、管理集采商品。",
        icon: FileText,
        buttonText: "管理交易",
    },
    {
        id: "permissions",
        title: "权限与资产管理",
        description: "平台级权限分配，软件资源配置和管理。",
        icon: ShieldCheck,
        buttonText: "配置资产",
    }
];

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
                        {item.isLoading ? (
                            <>
                                <Skeleton className="h-8 w-3/4 mt-1" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
                                <p className="text-xs text-muted-foreground">{item.change} from last month</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Management Panels */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {managementPanels.map((panel) => (
                    <Card key={panel.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><panel.icon className="text-accent"/> {panel.title}</CardTitle>
                            <CardDescription>{panel.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            {panel.id === 'tenants' ? (
                                <TenantManagementDialog 
                                    tenants={tenants}
                                    setTenants={setTenants}
                                    onRefresh={fetchData}
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : panel.id === 'users' ? (
                                <UserManagementDialog 
                                    users={users}
                                    onRefresh={fetchData}
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : panel.id === 'transactions' ? (
                                <TransactionManagementDialog
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : (
                                <AssetManagementDialog
                                    triggerButtonText={panel.buttonText}
                                    title={panel.title}
                                />
                            )}
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
                       {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>名称</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>状态</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivity.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{'companyName' in item ? item.companyName : item.name}</TableCell>
                                        <TableCell>{'companyName' in item ? '企业租户' : item.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === '活跃' ? 'default' : item.status === '待审核' ? 'secondary' : 'destructive'}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}



