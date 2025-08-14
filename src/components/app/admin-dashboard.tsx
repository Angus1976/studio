
"use client";

import React, { useState } from "react";
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
import { Building, Code, ShieldCheck, User, BarChart3, PlusCircle, Pencil, Trash2, BrainCircuit, KeyRound, Package, FileText } from "lucide-react";
import { UsersRound } from "@/components/app/icons";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";


// --- Tenant Management ---

const tenantSchema = z.object({
  companyName: z.string().min(2, { message: "公司名称至少需要2个字符。" }),
  adminEmail: z.string().email({ message: "请输入有效的邮箱地址。" }),
  status: z.enum(["活跃", "待审核", "已禁用"]),
});

type Tenant = z.infer<typeof tenantSchema> & {
  id: string;
  registeredDate: string;
};

const initialTenants: Tenant[] = [
    { id: "tenant-1", companyName: "Tech Innovators Inc.", adminEmail: "admin@techinnovators.com", registeredDate: "2024-07-20", status: "活跃" },
    { id: "tenant-2", companyName: "A.I. Solutions Ltd.", adminEmail: "contact@aisolutions.com", registeredDate: "2024-07-18", status: "已禁用" },
    { id: "tenant-3", companyName: "Future Dynamics", adminEmail: "ceo@futuredynamics.io", registeredDate: "2024-07-15", status: "待审核" },
];

function TenantForm({ tenant, onSubmit, onCancel }: { tenant?: Tenant | null, onSubmit: (values: z.infer<typeof tenantSchema>) => void, onCancel: () => void }) {
    const form = useForm<z.infer<typeof tenantSchema>>({
        resolver: zodResolver(tenantSchema),
        defaultValues: tenant || { companyName: "", adminEmail: "", status: "待审核" },
    });
     
    React.useEffect(() => {
        form.reset(tenant || { companyName: "", adminEmail: "", status: "待审核" });
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


function TenantManagementDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateTenant = (values: z.infer<typeof tenantSchema>) => {
    if (editingTenant) {
      // Update
      const updatedTenants = tenants.map(t => t.id === editingTenant.id ? { ...t, ...values } : t);
      setTenants(updatedTenants);
      toast({ title: "租户已更新", description: `${values.companyName} 的信息已更新。` });
    } else {
      // Add
      const newTenant: Tenant = {
        ...values,
        id: `tenant-${Date.now()}`,
        registeredDate: new Date().toISOString().split('T')[0],
      };
      setTenants([...tenants, newTenant]);
      toast({ title: "租户已添加", description: `${values.companyName} 已成功添加到平台。` });
    }
    setEditingTenant(null);
    setIsFormOpen(false);
  };
  
  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTenant(null);
    setIsFormOpen(true);
  };

  const handleDelete = (tenantId: string) => {
    setTenants(tenants.filter(t => t.id !== tenantId));
    toast({ title: "租户已删除", variant: "destructive" });
  };
  
  const handleCancelForm = () => {
      setEditingTenant(null);
      setIsFormOpen(false);
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) handleCancelForm(); }}>
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
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    <p>点击“添加新租户”或选择一个现有租户进行编辑。</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter>
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
  role: z.enum(["个人用户", "技术工程师"]),
  status: z.enum(["活跃", "待审核", "已禁用"]),
});

type IndividualUser = z.infer<typeof userSchema> & {
  id: string;
  registeredDate: string;
};

const initialUsers: IndividualUser[] = [
    { id: "user-1", name: "李四", email: "lisi@example.com", registeredDate: "2024-07-21", role: "个人用户", status: "活跃" },
    { id: "user-2", name: "王五", email: "wangwu@example.com", registeredDate: "2024-07-20", role: "技术工程师", status: "待审核" },
    { id: "user-3", name: "赵六", email: "zhaoliu@example.com", registeredDate: "2024-07-19", role: "个人用户", status: "已禁用" },
];

