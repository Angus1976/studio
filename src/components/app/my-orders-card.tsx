
"use client";

import React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideReact from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import type { Order, ProcurementItem, OrderStatus } from "@/lib/data-types";

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const Icon = (LucideReact as any)[name] as React.ElementType;
    if (!Icon) return <LucideReact.Package {...props} />; // Fallback icon
    return <Icon {...props} />;
};


const preOrderSchema = z.object({
  quantity: z.coerce.number().min(1, { message: "数量必须大于0。" }),
  notes: z.string().optional(),
});

function CreatePreOrderDialog({ item, onConfirm }: { item: ProcurementItem, onConfirm: (values: z.infer<typeof preOrderSchema>) => void }) {
    const [open, setOpen] = React.useState(false);
    const form = useForm<z.infer<typeof preOrderSchema>>({
        resolver: zodResolver(preOrderSchema),
        defaultValues: { quantity: 1, notes: "" },
    });

    const onSubmit = (values: z.infer<typeof preOrderSchema>) => {
        onConfirm(values);
        form.reset();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">加入预购单</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>创建预购单: {item.title}</DialogTitle>
                    <DialogDescription>
                        确认采购数量和备注，提交后将生成预购单，待平台客户经理确认。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                           <div className="p-3 bg-accent/10 rounded-full">
                               <IconComponent name={item.icon} className="h-8 w-8 text-accent" />
                           </div>
                           <div>
                               <h4 className="font-semibold">{item.title}</h4>
                               <p className="text-sm text-muted-foreground">
                                   单价: ¥{item.price} / {item.unit}
                                </p>
                           </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>采购数量</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="输入采购数量" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注 (可选)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="如有特殊要求，请在此说明" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">取消</Button></DialogClose>
                            <Button type="submit">提交预购单</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ViewOrderDialog({ order }: { order: Order }) {
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
                <Button variant="outline" size="sm">查看</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>订单详情: {order.id}</DialogTitle>
                    <DialogDescription>
                        创建于 {order.createdAt}，最后更新于 {order.updatedAt}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">状态</span>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">总金额</span>
                        <span className="font-semibold">¥{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <h4 className="font-semibold">订单内容</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>项目</TableHead>
                                <TableHead>单价</TableHead>
                                <TableHead className="text-center">数量</TableHead>
                                <TableHead className="text-right">小计</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(order.items || []).map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.title}</TableCell>
                                    <TableCell>¥{item.price.toFixed(2)} / {item.unit}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">关闭</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// A versatile card that can display either procurement items or user orders.
export function MyOrdersCard({ isLoading, items, orders, onConfirm, onPay, ...props }: { isLoading: boolean, items?: ProcurementItem[], orders?: Order[], onConfirm?: (item: ProcurementItem, values: any) => void, onPay?: (orderId: string) => void, [key: string]: any }) {
    if (items) { // Procurement market view
         return (
            <Card {...props}>
                <CardHeader>
                    <CardTitle>集中采购市场</CardTitle>
                    <CardDescription>为您的企业统一采购软件、服务和各类资源。</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="flex-row items-start gap-4 space-y-0">
                                    <div className="p-3 bg-accent/10 rounded-full">
                                        <IconComponent name={item.icon} className="h-6 w-6 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{item.title}</CardTitle>
                                        <Badge variant="outline" className="mt-1 font-normal">{item.tag}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    <p className="text-sm font-semibold mt-2">¥{item.price} <span className="text-xs text-muted-foreground">/ {item.unit}</span></p>
                                </CardContent>
                                <CardFooter>
                                    <CreatePreOrderDialog 
                                        item={item} 
                                        onConfirm={(values) => onConfirm?.(item, values)}
                                    />
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        );
    }
    
    // My Orders view
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
        <Card {...props}>
            <CardHeader>
                <CardTitle>我的订单</CardTitle>
                <CardDescription>查看和管理您的采购订单。</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>订单号</TableHead>
                            <TableHead>内容</TableHead>
                            <TableHead>总金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>最后更新</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders && orders.length > 0 ? orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.substring(0,8)}...</TableCell>
                                <TableCell>
                                    {(order.items || []).map((item: any) => 
                                        <div key={item.id}>{item.title} (x{item.quantity})</div>
                                    )}
                                </TableCell>
                                <TableCell>¥{order.totalAmount.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(order.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    {order.status === '待支付' ? (
                                        <Button size="sm" onClick={() => onPay?.(order.id)}>在线支付</Button>
                                    ) : (
                                        <ViewOrderDialog order={order} />
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    暂无订单。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
    );
}
