
"use client";

import { useState } from "react";
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
import { Building, Code, ShieldCheck, User, BarChart3, AlertTriangle, Info, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { UsersRound } from "@/components/app/icons";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";


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

function TenantForm({ tenant, onSubmit }: { tenant?: Tenant | null, onSubmit: (values: z.infer<typeof tenantSchema>) => void }) {
    const form = useForm<z.infer<typeof tenantSchema>>({
        resolver: zodResolver(tenantSchema),
        defaultValues: tenant || { companyName: "", adminEmail: "", status: "待审核" },
    });

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
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="submit">保存</Button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </Form>
    );
}


function TenantManagementDialog() {
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
  
  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button>增、改、删企业注册租户</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>多租户企业管理</DialogTitle>
                <DialogDescription>管理平台上的所有企业租户账户。在这里可以增、改、删企业注册租户。</DialogDescription>
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
                            <CardTitle className="text-lg">{editingTenant ? '编辑租户' : '添加新租户'}</CardTitle>
                            <CardDescription>{editingTenant ? '修改租户信息。' : '添加一个新企业到平台。'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isFormOpen || editingTenant ? (
                                <TenantForm tenant={editingTenant} onSubmit={handleAddOrUpdateTenant} />
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

function UserForm({ user, onSubmit }: { user?: IndividualUser | null, onSubmit: (values: z.infer<typeof userSchema>) => void }) {
    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: user || { name: "", email: "", role: "个人用户", status: "待审核" },
    });

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
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="submit">保存用户</Button>
                    </DialogClose>
                </DialogFooter>
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
  
  return (
    <Dialog>
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
                            <CardTitle className="text-lg">{editingUser ? '编辑用户' : '添加新用户'}</CardTitle>
                            <CardDescription>{editingUser ? '修改用户信息。' : '添加一个新用户到平台。'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isFormOpen || editingUser ? (
                                <UserForm user={editingUser} onSubmit={handleAddOrUpdateUser} />
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


// --- Placeholder Dialog ---

function PlaceholderDialog({ triggerButtonText, title }: { triggerButtonText: string, title: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild><Button>{triggerButtonText}</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" /> {title}</DialogTitle>
                    <DialogDescription>此功能模块正在开发中。</DialogDescription>
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
        buttonText: "增、改、删企业注册租户",
    },
    {
        id: "users",
        title: "个人用户管理",
        description: "查看和管理所有个人用户。",
        icon: User,
        buttonText: "管理个人用户",
    },
    {
        id: "engineers",
        title: "技术工程师管理",
        description: "审核、认证和管理平台的技术工程师。",
        icon: Code,
        buttonText: "管理技术工程师",
    },
    {
        id: "permissions",
        title: "权限与资产管理",
        description: "管理平台级的LLM，对接全球LLM及其不同版本，分配TOKEN KEY,统计分析用量、充值、控制盗用，其他各类软件资产及其许可管理",
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
                                <TenantManagementDialog />
                            ) : panel.id === 'users' ? (
                                <UserManagementDialog 
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : panel.id === 'engineers' ? (
                                <UserManagementDialog 
                                    buttonText={panel.buttonText}
                                    title={panel.title}
                                    description={panel.description}
                                />
                            ) : (
                                <PlaceholderDialog
                                    triggerButtonText={panel.buttonText}
                                    title={`管理功能：${panel.title}`}
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

    
