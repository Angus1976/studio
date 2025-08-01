
"use client";

import { useState, useEffect } from "react";
import { useAuth, User as AuthUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserCog, MoreHorizontal, Star, UserX, UserCheck, ShieldOff, Trash2, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function PermissionsPage() {
    const { user: currentUser, login, logout } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get<AuthUser[]>('/api/users');
            setUsers(response.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("无法加载用户列表，请稍后重试。");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, [currentUser]);

    const handleRoleChange = (userId: string, newRole: AuthUser['role']) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    const handleAction = async (userId: string, action: 'saveRole' | 'suspend' | 'blacklist' | 'delete' | 'activate') => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        setIsSubmitting(prev => ({...prev, [userId]: true}));

        let message = "";
        try {
            switch (action) {
                case 'saveRole':
                    const newRole = userToUpdate.role;
                    await api.put(`/api/users/${userId}`, { role: newRole });
                    message = `${userToUpdate.name} 的角色已更新为 ${getRoleDisplayName(newRole)}。`;
                    break;
                case 'suspend':
                    await api.put(`/api/users/${userId}`, { status: 'suspended' });
                    message = `${userToUpdate.name} 已被暂停。`;
                    break;
                case 'blacklist':
                    await api.put(`/api/users/${userId}`, { status: 'blacklisted' });
                    message = `${userToUpdate.name} 已被加入黑名单。`;
                    break;
                case 'activate':
                    await api.put(`/api/users/${userId}`, { status: 'active' });
                    message = `${userToUpdate.name} 已被激活。`;
                    break;
                case 'delete':
                    await api.delete(`/api/users/${userId}`);
                    message = `${userToUpdate.name} 已被删除。`;
                    break;
            }
             toast({
                title: "操作成功",
                description: message,
            });

            // If current user is being modified, re-login to update their state
            if (currentUser && currentUser.id === userId && action !== 'delete') {
                 login(currentUser.id);
            } else if (currentUser && currentUser.id === userId && action === 'delete') {
                 logout(); // Log out if self-deleted
            }

            await fetchUsers();
        } catch (err) {
             toast({
                title: "操作失败",
                description: "执行操作时发生错误，请稍后重试。",
                variant: "destructive"
            });
            console.error(`Failed to ${action} user ${userId}:`, err);
        } finally {
            setIsSubmitting(prev => ({...prev, [userId]: false}));
        }
    };

    if (!currentUser || currentUser.role !== 'admin') {
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

    const getRoleDisplayName = (role: AuthUser['role']) => {
        switch (role) {
            case 'admin': return '管理员';
            case 'supplier': return '供应商';
            case 'creator': return '创意者';
            case 'user': return '普通用户';
        }
    };
    
    const getStatusBadgeInfo = (status: AuthUser['status']): { text: string; variant: "default" | "secondary" | "destructive" } => {
        switch (status) {
            case 'suspended': return { text: '已暂停', variant: 'secondary' };
            case 'blacklisted': return { text: '黑名单', variant: 'destructive' };
            case 'active':
            default:
                return { text: '正常', variant: 'default' };
        }
    };

    const StarRating = ({ rating }: { rating: number }) => (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
    );

    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <UserCog className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">权限管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    在此处集中管理所有用户的角色、状态和评级。
                </p>
            </div>

            <Card className="mx-auto mt-8 max-w-7xl">
                <CardHeader>
                    <CardTitle>用户列表</CardTitle>
                    <CardDescription>查看和编辑平台所有用户的角色和状态。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>用户</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead>星级</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                正在加载用户...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                     <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                            {error}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((u) => {
                                      const statusInfo = getStatusBadgeInfo(u.status);
                                      const isCurrentUser = u.id === currentUser.id;
                                      const isActionSubmitting = isSubmitting[u.id];

                                      return (
                                        <TableRow key={u.id} className={u.status !== 'active' ? 'bg-muted/50' : ''}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9 border">
                                                        <AvatarImage src={u.avatar} alt={u.name} />
                                                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-medium">{u.name}</span>
                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusInfo.variant}>
                                                    {statusInfo.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={u.role}
                                                    onValueChange={(newRole: AuthUser['role']) => handleRoleChange(u.id, newRole)}
                                                    disabled={isCurrentUser || isActionSubmitting}
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
                                            <TableCell>
                                                <StarRating rating={u.rating} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 {isActionSubmitting ? (
                                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                                ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isCurrentUser}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">更多操作</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleAction(u.id, 'saveRole')}>
                                                            保存角色
                                                        </DropdownMenuItem>
                                                        {u.status === 'active' ? (
                                                          <>
                                                            <DropdownMenuItem onClick={() => handleAction(u.id, 'suspend')}>
                                                              <ShieldOff className="mr-2 h-4 w-4" /> 设为暂停
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAction(u.id, 'blacklist')}>
                                                              <UserX className="mr-2 h-4 w-4" /> 加入黑名单
                                                            </DropdownMenuItem>
                                                          </>
                                                        ) : (
                                                          <DropdownMenuItem onClick={() => handleAction(u.id, 'activate')}>
                                                            <UserCheck className="mr-2 h-4 w-4" /> 重新激活
                                                          </DropdownMenuItem>
                                                        )}
                                                        
                                                        <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                              className="text-destructive"
                                                              onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                                                            >
                                                              <Trash2 className="mr-2 h-4 w-4" /> 删除用户
                                                            </DropdownMenuItem>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                              <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
                                                              <AlertDialogDescription>
                                                                此操作无法撤销。这将永久删除用户 “{u.name}”。
                                                              </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>取消</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleAction(u.id, 'delete')}>
                                                                继续删除
                                                              </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                      )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}


    