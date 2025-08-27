
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Pencil, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IndividualUser, Role, Department, Position } from "@/lib/data-types";
import { Skeleton } from "../ui/skeleton";


const inviteUserSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  role: z.string().min(1, { message: "请为用户选择一个角色。" }),
});

const editUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.string().min(1, { message: "请为用户选择一个角色。" }),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
});

function InviteUserDialog({ roles, onInvite, children }: { roles: Role[]; onInvite: (values: z.infer<typeof inviteUserSchema>) => void, children: React.ReactNode }) {
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
      <DialogTrigger asChild>{children}</DialogTrigger>
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
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
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

function EditUserDialog({ user, roles, departments, positions, onUpdate, children }: { user: IndividualUser, roles: Role[], departments: Department[], positions: Position[], onUpdate: (values: z.infer<typeof editUserSchema>) => void, children: React.ReactNode }) {
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        positionId: user.positionId,
    },
  });
  const [open, setOpen] = useState(false);
  const selectedDepartmentId = form.watch("departmentId");

  React.useEffect(() => {
    if (open) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        positionId: user.positionId,
      });
    }
  }, [open, user, form]);
  
   React.useEffect(() => {
    // Reset position if department changes and the current position is not in the new department
    const currentPosition = positions.find(p => p.id === form.getValues('positionId'));
    if (currentPosition && currentPosition.departmentId !== selectedDepartmentId) {
        form.setValue('positionId', undefined);
    }
  }, [selectedDepartmentId, positions, form]);

  const onSubmit = (values: z.infer<typeof editUserSchema>) => {
    onUpdate(values);
    setOpen(false);
  };
  
  const filteredPositions = positions.filter(p => p.departmentId === selectedDepartmentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑成员: {user.name}</DialogTitle>
          <DialogDescription>修改成员的角色、部门和岗位信息。</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>部门</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="选择部门" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="none">无</SelectItem>
                            {departments.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>岗位</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedDepartmentId || filteredPositions.length === 0}>
                        <FormControl><SelectTrigger><SelectValue placeholder="选择岗位" /></SelectTrigger></FormControl>
                        <SelectContent>
                             <SelectItem value="none">无</SelectItem>
                            {filteredPositions.map((pos) => (<SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
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
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
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

function BatchImportDialog({ roles, onImport }: { roles: Role[], onImport: (users: any[]) => void }) {
  const { toast } = useToast();
  const [textValue, setTextValue] = useState("");
  const [open, setOpen] = useState(false);
  
  const handleImport = () => {
    if (!textValue.trim()) {
      toast({
        variant: "destructive",
        title: "导入失败",
        description: "粘贴内容不能为空。",
      });
      return;
    }

    const lines = textValue.trim().split('\n');
    const newUsers: any[] = [];
    const existingRoleNames = roles.map(r => r.name);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const [name, email, role] = line.split(',').map(item => item.trim());

        if (!name || !email || !role) {
            toast({ variant: "destructive", title: `第 ${i+1} 行错误`, description: "数据格式不正确，应为：姓名,邮箱,角色" });
            return;
        }

        if (!z.string().email().safeParse(email).success) {
            toast({ variant: "destructive", title: `第 ${i+1} 行错误`, description: `邮箱格式不正确: ${email}` });
            return;
        }
        
        if (!existingRoleNames.includes(role)) {
            toast({ variant: "destructive", title: `第 ${i+1} 行错误`, description: `角色 "${role}" 不存在。请先创建该角色。` });
            return;
        }

        newUsers.push({ name, email, role, status: '邀请中' });
    }

    onImport(newUsers);
    toast({ title: "导入成功", description: `成功导入 ${newUsers.length} 名新成员。` });
    setTextValue("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量导入成员</DialogTitle>
          <DialogDescription>
            请将成员信息粘贴到下方文本框中。每行一个成员，格式为：<code className="bg-muted px-1 py-0.5 rounded text-muted-foreground">姓名,邮箱,角色</code>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={`张三,zhangsan@example.com,成员\n李四,lisi@example.com,管理员`}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            rows={10}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">取消</Button></DialogClose>
          <Button onClick={handleImport}>确认导入</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MembersCard({ isLoading, users, roles, departments, positions, onInviteUser, onUpdateUser, onBatchImport, onExport }: { isLoading: boolean, users: IndividualUser[], roles: Role[], departments: Department[], positions: Position[], onInviteUser: (values: any) => void, onUpdateUser: (values: any) => void, onBatchImport: (users: any) => void, onExport: () => void }) {
    
    const departmentMap = React.useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);
    const positionMap = React.useMemo(() => new Map(positions.map(p => [p.id, p.name])), [positions]);
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>成员管理</CardTitle>
                    <CardDescription>管理您企业下的成员账户，并将其分配到具体的部门和岗位。</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <BatchImportDialog roles={roles} onImport={onBatchImport} />
                    <Button variant="outline" onClick={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        导出列表
                    </Button>
                    <InviteUserDialog roles={roles} onInvite={onInviteUser}>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>邀请新成员</Button>
                    </InviteUserDialog>
                </div>
            </CardHeader>
            <CardContent>
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
                        <TableHead>姓名</TableHead>
                        <TableHead>部门</TableHead>
                        <TableHead>岗位</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div>{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>{user.departmentId ? departmentMap.get(user.departmentId) : '—'}</TableCell>
                            <TableCell>{user.positionId ? positionMap.get(user.positionId) : '—'}</TableCell>
                            <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                            <TableCell>
                                <Badge variant={user.status === '活跃' ? 'default' : user.status === '待审核' ? 'secondary' : 'destructive'}>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <EditUserDialog user={user} roles={roles} departments={departments} positions={positions} onUpdate={onUpdateUser}>
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
            )}
            </CardContent>
        </Card>
    );
}