function UserForm({ user, onSubmit, onCancel }: { user?: IndividualUser | null, onSubmit: (values: z.infer<typeof userSchema>) => void; onCancel: () => void }) {
    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: user || { name: "", email: "", role: "个人用户", status: "待审核" },
    });

    React.useEffect(() => {
        form.reset(user || { name: "", email: "", role: "个人用户", status: "待审核" });
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

function UserManagementDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
  const [users, setUsers] = useState<IndividualUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<IndividualUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleAddOrUpdateUser = (values: z.infer<typeof userSchema>) => {
    if (editingUser) {
      // Update
      const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...values } : u);
      setUsers(updatedUsers);
      toast({ title: "用户已更新", description: `${values.name} 的信息已更新。` });
    } else {
      // Add
      const newUser: IndividualUser = {
        ...values,
        id: `user-${Date.now()}`,
        registeredDate: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
      toast({ title: "用户已添加", description: `${values.name} 已成功添加到平台。` });
    }
    setEditingUser(null);
    setIsFormOpen(false);
  };
  
  const handleEdit = (user: IndividualUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: "用户已删除", variant: "destructive" });
  };

  const handleCancelForm = () => {
      setEditingUser(null);
      setIsFormOpen(false);
  };
  
  return (
    <Dialog onOpenChange={(open) => { if (!open) handleCancelForm(); }}>
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
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    <p>点击“添加新用户”或选择一个现有用户进行编辑。</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline">关闭</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}


// --- Asset Management ---
const llmModelSchema = z.object({
  modelName: z.string().min(1, "模型名称不能为空"),
  apiKey: z.string().min(1, "API Key不能为空"),
  provider: z.string().min(1, "提供商不能为空"),
});
type LlmModel = z.infer<typeof llmModelSchema> & { id: string };

const tokenSchema = z.object({
  assignedTo: z.string().min(1, "必须分配给一个租户或用户"),
  usageLimit: z.coerce.number().min(0, "用量限制不能为负"),
});
type Token = z.infer<typeof tokenSchema> & { id: string; key: string; used: number };

const softwareAssetSchema = z.object({
  name: z.string().min(1, "资产名称不能为空"),
  licenseKey: z.string().optional(),
  type: z.string().min(1, "类型不能为空"),
});
type SoftwareAsset = z.infer<typeof softwareAssetSchema> & { id: string };


const initialLlmModels: LlmModel[] = [
  { id: 'llm-1', modelName: 'Gemini 1.5 Pro', provider: 'Google', apiKey: 'sk-...' },
  { id: 'llm-2', modelName: 'GPT-4o', provider: 'OpenAI', apiKey: 'sk-...' },
];

const initialTokens: Token[] = [
  { id: 'token-1', key: 'key-abc-123', assignedTo: 'Tech Innovators Inc.', usageLimit: 1000000, used: 250000 },
  { id: 'token-2', key: 'key-def-456', assignedTo: 'Future Dynamics', usageLimit: 500000, used: 480000 },
];

const initialSoftwareAssets: SoftwareAsset[] = [
  { id: 'asset-1', name: 'RPA Pro License', type: 'RPA许可', licenseKey: 'RPA-XYZ-123' },
  { id: 'asset-2', name: 'Data Analytics Suite', type: '数据服务', licenseKey: 'DATA-ABC-789' },
];

function AssetManagementDialog({ triggerButtonText, title }: { triggerButtonText: string, title: string }) {
    const { toast } = useToast();
    const [llmModels, setLlmModels] = useState(initialLlmModels);
    const [tokens, setTokens] = useState(initialTokens);
    const [softwareAssets, setSoftwareAssets] = useState(initialSoftwareAssets);

    const handleDelete = (type: 'llm' | 'token' | 'asset', id: string) => {
        if (type === 'llm') setLlmModels(prev => prev.filter(item => item.id !== id));
        if (type === 'token') setTokens(prev => prev.filter(item => item.id !== id));
        if (type === 'asset') setSoftwareAssets(prev => prev.filter(item => item.id !== id));
        toast({ title: '资产已删除', variant: 'destructive' });
    };
    
    // Placeholder forms and handlers for adding new items
    const LlmForm = () => {
        const form = useForm({ resolver: zodResolver(llmModelSchema), defaultValues: {modelName: "", provider: "", apiKey: ""}});
        const onSubmit = (data: z.infer<typeof llmModelSchema>) => {
            setLlmModels(prev => [...prev, {...data, id: `llm-${Date.now()}`}]);
            toast({title: "LLM 模型已添加"});
            form.reset();
        };
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField control={form.control} name="modelName" render={({field}) => (<FormItem><FormControl><Input placeholder="模型名称" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="provider" render={({field}) => (<FormItem><FormControl><Input placeholder="提供商" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="apiKey" render={({field}) => (<FormItem><FormControl><Input placeholder="API Key" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full">添加模型</Button>
                </form>
            </Form>
        )
    };
    
     const TokenForm = () => {
        const form = useForm({ resolver: zodResolver(tokenSchema), defaultValues: {assignedTo: "", usageLimit: 0}});
        const onSubmit = (data: z.infer<typeof tokenSchema>) => {
            setTokens(prev => [...prev, {...data, id: `token-${Date.now()}`, used: 0, key: `key-gen-${Date.now()}`}]);
            toast({title: "Token 已分配"});
            form.reset();
        };
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField control={form.control} name="assignedTo" render={({field}) => (<FormItem><FormControl><Input placeholder="分配给 (租户或用户)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="usageLimit" render={({field}) => (<FormItem><FormControl><Input type="number" placeholder="用量限制" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full">分配 Token</Button>
                </form>
            </Form>
        )
    };
    
    const SoftwareAssetForm = () => {
        const form = useForm({ resolver: zodResolver(softwareAssetSchema), defaultValues: {name: "", type: "", licenseKey: ""}});
        const onSubmit = (data: z.infer<typeof softwareAssetSchema>) => {
            setSoftwareAssets(prev => [...prev, {...data, id: `asset-${Date.now()}`}]);
            toast({title: "软件资产已添加"});
            form.reset();
        };
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField control={form.control} name="name" render={({field}) => (<FormItem><FormControl><Input placeholder="资产名称" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="type" render={({field}) => (<FormItem><FormControl><Input placeholder="类型" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="licenseKey" render={({field}) => (<FormItem><FormControl><Input placeholder="许可证密钥 (可选)" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full">添加资产</Button>
                </form>
            </Form>
        )
    };


    return (
        <Dialog>
            <DialogTrigger asChild><Button>{triggerButtonText}</Button></DialogTrigger>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        管理平台级的LLM，对接全球LLM及其不同版本，分配TOKEN KEY,统计分析用量、充值、控制盗用，其他各类软件资产及其许可管理。
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="llm" className="mt-4">
                    <TabsList>
                        <TabsTrigger value="llm"><BrainCircuit className="mr-2 h-4 w-4" />LLM 模型管理</TabsTrigger>
                        <TabsTrigger value="tokens"><KeyRound className="mr-2 h-4 w-4" />Token/用量分配</TabsTrigger>
                        <TabsTrigger value="software"><Package className="mr-2 h-4 w-4" />软件资产</TabsTrigger>
                    </TabsList>
                    <TabsContent value="llm">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div className="md:col-span-2">
                                 <Card>
                                    <CardHeader><CardTitle>已对接模型</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>模型</TableHead><TableHead>提供商</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {llmModels.map(model => (
                                                    <TableRow key={model.id}>
                                                        <TableCell className="font-medium">{model.modelName}</TableCell>
                                                        <TableCell>{model.provider}</TableCell>
                                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete('llm', model.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card>
                                    <CardHeader><CardTitle>添加新模型</CardTitle></CardHeader>
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
                                         <Table>
                                            <TableHeader><TableRow><TableHead>分配对象</TableHead><TableHead>用量 (已用/总量)</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {tokens.map(token => (
                                                    <TableRow key={token.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{token.assignedTo}</div>
                                                            <div className="text-xs text-muted-foreground">{token.key}</div>
                                                        </TableCell>
                                                        <TableCell>{token.used.toLocaleString()} / {token.usageLimit.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete('token', token.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
                                         <Table>
                                            <TableHeader><TableRow><TableHead>资产名称</TableHead><TableHead>类型</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {softwareAssets.map(asset => (
                                                    <TableRow key={asset.id}>
                                                        <TableCell>
                                                             <div className="font-medium">{asset.name}</div>
                                                            <div className="text-xs text-muted-foreground">{asset.licenseKey}</div>
                                                        </TableCell>
                                                        <TableCell>{asset.type}</TableCell>
                                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete('asset', asset.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
type Order = {
    id: string;
    tenantName: string;
    items: { title: string; quantity: number }[];
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
};

const initialOrders: Order[] = [
    {
        id: "PO-12345",
        tenantName: "Tech Innovators Inc.",
        items: [{ title: "企业邮箱服务", quantity: 10 }],
        totalAmount: 500,
        status: "待平台确认",
        createdAt: "2024-07-25",
    },
    {
        id: "PO-12346",
        tenantName: "Future Dynamics",
        items: [{ title: "LLM Token 包", quantity: 5 }],
        totalAmount: 500,
        status: "待支付",
        createdAt: "2024-07-24",
    },
     {
        id: "PO-12347",
        tenantName: "Tech Innovators Inc.",
        items: [{ title: "RPA 流程设计", quantity: 1 }],
        totalAmount: 10000,
        status: "已完成",
        createdAt: "2024-07-20",
    }
];

function TransactionManagementDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const { toast } = useToast();

    const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
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
        <Dialog>
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
                                            <TableCell>{order.tenantName}</TableCell>
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

const recentUsers = [
    { name: "Tech Innovators Inc.", role: "企业租户", date: "2024-07-20", status: "活跃" },
    { name: "张三", role: "技术工程师", date: "2024-07-19", status: "待审核" },
    { name: "李四", role: "个人用户", date: "2024-07-19", status: "活跃" },
    { name: "A.I. Solutions Ltd.", role: "企业租户", date: "2024-07-18", status: "已禁用" },
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
        title: "个人用户管理",
        description: "查看和管理所有个人用户和技术工程师账户。",
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
        description: "平台级权限分配，软件资源配置和管理",
        icon: ShieldCheck,
        buttonText: "配置权限",
    }
];

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
                 {managementPanels.map((panel) => (
                    <Card key={panel.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><panel.icon className="text-accent"/> {panel.title}</CardTitle>
                            <CardDescription>{panel.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {/* Content can be added here if needed */}
                        </CardContent>
                        <CardFooter>
                            {panel.id === 'tenants' ? (
                                <TenantManagementDialog 
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : panel.id === 'users' ? (
                                <UserManagementDialog 
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
