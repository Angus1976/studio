
"use client";

import { useState } from "react";
import { useAuth, mockUsers, User } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserCog, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserWithRole = User & { editableRole: User['role'] };

export default function PermissionsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserWithRole[]>(
        mockUsers.map(u => ({ ...u, editableRole: u.role }))
    );

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-headline font-bold text-destructive/90">访问受限</h1>
                <p className="mt-2 text-muted-foreground max-w-md">
                    只有管理员才能访问权限管理页面。
                </p>
                <Button asChild className="mt-6">
                    <Link href="/login">前往登录</Link>
                </Button>
            </div>
        );
    }

    const handleRoleChange = (userId: string, newRole: User['role']) => {
        setUsers(users.map(u => u.id === userId ? { ...u, editableRole: newRole } : u));
    };
    
    const handleSaveChanges = (userId: string) => {
        const userToUpdate = users.find(u => u.id === userId);
        if(userToUpdate) {
             // In a real app, you would make an API call here to update the user's role.
             // For this demo, we'll just show a toast notification.
             console.log(`Saving role for ${userToUpdate.name}: ${userToUpdate.editableRole}`);
             toast({
                title: "权限已更新",
                description: `${userToUpdate.name} 的角色已更新为 ${getRoleDisplayName(userToUpdate.editableRole)}。`,
             });
        }
    };

    const getRoleDisplayName = (role: User['role']) => {
        switch (role) {
            case 'admin': return '管理员';
            case 'supplier': return '供应商';
            case 'creator': return '创意者';
            case 'user': return '普通用户';
        }
    };
    
    const getRoleBadgeVariant = (role: User['role']): "destructive" | "secondary" | "default" | "outline" => {
        switch (role) {
            case 'admin': return 'destructive';
            case 'supplier': return 'secondary';
            case 'creator': return 'default';
            case 'user': return 'outline';
        }
    };

    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <UserCog className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">权限管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    在此处集中管理所有用户的角色和权限分配。
                </p>
            </div>

            <Card className="mx-auto mt-8 max-w-5xl">
                <CardHeader>
                    <CardTitle>用户列表</CardTitle>
                    <CardDescription>查看和编辑平台所有用户的角色。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>用户</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>当前角色</TableHead>
                                    <TableHead>新角色</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9 border">
                                                    <AvatarImage src={u.avatar} alt={u.name} />
                                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{u.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                        <TableCell>
                                             <Badge variant={getRoleBadgeVariant(u.role)}>
                                                {getRoleDisplayName(u.role)}
                                             </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={u.editableRole}
                                                onValueChange={(newRole: User['role']) => handleRoleChange(u.id, newRole)}
                                                disabled={u.id === user.id} // Admin can't change their own role
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="选择角色" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">{getRoleDisplayName('user')}</SelectItem>
                                                    <SelectItem value="creator">{getRoleDisplayName('creator')}</SelectItem>
                                                    <SelectItem value="supplier">{getRoleDisplayName('supplier')}</SelectItem>
                                                    <SelectItem value="admin">{getRoleDisplayName('admin')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleSaveChanges(u.id)}
                                                disabled={u.editableRole === u.role || u.id === user.id}
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                保存
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
