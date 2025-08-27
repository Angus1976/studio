

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Building, Code, ShieldCheck, User, BarChart3, PlusCircle, Pencil, Trash2, BrainCircuit, KeyRound, Package, FileText, LoaderCircle, ShoppingBag, BotMessageSquare, GraduationCap, CheckCircle, XCircle, Wand2, Power, PowerOff, Settings } from "lucide-react";
import { UsersRound } from "@/components/app/icons";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import type { Tenant, IndividualUser, Order, LlmConnection, TokenAllocation, SoftwareAsset, ProcurementItem, ExpertDomain, LlmProvider } from '@/lib/data-types';
import { 
    getTenantsAndUsers,
    saveTenant,
    deleteTenant,
    saveUser,
    deleteUser,
    getPlatformAssets,
    saveLlmConnection,
    deleteLlmConnection,
    testLlmConnection,
    saveTokenAllocation,
    deleteTokenAllocation,
    saveSoftwareAsset,
    deleteSoftwareAsset,
    getAllOrders,
    getProcurementItems,
    saveProcurementItem,
    deleteProcurementItem,
    getLlmProviders,
    saveLlmProvider,
    deleteLlmProvider
} from '@/ai/flows/admin-management-flows';
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";


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


// --- Asset Management ---
const llmProviderSchema = z.object({
  id: z.string().optional(),
  providerName: z.string().min(1, "厂商名称不能为空"),
  apiUrl: z.string().url("请输入有效的URL").optional().or(z.literal('')),
  apiKeyInstructions: z.string().min(1, "API Key 获取说明不能为空"),
  models: z.array(z.string()).min(1, "至少需要一个模型名称"),
});


const llmConnectionSchema = z.object({
  id: z.string().optional(),
  modelName: z.string().min(1, "模型名称不能为空"),
  provider: z.string().min(1, "提供商不能为空"),
  apiKey: z.string().min(1, "API Key不能为空"),
  type: z.enum(["通用", "专属"]),
  status: z.enum(["活跃", "已禁用"]),
  tenantId: z.string().optional(),
}).refine(data => data.type === '通用' || (data.type === '专属' && data.tenantId), {
    message: "专属连接必须指定租户ID",
    path: ["tenantId"],
});


const tokenSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, "Key不能为空"),
  assignedTo: z.string().min(1, "必须分配给一个租户或用户"),
  usageLimit: z.coerce.number().min(0, "用量限制不能为负"),
});


const softwareAssetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "资产名称不能为空"),
  licenseKey: z.string().optional(),
  type: z.string().min(1, "类型不能为空"),
});

const procurementItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "标题不能为空"),
  description: z.string().min(1, "描述不能为空"),
  icon: z.string().min(1, "必须选择一个图标"),
  tag: z.string().min(1, "标签不能为空"),
  price: z.coerce.number().min(0, "价格不能为负"),
  unit: z.string().min(1, "单位不能为空"),
  category: z.string().min(1, "分类不能为空"),
});

