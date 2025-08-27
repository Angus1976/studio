

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Building, Code, ShieldCheck, User, BarChart3, PlusCircle, Pencil, Trash2, BrainCircuit, KeyRound, Package, FileText, LoaderCircle, ShoppingBag, BotMessageSquare, GraduationCap, LinkIcon, Edit, DatabaseZap, Star } from "lucide-react";
import { UsersRound } from "@/components/app/icons";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import type { Tenant, IndividualUser, LlmConnection, SoftwareAsset, Order, OrderStatus, LlmProvider } from '@/lib/data-types';
import { 
    getTenantsAndUsers, saveTenant, deleteTenant, saveUser, deleteUser,
    getPlatformAssets, saveLlmConnection, deleteLlmConnection, testLlmConnection, saveSoftwareAsset, deleteSoftwareAsset,
    getAllOrders, updateOrderStatus
} from '@/ai/flows/admin-management-flows';
import { Label } from "../ui/label";
import { DatabaseMaintenanceDialog } from "./database-maintenance-dialog";


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


function TenantManagementDialog({ open, onOpenChange, tenants, onRefresh, title, description }: { open: boolean, onOpenChange: (open: boolean) => void, tenants: Tenant[], onRefresh: () => Promise<void>, title: string, description: string }) {
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
  
   useEffect(() => {
    if (!open) {
      handleCancelForm();
    }
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

function UserManagementDialog({ open, onOpenChange, users, onRefresh, title, description }: { open: boolean, onOpenChange: (open: boolean) => void, users: IndividualUser[], onRefresh: () => Promise<void>, title: string, description: string }) {
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
  
  useEffect(() => {
    if (!open) {
      handleCancelForm();
    }
  }, [open]);

  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
    apiUrl: z.string().url("请输入有效的API URL"),
});

const llmConnectionSchema = z.object({
    id: z.string().optional(),
    modelName: z.string().min(1, "模型名称不能为空"),
    provider: z.string().min(1, "请选择一个厂商"),
    apiKey: z.string().min(10, "API Key不合法"),
    type: z.enum(["通用", "专属"]),
    status: z.enum(["活跃", "已禁用"]),
    priority: z.coerce.number().min(1).max(100).optional(),
});

function LlmConnectionForm({ connection, providers, onSubmit, onCancel }: { connection?: LlmConnection | null, providers: LlmProvider[], onSubmit: (values: z.infer<typeof llmConnectionSchema>) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof llmConnectionSchema>>({
        resolver: zodResolver(llmConnectionSchema),
        defaultValues: connection ? { ...connection, priority: connection.priority || 99 } : { modelName: "", provider: "", apiKey: "", type: "通用", status: "活跃", priority: 99 },
    });
    
    useEffect(() => {
        form.reset(connection ? { ...connection, priority: connection.priority || 99 } : { modelName: "", provider: "", apiKey: "", type: "通用", status: "活跃", priority: 99 });
    }, [connection, form]);
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>厂商/平台</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个厂商" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map(p => <SelectItem key={p.id} value={p.providerName}>{p.providerName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="modelName" render={({ field }) => (
                    <FormItem><FormLabel>模型名称</FormLabel><FormControl><Input placeholder="e.g., gemini-1.5-pro, deepseek-chat" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="apiKey" render={({ field }) => (
                    <FormItem><FormLabel>API Key</FormLabel><FormControl><Input type="password" placeholder="••••••••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>类型</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="通用">通用</SelectItem><SelectItem value="专属">专属</SelectItem></SelectContent>
                            </Select><FormMessage/>
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>状态</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="活跃">活跃</SelectItem><SelectItem value="已禁用">已禁用</SelectItem></SelectContent>
                            </Select><FormMessage/>
                        </FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem><FormLabel>优先级 (1-100, 数字越小优先级越高)</FormLabel><FormControl><Input type="number" placeholder="99" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                    <Button type="submit">保存连接</Button>
                </div>
            </form>
        </Form>
    );
}


const softwareAssetSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "资产名称至少2个字符"),
    type: z.string().min(2, "资产类型至少2个字符"),
    licenseKey: z.string().optional(),
});

function SoftwareAssetForm({ asset, onSubmit, onCancel }: { asset?: SoftwareAsset | null, onSubmit: (values: z.infer<typeof softwareAssetSchema>) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof softwareAssetSchema>>({
        resolver: zodResolver(softwareAssetSchema),
        defaultValues: asset || { name: "", type: "", licenseKey: "" },
    });
    
    useEffect(() => {
        form.reset(asset || { name: "", type: "", licenseKey: "" });
    }, [asset, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>资产名称</FormLabel><FormControl><Input placeholder="e.g., RPA Bot License" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>资产类型</FormLabel><FormControl><Input placeholder="e.g., RPA, Data Analytics" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="licenseKey" render={({ field }) => (
                    <FormItem><FormLabel>许可证密钥 (可选)</FormLabel><FormControl><Input type="password" placeholder="••••••••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                    <Button type="submit">保存资产</Button>
                </div>
            </form>
        </Form>
    );
}

function AssetManagementDialog({ open, onOpenChange, title }: { open: boolean, onOpenChange: (open: boolean) => void, title: string }) {
    const { toast } = useToast();

    const [llmConnections, setLlmConnections] = useState<LlmConnection[]>([]);
    const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([]);
    const [editingLlmConnection, setEditingLlmConnection] = useState<LlmConnection | null>(null);
    const [isLlmFormOpen, setIsLlmFormOpen] = useState(false);
    const [isLlmLoading, setIsLlmLoading] = useState(true);

    const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
    const [editingSoftwareAsset, setEditingSoftwareAsset] = useState<SoftwareAsset | null>(null);
    const [isSoftwareFormOpen, setIsSoftwareFormOpen] = useState(false);
    const [isSoftwareLoading, setIsSoftwareLoading] = useState(true);


    const fetchData = useCallback(async () => {
        setIsLlmLoading(true);
        setIsSoftwareLoading(true);
        try {
            const { llmConnections, softwareAssets, llmProviders } = await getPlatformAssets();
            setLlmConnections(llmConnections);
            setSoftwareAssets(softwareAssets);
            setLlmProviders(llmProviders);
        } catch (error: any) {
            toast({ variant: "destructive", title: "资产加载失败", description: error.message });
        } finally {
            setIsLlmLoading(false);
            setIsSoftwareLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (open) {
            fetchData();
        } else {
            setIsLlmFormOpen(false);
            setEditingLlmConnection(null);
            setIsSoftwareFormOpen(false);
            setEditingSoftwareAsset(null);
        }
    }, [open, fetchData]);

    // LLM Handlers
    const handleSaveLlmConnection = async (values: z.infer<typeof llmConnectionSchema>) => {
        try {
            const result = await saveLlmConnection({ ...values, id: editingLlmConnection?.id });
            if(result.success) {
                toast({ title: result.message });
                setIsLlmFormOpen(false);
                setEditingLlmConnection(null);
                fetchData();
            } else {
                toast({ variant: "destructive", title: "保存失败", description: result.message });
            }
        } catch(e: any) {
             toast({ variant: "destructive", title: "发生错误", description: e.message });
        }
    };
    
    const handleDeleteLlmConnection = async (id: string) => {
        try {
            await deleteLlmConnection({id});
            toast({ title: "LLM 连接已删除" });
            fetchData();
        } catch(e: any) {
            toast({ variant: "destructive", title: "删除失败", description: e.message });
        }
    };

    const handleTestConnection = async (id: string) => {
        toast({ title: "正在测试连接..." });
        try {
            const result = await testLlmConnection({ id });
            toast({
                title: result.success ? "连接成功" : "连接失败",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "测试时发生错误", description: error.message });
        }
    };

    // Software Asset Handlers
    const handleSaveSoftwareAsset = async (values: z.infer<typeof softwareAssetSchema>) => {
        try {
            const result = await saveSoftwareAsset({ ...values, id: editingSoftwareAsset?.id });
            if(result.success) {
                toast({ title: result.message });
                setIsSoftwareFormOpen(false);
                setEditingSoftwareAsset(null);
                fetchData();
            } else {
                toast({ variant: "destructive", title: "保存失败", description: result.message });
            }
        } catch(e: any) {
             toast({ variant: "destructive", title: "发生错误", description: e.message });
        }
    };

    const handleDeleteSoftwareAsset = async (id: string) => {
        try {
            await deleteSoftwareAsset({id});
            toast({ title: "软件资产已删除" });
            fetchData();
        } catch(e: any) {
            toast({ variant: "destructive", title: "删除失败", description: e.message });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        管理平台级的LLM，对接全球LLM及其不同版本，分配TOKEN KEY,统计分析用量、充值、控制盗用，其他各类软件资产及其许可管理。
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="llm" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="llm"><BrainCircuit className="mr-2 h-4 w-4" />LLM 对接</TabsTrigger>
                        <TabsTrigger value="software"><Package className="mr-2 h-4 w-4" />软件资产</TabsTrigger>
                        <TabsTrigger value="tokens"><KeyRound className="mr-2 h-4 w-4" />Token/用量</TabsTrigger>
                    </TabsList>
                    <TabsContent value="llm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg">已配置模型</CardTitle><Button size="sm" onClick={() => { setEditingLlmConnection(null); setIsLlmFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>添加新连接</Button></CardHeader>
                                    <CardContent><ScrollArea className="h-[400px]">
                                        {isLlmLoading ? <Skeleton className="h-full w-full"/> : <Table>
                                            <TableHeader><TableRow><TableHead>模型</TableHead><TableHead>优先级</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {llmConnections.map(c => <TableRow key={c.id}>
                                                    <TableCell><div className="font-medium">{c.modelName}</div><div className="text-xs text-muted-foreground">{c.provider}</div></TableCell>
                                                    <TableCell><Badge variant="outline" className="flex items-center gap-1 w-fit"><Star className="h-3 w-3"/>{c.priority || 'N/A'}</Badge></TableCell>
                                                    <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                                                    <TableCell><Badge variant={c.status === '活跃' ? 'default' : 'destructive'}>{c.status}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTestConnection(c.id)}><LinkIcon className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLlmConnection(c); setIsLlmFormOpen(true);}}><Pencil className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80" onClick={() => handleDeleteLlmConnection(c.id)}><Trash2 className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>)}
                                            </TableBody>
                                        </Table>}
                                        </ScrollArea></CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-1"><Card>
                                <CardHeader><CardTitle className="text-lg">{editingLlmConnection ? '编辑连接' : isLlmFormOpen ? '添加新连接' : '管理'}</CardTitle></CardHeader>
                                <CardContent>
                                    {isLlmFormOpen ? <LlmConnectionForm connection={editingLlmConnection} providers={llmProviders} onSubmit={handleSaveLlmConnection} onCancel={() => setIsLlmFormOpen(false)} /> : <div className="text-center text-sm text-muted-foreground py-10">选择一个连接或添加新连接。</div>}
                                </CardContent>
                            </Card></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="software">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg">已配置软件资产</CardTitle><Button size="sm" onClick={() => { setEditingSoftwareAsset(null); setIsSoftwareFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>添加新资产</Button></CardHeader>
                                    <CardContent><ScrollArea className="h-[400px]">
                                        {isSoftwareLoading ? <Skeleton className="h-full w-full"/> : <Table>
                                            <TableHeader><TableRow><TableHead>资产名称</TableHead><TableHead>类型</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {softwareAssets.map(s => <TableRow key={s.id}>
                                                    <TableCell>{s.name}</TableCell>
                                                    <TableCell>{s.type}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSoftwareAsset(s); setIsSoftwareFormOpen(true);}}><Pencil className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80" onClick={() => handleDeleteSoftwareAsset(s.id)}><Trash2 className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>)}
                                            </TableBody>
                                        </Table>}
                                        </ScrollArea></CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-1"><Card>
                                <CardHeader><CardTitle className="text-lg">{editingSoftwareAsset ? '编辑资产' : isSoftwareFormOpen ? '添加新资产' : '管理'}</CardTitle></CardHeader>
                                <CardContent>
                                    {isSoftwareFormOpen ? <SoftwareAssetForm asset={editingSoftwareAsset} onSubmit={handleSaveSoftwareAsset} onCancel={() => setIsSoftwareFormOpen(false)} /> : <div className="text-center text-sm text-muted-foreground py-10">选择一个资产或添加新资产。</div>}
                                </CardContent>
                            </Card></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="tokens">
                        <Card>
                            <CardHeader><CardTitle>Token/用量</CardTitle></CardHeader>
                            <CardContent className="text-center text-muted-foreground p-8">此功能正在开发中。</CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="mt-4">
                    <DialogClose asChild><Button variant="outline">关闭</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Transaction Management (placeholder for now) ---
function AuditOrderDialog({ order, onUpdate, children }: { order: Order; onUpdate: () => void; children: React.ReactNode }) {
    const { toast } = useToast();
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleStatusUpdate = async () => {
        setIsSubmitting(true);
        try {
            const result = await updateOrderStatus({ orderId: order.id, status });
            if (result.success) {
                toast({ title: "订单状态已更新" });
                onUpdate();
                setOpen(false);
            } else {
                toast({ title: "更新失败", description: result.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "发生错误", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>审核订单: {order.id}</DialogTitle>
                    <DialogDescription>
                        查看订单详情并更新订单状态。
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p><strong>客户:</strong> {order.tenantName}</p>
                    <p><strong>总金额:</strong> ¥{order.totalAmount.toFixed(2)}</p>
                    <p><strong>订单内容:</strong></p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {order.items.map((item, index) => <li key={index}>{item.title} (x{item.quantity})</li>)}
                    </ul>
                     <div className="space-y-2">
                        <Label htmlFor="order-status">订单状态</Label>
                        <Select value={status} onValueChange={(value: OrderStatus) => setStatus(value)}>
                            <SelectTrigger id="order-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="待平台确认">待平台确认</SelectItem>
                                <SelectItem value="待支付">待支付</SelectItem>
                                <SelectItem value="配置中">配置中</SelectItem>
                                <SelectItem value="已完成">已完成</SelectItem>
                                <SelectItem value="已取消">已取消</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">取消</Button></DialogClose>
                    <Button onClick={handleStatusUpdate} disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                        更新状态
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TransactionManagementDialog({ open, onOpenChange, title, description }: {  open: boolean, onOpenChange: (open: boolean) => void, title: string, description: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrders = useCallback(async () => {
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

    useEffect(() => {
        if (open) {
            fetchOrders();
        }
    }, [open, fetchOrders]);
    
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Card>
                    <CardContent className="mt-6">
                        <ScrollArea className="h-[60vh]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>订单号</TableHead>
                                            <TableHead>企业</TableHead>
                                            <TableHead>金额</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead>创建时间</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                                <TableCell>{order.tenantName}</TableCell>
                                                <TableCell>¥{order.totalAmount.toFixed(2)}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                                <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <AuditOrderDialog order={order} onUpdate={fetchOrders}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-3 w-3 mr-1.5" />
                                                            审核
                                                        </Button>
                                                    </AuditOrderDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}

export function AdminDashboard() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<IndividualUser[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);


  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const { tenants: fetchedTenants, users: fetchedUsers, totalRevenue: fetchedRevenue } = await getTenantsAndUsers();
        setTenants(fetchedTenants);
        setUsers(fetchedUsers);
        setTotalRevenue(fetchedRevenue);
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
    { id: "revenue", title: "总收入", value: `¥${totalRevenue.toLocaleString()}`, icon: BarChart3, onClick: () => setIsTransactionDialogOpen(true) },
    { id: "tenants", title: "活跃租户", value: tenants.filter(t => t.status === '活跃').length, icon: Building, onClick: () => setIsTenantDialogOpen(true) },
    { id: "engineers", title: "活跃工程师", value: users.filter(u => u.role === '技术工程师' && u.status === '活跃').length, icon: Code, onClick: () => setIsUserDialogOpen(true) },
    { id: "users", title: "个人用户", value: users.filter(u => u.role === '个人用户' && u.status === '活跃').length, icon: User, onClick: () => setIsUserDialogOpen(true) },
  ];


  const managementPanels = [
    { 
        id: "tenants",
        title: "多租户企业管理",
        description: "管理平台上的所有企业租户账户。",
        icon: Building,
        buttonText: "管理企业用户",
        onClick: () => setIsTenantDialogOpen(true),
    },
    {
        id: "users",
        title: "用户与工程师管理",
        description: "查看和管理所有个人用户与技术工程师。",
        icon: User,
        buttonText: "管理个人用户",
        onClick: () => setIsUserDialogOpen(true),
    },
     {
        id: "transactions",
        title: "交易管理",
        description: "审核订单、管理集采商品。",
        icon: FileText,
        buttonText: "管理交易",
        onClick: () => setIsTransactionDialogOpen(true),
    },
    {
        id: "permissions",
        title: "权限与资产管理",
        description: "平台级权限分配，软件资源配置和管理。",
        icon: ShieldCheck,
        buttonText: "配置资产",
        onClick: () => setIsAssetDialogOpen(true),
    },
    {
        id: "maintenance",
        title: "数据库维护",
        description: "检查数据一致性、清理无效数据、执行备份。",
        icon: DatabaseZap,
        buttonText: "开始维护",
    }
];

  return (
    <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto h-full overflow-y-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold font-headline">管理员仪表盘</h1>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((item) => (
                <Card key={item.id} onClick={item.onClick} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-3/4 mt-1" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Management Panels */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 {managementPanels.map((panel) => (
                    <Card key={panel.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><panel.icon className="text-accent"/> {panel.title}</CardTitle>
                            <CardDescription>{panel.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            {panel.id === 'maintenance' ? (
                                <DatabaseMaintenanceDialog
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : (
                                <Button onClick={panel.onClick}>{panel.buttonText}</Button>
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
        
        <TenantManagementDialog
            open={isTenantDialogOpen}
            onOpenChange={setIsTenantDialogOpen}
            tenants={tenants}
            onRefresh={fetchData}
            title="多租户企业管理"
            description="管理平台上的所有企业租户账户。"
        />
         <UserManagementDialog
            open={isUserDialogOpen}
            onOpenChange={setIsUserDialogOpen}
            users={users}
            onRefresh={fetchData}
            title="用户与工程师管理"
            description="查看和管理所有个人用户与技术工程师。"
        />
        <TransactionManagementDialog
            open={isTransactionDialogOpen}
            onOpenChange={setIsTransactionDialogOpen}
            title="交易管理"
            description="审核订单、管理集采商品。"
        />
        <AssetManagementDialog
            open={isAssetDialogOpen}
            onOpenChange={setIsAssetDialogOpen}
            title="权限与资产管理"
        />

    </div>
  );
}
