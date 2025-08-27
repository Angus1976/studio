
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, Copy, KeyRound, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import type { ApiKey } from "@/lib/data-types";
import { getApiKeys, createApiKey, revokeApiKey } from "@/ai/flows/tenant-management-flows";

const apiKeySchema = z.object({
  name: z.string().min(2, { message: "名称至少需要2个字符。" }),
});

function CreateApiKeyForm({ onSave, isLoading }: { onSave: (values: z.infer<typeof apiKeySchema>) => void; isLoading: boolean; }) {
  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: z.infer<typeof apiKeySchema>) => {
    onSave(values);
    form.reset();
  };
  
  return (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>密钥名称</FormLabel>
                        <FormControl><Input placeholder="例如：我的网站集成" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    创建密钥
                </Button>
            </div>
        </form>
    </Form>
  )
}

function NewlyCreatedKeyDialog({ apiKey, onClose }: { apiKey: ApiKey; onClose: () => void; }) {
    const { toast } = useToast();
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "已复制到剪贴板" });
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>API 密钥已创建</DialogTitle>
                    <DialogDescription>
                        请复制此密钥并妥善保管。为了安全，您将无法再次查看完整的密钥。
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4">
                    <div className="flex items-center space-x-2 rounded-md bg-secondary p-3">
                        <Input readOnly value={apiKey.key} className="flex-1 font-mono text-xs" />
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(apiKey.key)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        密钥名称: {apiKey.name}
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>我已保存密钥</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ApiKeyManagementCard({ tenantId }: { tenantId: string }) {
    const { toast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchKeys = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const keys = await getApiKeys({ tenantId });
            setApiKeys(keys);
        } catch (e: any) {
            toast({ title: "加载密钥失败", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, tenantId]);

    const handleCreateKey = async (values: z.infer<typeof apiKeySchema>) => {
        setIsSubmitting(true);
        try {
            const result = await createApiKey({ tenantId: tenantId, name: values.name });
            if (result.success) {
                setNewlyCreatedKey(result.key);
                setApiKeys(prev => [result.key, ...prev]);
                setIsCreating(false);
            }
        } catch (e: any) {
            toast({ title: "创建密钥失败", description: e.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
  
    const handleRevokeKey = async (keyId: string) => {
        try {
            await revokeApiKey({ tenantId: tenantId, keyId });
            setApiKeys(prev => prev.map(key => key.id === keyId ? {...key, status: "已撤销"} : key));
            toast({ title: "API 密钥已撤销" });
        } catch (e: any) {
             toast({ title: "撤销密钥失败", description: e.message, variant: "destructive" });
        }
    };

    React.useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    if (newlyCreatedKey) {
        return <NewlyCreatedKeyDialog apiKey={newlyCreatedKey} onClose={() => setNewlyCreatedKey(null)} />;
    }

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><KeyRound/> API 密钥管理</CardTitle>
                    <CardDescription>管理用于调用平台服务的 API 密钥。</CardDescription>
                </div>
                {!isCreating && <Button onClick={() => setIsCreating(true)}><PlusCircle className="mr-2 h-4 w-4" />创建新密钥</Button>}
            </CardHeader>
            <CardContent>
                {isCreating ? (
                    <CreateApiKeyForm onSave={handleCreateKey} isLoading={isSubmitting} />
                ) : (
                    <ScrollArea className="h-[40vh]">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>名称</TableHead>
                                        <TableHead>密钥 (部分)</TableHead>
                                        <TableHead>创建于</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map(key => (
                                        <TableRow key={key.id}>
                                            <TableCell className="font-medium">{key.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{key.key.substring(0, 10)}...{key.key.slice(-4)}</TableCell>
                                            <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={key.status === '活跃' ? 'default' : 'destructive'}>
                                                    {key.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {key.status === '活跃' && (
                                                    <Button variant="destructive" size="sm" onClick={() => handleRevokeKey(key.id)}>
                                                        <Trash2 className="mr-2 h-3 w-3" />
                                                        撤销
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {apiKeys.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                还没有创建任何API密钥。
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                )}
                 {isCreating && <Button variant="ghost" className="mt-4" onClick={() => setIsCreating(false)}>返回列表</Button>}
            </CardContent>
        </Card>
    );
}