function ManageProvidersDialog({ onUpdate }: { onUpdate: () => void }) {
    const { toast } = useToast();
    const [providers, setProviders] = useState<LlmProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<z.infer<typeof llmProviderSchema>>({
        resolver: zodResolver(llmProviderSchema),
        defaultValues: { providerName: "", apiUrl: "", apiKeyInstructions: "", models: [] },
    });
    
    const fetchProviders = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedProviders = await getLlmProviders();
            setProviders(fetchedProviders);
        } catch(e: any) {
            toast({ title: "加载厂商预设失败", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const onSubmit = async (values: z.infer<typeof llmProviderSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await saveLlmProvider(values);
            if (result.success) {
                toast({ title: result.message });
                form.reset({ providerName: "", apiUrl: "", apiKeyInstructions: "", models: [] });
                await fetchProviders();
                onUpdate();
            } else {
                toast({ title: "保存失败", description: result.message, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "发生错误", description: e.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            const result = await deleteLlmProvider({ id });
            if (result.success) {
                toast({ title: result.message });
                await fetchProviders();
                onUpdate();
            } else {
                toast({ title: "删除失败", description: result.message, variant: "destructive" });
            }
        } catch(e: any) {
            toast({ title: "发生错误", description: e.message, variant: "destructive" });
        }
    };

    return (
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>管理LLM厂商预设</DialogTitle>
                <DialogDescription>
                    添加、编辑或删除平台预设的LLM厂商信息，方便快速添加新连接。
                </DialogDescription>
            </DialogHeader>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">现有厂商</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ScrollArea className="h-96">
                           {isLoading ? <LoaderCircle className="animate-spin" /> : (
                                <ul className="space-y-2">
                                    {providers.map(p => (
                                        <li key={p.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                            <span>{p.providerName}</span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                       </ScrollArea>
                    </CardContent>
                 </Card>
                  <Card>
                    <CardHeader>
                        <CardTitle className="text-base">添加新厂商</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                <FormField control={form.control} name="providerName" render={({field}) => (<FormItem><FormLabel>厂商名称</FormLabel><FormControl><Input placeholder="例如: OpenAI" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={form.control} name="apiUrl" render={({field}) => (<FormItem><FormLabel>API 地址</FormLabel><FormControl><Input placeholder="https://api.openai.com/v1" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={form.control} name="apiKeyInstructions" render={({field}) => (<FormItem><FormLabel>Key 获取说明</FormLabel><FormControl><Textarea placeholder="从官网控制台获取" {...field} rows={3}/></FormControl><FormMessage/></FormItem>)}/>
                                <FormField control={form.control} name="models" render={({field}) => (<FormItem><FormLabel>模型列表</FormLabel><FormControl><Input placeholder="模型名称,用逗号分隔" {...field} onChange={e => field.onChange(e.target.value.split(',').map(m => m.trim()))} /></FormControl><FormMessage/></FormItem>)}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
                                    添加厂商
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
             </div>
        </DialogContent>
    );
}

function AssetManagementDialog({ tenants, triggerButtonText, title }: { tenants: Tenant[], triggerButtonText: string, title: string }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [llmConnections, setLlmConnections] = useState<LlmConnection[]>([]);
    const [tokens, setTokens] = useState<TokenAllocation[]>([]);
    const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
    const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>([]);
    const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<LlmProvider | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState<Record<string, { status: 'loading' | 'success' | 'error', message: string }>>({});
    
    const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
    const [isManageProvidersOpen, setIsManageProvidersOpen] = useState(false);


    const fetchAssets = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [assets, items, providers] = await Promise.all([
                getPlatformAssets(),
                getProcurementItems(),
                getLlmProviders(),
            ]);
            setLlmConnections(assets.llmConnections);
            setTokens(assets.tokenAllocations);
            setSoftwareAssets(assets.softwareAssets);
            setProcurementItems(items);
            setLlmProviders(providers);
        } catch (error: any) {
            toast({ title: "加载资产失败", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    // --- Handlers for assets ---
    const handleSaveLlm = async (values: z.infer<typeof llmConnectionSchema>) => {
        setIsSubmitting(true);
        const result = await saveLlmConnection(values);
        if (result.success) toast({ title: "LLM连接已保存" }); else toast({ title: "保存失败", description: result.message, variant: "destructive" });
        await fetchAssets();
        setIsSubmitting(false);
    };
    const handleDeleteLlm = async (id: string) => {
        const result = await deleteLlmConnection({id});
        if (result.success) toast({ title: "LLM连接已删除" }); else toast({ title: "删除失败", description: result.message, variant: "destructive" });
        await fetchAssets();
    };

    const handleTestLlm = async (connection: LlmConnection) => {
        setTestResults(prev => ({...prev, [connection.id]: { status: 'loading', message: ''}}));
        const result = await testLlmConnection(connection);
        if (result.success) {
            setTestResults(prev => ({...prev, [connection.id]: { status: 'success', message: result.message }}));
            await fetchAssets();
        } else {
            setTestResults(prev => ({...prev, [connection.id]: { status: 'error', message: result.message }}));
        }
    };
    
    const handleSaveToken = async (values: z.infer<typeof tokenSchema>) => {
        const result = await saveTokenAllocation(values);
        if (result.success) toast({ title: "Token已分配" }); else toast({ title: "保存失败", description: result.message, variant: "destructive" });
        await fetchAssets();
    };
    const handleDeleteToken = async (id: string) => {
        const result = await deleteTokenAllocation({id});
        if (result.success) toast({ title: "Token已删除" }); else toast({ title: "删除失败", description: result.message, variant: "destructive" });
        await fetchAssets();
    };
    
    const handleSaveAsset = async (values: z.infer<typeof softwareAssetSchema>) => {
        const result = await saveSoftwareAsset(values);
        if (result.success) toast({ title: "软件资产已保存" }); else toast({ title: "保存失败", description: result.message, variant: "destructive" });
        await fetchAssets();
    };
    const handleDeleteAsset = async (id: string) => {
        const result = await deleteSoftwareAsset({id});
        if (result.success) toast({ title: "软件资产已删除" }); else toast({ title: "删除失败", description: result.message, variant: "destructive" });
        await fetchAssets();
    };
    
    const handleSaveProcurementItem = async (values: z.infer<typeof procurementItemSchema>) => {
        const result = await saveProcurementItem({id: editingItem?.id, ...values});
        if (result.success) {
            toast({ title: result.message });
            setEditingItem(null);
            await fetchAssets();
        } else {
            toast({ title: "保存失败", description: result.message, variant: "destructive" });
        }
    };

    const handleDeleteProcurementItem = async (id: string) => {
        const result = await deleteProcurementItem({id});
        if (result.success) {
            toast({ title: result.message });
            await fetchAssets();
        } else {
            toast({ title: "删除失败", description: result.message, variant: "destructive" });
        }
    }

    const LlmForm = () => {
        const form = useForm({ 
            resolver: zodResolver(llmConnectionSchema), 
            defaultValues: { modelName: "", provider: "", apiKey: "", type: "通用", tenantId: "", status: "活跃" }
        });
        const type = form.watch('type');
        const providerName = form.watch('provider');

        useEffect(() => {
            if (providerName) {
                const provider = llmProviders.find(p => p.providerName === providerName);
                setSelectedProvider(provider || null);
                if (provider?.models?.[0]) {
                    form.setValue('modelName', provider.models[0]);
                }
            } else {
                 setSelectedProvider(null);
            }
        }, [providerName, form]);

        const onSubmit = (values: z.infer<typeof llmConnectionSchema>) => {
            const finalValues = values.type === '通用' ? { ...values, tenantId: undefined } : values;
            handleSaveLlm(finalValues);
            form.reset({ modelName: "", provider: "", apiKey: "", type: "通用", tenantId: "", status: "活跃" });
            setSelectedProvider(null);
        };

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="flex items-end gap-2">
                        <FormField control={form.control} name="provider" render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>厂商/平台</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="选择一个预设厂商" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {llmProviders.map(p => <SelectItem key={p.id} value={p.providerName}>{p.providerName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                        <Dialog open={isManageProvidersOpen} onOpenChange={setIsManageProvidersOpen}>
                             <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="icon"><Settings className="h-4 w-4"/></Button>
                                </DialogTrigger>
                             </TooltipTrigger><TooltipContent><p>管理厂商预设</p></TooltipContent></Tooltip></TooltipProvider>
                             <ManageProvidersDialog onUpdate={fetchAssets} />
                        </Dialog>
                    </div>

                    {selectedProvider && (
                        <>
                            <FormField control={form.control} name="modelName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>模型名称</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="选择一个模型" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {selectedProvider.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="apiKey" render={({field}) => (
                                <FormItem>
                                    <FormLabel>API Key</FormLabel>
                                    <FormControl><Input placeholder="在此粘贴您的 API Key" {...field}/></FormControl>
                                    <FormDescription>{selectedProvider.apiKeyInstructions}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                        </>
                    )}
                    
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>类型</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="通用">通用 (所有租户)</SelectItem>
                                    <SelectItem value="专属">专属 (指定租户)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                     {type === '专属' && (
                        <FormField control={form.control} name="tenantId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>所属租户</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="选择一个租户..."/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.companyName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    )}
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                            <FormLabel>初始状态</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="活跃">活跃</SelectItem>
                                    <SelectItem value="已禁用">已禁用</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <Button type="submit" size="sm" className="w-full !mt-4" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="animate-spin mr-2 h-4 w-4"/>}
                        添加连接
                    </Button>
                </form>
            </Form>
        )
    };
    
     const TokenForm = () => {
        const form = useForm({ resolver: zodResolver(tokenSchema), defaultValues: {key: "", assignedTo: "", usageLimit: 0}});
        const onSubmit = (values: z.infer<typeof tokenSchema>) => {
            handleSaveToken(values);
            form.reset();
        };
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField control={form.control} name="key" render={({field}) => (<FormItem><FormControl><Input placeholder="Key (自动生成或手动输入)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="assignedTo" render={({field}) => (<FormItem><FormControl><Input placeholder="分配给 (租户ID或用户ID)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="usageLimit" render={({field}) => (<FormItem><FormControl><Input type="number" placeholder="用量限制" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full">分配 Token</Button>
                </form>
            </Form>
        )
    };
    
    const SoftwareAssetForm = () => {
        const form = useForm({ resolver: zodResolver(softwareAssetSchema), defaultValues: {name: "", type: "", licenseKey: ""}});
        const onSubmit = (values: z.infer<typeof softwareAssetSchema>) => {
            handleSaveAsset(values);
            form.reset();
        };
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField control={form.control} name="name" render={({field}) => (<FormItem><FormControl><Input placeholder="资产名称 (例如: RPA Pro License)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="type" render={({field}) => (<FormItem><FormControl><Input placeholder="类型 (例如: RPA许可)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="licenseKey" render={({field}) => (<FormItem><FormControl><Input placeholder="许可证密钥 (可选)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full">添加资产</Button>
                </form>
            </Form>
        )
    };
    
    const ProcurementItemForm = ({ item, onSubmit, onCancel }: { item?: ProcurementItem | null, onSubmit: (v: any) => void, onCancel: () => void}) => {
        const form = useForm({ 
            resolver: zodResolver(procurementItemSchema), 
            defaultValues: item || { title: "", description: "", icon: "", tag: "", price: 0, unit: "", category: "" }
        });
        React.useEffect(() => {
            form.reset(item || { title: "", description: "", icon: "", tag: "", price: 0, unit: "", category: "" });
        }, [item, form]);

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField control={form.control} name="title" render={({field}) => (<FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="description" render={({field}) => (<FormItem><FormLabel>描述</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="icon" render={({field}) => (<FormItem><FormLabel>图标 (Lucide)</FormLabel><FormControl><Input placeholder="e.g., Mail, Video" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="tag" render={({field}) => (<FormItem><FormLabel>标签</FormLabel><FormControl><Input placeholder="e.g., 办公基础" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="category" render={({field}) => (<FormItem><FormLabel>分类</FormLabel><FormControl><Input placeholder="e.g., 办公基础" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="price" render={({field}) => (<FormItem><FormLabel>价格</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="unit" render={({field}) => (<FormItem><FormLabel>单位</FormLabel><FormControl><Input placeholder="e.g., 用户/年" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                        <Button type="submit">保存商品</Button>
                    </div>
                </form>
            </Form>
        );
    };

    const getTestResultComponent = (id: string) => {
        const result = testResults[id];
        if (!result) return null;
        if (result.status === 'loading') {
            return <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground"/>
        }
        if (result.status === 'success') {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <CheckCircle className="h-4 w-4 text-green-500" />
                        </TooltipTrigger>
                         <TooltipContent>
                           <p className="max-w-xs">{result.message}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }
        if (result.status === 'error') {
            return (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <XCircle className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                         <TooltipContent side="left">
                           <p className="max-w-xs text-destructive">{result.message}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }
        return null;
    }


    return (
        <Dialog onOpenChange={(open) => { if (open) fetchAssets() }}>
            <DialogTrigger asChild><Button>{triggerButtonText}</Button></DialogTrigger>
            <DialogContent className="max-w-7xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        管理平台级的LLM，对接全球LLM及其不同版本，分配TOKEN KEY,统计分析用量、充值、控制盗用，其他各类软件资产及其许可管理。
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="llm" className="mt-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="llm"><BrainCircuit className="mr-2 h-4 w-4" />LLM 连接</TabsTrigger>
                        <TabsTrigger value="procurement"><ShoppingBag className="mr-2 h-4 w-4" />集采商品</TabsTrigger>
                        <TabsTrigger value="tokens"><KeyRound className="mr-2 h-4 w-4" />Token/用量</TabsTrigger>
                        <TabsTrigger value="software"><Package className="mr-2 h-4 w-4" />软件资产</TabsTrigger>
                    </TabsList>
                    <TabsContent value="llm">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="md:col-span-2">
                                 <Card>
                                    <CardHeader><CardTitle>已对接模型</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>状态</TableHead>
                                                    <TableHead>模型</TableHead>
                                                    <TableHead>提供商</TableHead>
                                                    <TableHead>类型</TableHead>
                                                    <TableHead>校验</TableHead>
                                                    <TableHead className="text-right">操作</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {isLoading ? (
                                                        <TableRow><TableCell colSpan={6} className="h-24 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                                    ) : llmConnections.map(model => (
                                                        <TableRow key={model.id}>
                                                            <TableCell>
                                                                <Switch 
                                                                    checked={model.status === '活跃'}
                                                                    onCheckedChange={(checked) => handleSaveLlm({...model, status: checked ? '活跃' : '已禁用'})}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium">{model.modelName}</TableCell>
                                                            <TableCell>{model.provider}</TableCell>
                                                            <TableCell><Badge variant={model.type === '通用' ? 'secondary' : 'outline'}>{model.type}</Badge></TableCell>
                                                            <TableCell className="flex items-center gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleTestLlm(model)} disabled={!!testResults[model.id] && testResults[model.id].status === 'loading'}>
                                                                    校验
                                                                </Button>
                                                                {getTestResultComponent(model.id)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteLlm(model.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive/80"/>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader><CardTitle>添加新连接</CardTitle></CardHeader>
                                    <CardContent><LlmForm /></CardContent>
                                </Card>
                            </div>
                       </div>
                    </TabsContent>
                    <TabsContent value="tokens">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader><CardTitle>已分配 Token</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>分配对象</TableHead><TableHead>用量 (已用/总量)</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {isLoading ? (
                                                        <TableRow><TableCell colSpan={3} className="h-24 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                                    ) : tokens.map(token => (
                                                        <TableRow key={token.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{token.assignedTo}</div>
                                                                <div className="text-xs text-muted-foreground">{token.key}</div>
                                                            </TableCell>
                                                            <TableCell>{token.used.toLocaleString()} / {token.usageLimit.toLocaleString()}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteToken(token.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive/80"/>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                             <div>
                                <Card>
                                    <CardHeader><CardTitle>分配新 Token</CardTitle></CardHeader>
                                    <CardContent><TokenForm /></CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="software">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader><CardTitle>软件资产列表</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[400px]">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>资产名称</TableHead><TableHead>类型</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                     {isLoading ? (
                                                        <TableRow><TableCell colSpan={3} className="h-24 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                                    ) : softwareAssets.map(asset => (
                                                        <TableRow key={asset.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{asset.name}</div>
                                                                <div className="text-xs text-muted-foreground">{asset.licenseKey}</div>
                                                            </TableCell>
                                                            <TableCell>{asset.type}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive/80"/>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                             <div>
                                <Card>
                                    <CardHeader><CardTitle>添加新资产</CardTitle></CardHeader>
                                    <CardContent><SoftwareAssetForm /></CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="procurement">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader><CardTitle>集采商品列表</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[450px]">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>商品</TableHead><TableHead>价格</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {isLoading ? <TableRow><TableCell colSpan={3} className="h-24 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                                    : procurementItems.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell><div className="font-medium">{item.title}</div><div className="text-xs text-muted-foreground">{item.category} / {item.tag}</div></TableCell>
                                                            <TableCell>¥{item.price} / {item.unit}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}><Pencil className="h-4 w-4"/></Button>
                                                                <Button variant="ghost" size="icon" className="text-destructive/80" onClick={() => handleDeleteProcurementItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{editingItem ? "编辑商品" : "添加新商品"}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[450px] p-1">
                                            <ProcurementItemForm item={editingItem} onSubmit={handleSaveProcurementItem} onCancel={() => setEditingItem(null)} />
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline">关闭</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Transaction Management ---
type OrderStatus = "待平台确认" | "待支付" | "配置中" | "已完成" | "已取消";


type OrderWithTenantInfo = Order & { tenantCompanyName?: string };

function TransactionManagementDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
    const [orders, setOrders] = useState<OrderWithTenantInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrders = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedOrders = await getAllOrders();
            setOrders(fetchedOrders);
        } catch (error: any) {
            toast({ title: "加载订单失败", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
        // SIMULATED API CALL to update status. In a real app, this would be a server flow.
        setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] } : order));
        toast({ title: "订单状态已更新", description: `订单 ${orderId} 的状态已更新为 ${newStatus}。` });
    };

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
        <Dialog onOpenChange={(open) => { if (open) fetchOrders() }}>
            <DialogTrigger asChild>
                <Button>{buttonText}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Card className="mt-4">
                    <CardHeader><CardTitle>所有订单</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[50vh]">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>订单号</TableHead>
                                        <TableHead>租户</TableHead>
                                        <TableHead>金额</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell>{order.tenantCompanyName || 'N/A'}</TableCell>
                                            <TableCell>¥{order.totalAmount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {order.status === '待平台确认' && (
                                                     <Button size="sm" onClick={() => handleUpdateStatus(order.id, '待支付')}>确认订单</Button>
                                                )}
                                                {order.status === '待支付' && (
                                                     <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(order.id, '配置中')}>确认收款</Button>
                                                )}
                                                {order.status === '配置中' && (
                                                     <Button size="sm" onClick={() => handleUpdateStatus(order.id, '已完成')}>完成配置</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline">关闭</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const kpiData = [
    { title: "总收入", value: "¥1,250,345", change: "+12.5%", icon: BarChart3 },
    { title: "活跃租户", value: "1,402", change: "+30", icon: Building },
    { title: "活跃工程师", value: "89", change: "+4", icon: Code },
    { title: "个人用户", value: "15,723", change: "+201", icon: User },
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
        description: "审核订单、确认支付并管理平台交易。",
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
                                    tenants={tenants}
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

    

    

    
