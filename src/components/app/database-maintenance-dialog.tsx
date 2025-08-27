
"use client";

import React, { useState, useCallback } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { LoaderCircle, HardDriveDownload, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { findOrphanedUsers, findIncompleteOrders, cleanDatabase } from '@/ai/flows/admin-management-flows';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type HealthCheckResult = {
    id: string;
    type: 'Orphaned User' | 'Incomplete Order';
    description: string;
};

export function DatabaseMaintenanceDialog({ buttonText, title, description }: { buttonText: string, title: string, description: string }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [scanResults, setScanResults] = useState<HealthCheckResult[]>([]);

    const handleScan = useCallback(async () => {
        setIsScanning(true);
        setScanResults([]);
        toast({ title: "正在扫描数据库...", description: "请稍候，正在检查数据一致性。" });
        try {
            const [orphanedUsers, incompleteOrders] = await Promise.all([
                findOrphanedUsers(),
                findIncompleteOrders(),
            ]);

            const results: HealthCheckResult[] = [];
            orphanedUsers.forEach(user => {
                results.push({
                    id: user.id,
                    type: 'Orphaned User',
                    description: `用户 ${user.email} (租户ID: ${user.tenantId}) 是一个孤儿记录。`,
                });
            });
            incompleteOrders.forEach(order => {
                results.push({
                    id: order.id,
                    type: 'Incomplete Order',
                    description: `订单 ${order.id} 是一个不完整的记录。`,
                });
            });

            setScanResults(results);
            toast({ title: "扫描完成", description: `发现 ${results.length} 个潜在问题。` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "扫描失败", description: error.message });
        } finally {
            setIsScanning(false);
        }
    }, [toast]);

    const handleClean = async (item: HealthCheckResult) => {
        setIsCleaning(true);
        try {
            const result = await cleanDatabase({ ids: [item.id], type: item.type });
            if (result.success) {
                toast({ title: "清理成功", description: `${item.type} ${item.id} 已被删除。` });
                setScanResults(prev => prev.filter(r => r.id !== item.id));
            } else {
                 toast({ variant: "destructive", title: "清理失败", description: result.message });
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "清理时发生错误", description: error.message });
        } finally {
            setIsCleaning(false);
        }
    }
    
     const handleCleanAll = async () => {
        setIsCleaning(true);
        try {
            const orphanedUsers = scanResults.filter(r => r.type === 'Orphaned User').map(r => r.id);
            const incompleteOrders = scanResults.filter(r => r.type === 'Incomplete Order').map(r => r.id);

            if (orphanedUsers.length > 0) {
                 await cleanDatabase({ ids: orphanedUsers, type: 'Orphaned User' });
            }
            if (incompleteOrders.length > 0) {
                await cleanDatabase({ ids: incompleteOrders, type: 'Incomplete Order' });
            }
            
            toast({ title: "全部清理成功", description: `已清理 ${scanResults.length} 个问题项。` });
            setScanResults([]);
            
        } catch (error: any) {
             toast({ variant: "destructive", title: "清理时发生错误", description: error.message });
        } finally {
            setIsCleaning(false);
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>{buttonText}</Button></DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="health-check" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="health-check"><ShieldCheck className="mr-2 h-4 w-4" />数据健康检查</TabsTrigger>
                        <TabsTrigger value="backup" disabled><HardDriveDownload className="mr-2 h-4 w-4" />备份与恢复</TabsTrigger>
                    </TabsList>
                    <TabsContent value="health-check">
                        <Card>
                            <CardHeader>
                                <CardTitle>数据一致性扫描</CardTitle>
                                <CardDescription>扫描数据库中的孤儿记录（如用户关联了不存在的租户）和不完整的条目，并提供清理选项。</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">点击按钮开始扫描数据库中的潜在问题。</p>
                                    <Button onClick={handleScan} disabled={isScanning}>
                                        {isScanning && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                                        开始扫描
                                    </Button>
                                </div>
                                
                                {scanResults.length > 0 && (
                                     <div className="mt-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold">扫描结果</h4>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={isCleaning}>
                                                        {isCleaning && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                                                        全部清理
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>确认全部清理？</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                          此操作将删除所有扫描出的 {scanResults.length} 个问题项，且无法撤销。
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleCleanAll}>确认清理</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                         <ScrollArea className="h-[300px] border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>类型</TableHead>
                                                        <TableHead>描述</TableHead>
                                                        <TableHead className="text-right">操作</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {scanResults.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell><Badge variant="destructive">{item.type}</Badge></TableCell>
                                                            <TableCell className="text-sm">{item.description}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="sm" onClick={() => handleClean(item)} disabled={isCleaning}>
                                                                    <Trash2 className="h-4 w-4 mr-1"/> 清理
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                         </ScrollArea>
                                     </div>
                                )}

                                {!isScanning && scanResults.length === 0 && (
                                     <div className="mt-6 text-center text-muted-foreground p-8 border rounded-lg border-dashed">
                                        <p>暂未发现问题，或请先开始扫描。</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="backup">
                        <Card>
                            <CardHeader>
                                <CardTitle>备份与恢复</CardTitle>
                                <CardDescription>管理数据库备份。</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center text-muted-foreground p-8">
                                 <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                                 此功能正在开发中。
                            </CardContent>
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
