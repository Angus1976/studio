
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, ListFilter, PlusCircle, Hand, MessageSquare, Briefcase, LoaderCircle, Trash2 } from "lucide-react";
import { ItemDetailsDialog } from "@/components/item-details-dialog";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type Demand = {
  id: string;
  title: string;
  budget: string;
  category: string;
  tags: string[];
  status: string;
  posted_by: string;
  posted_date: string;
  description: string;
};

export default function DemandPoolPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [demands, setDemands] = useState<Demand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // To track which demand is being submitted
    const [error, setError] = useState<string | null>(null);

    const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<Record<string, Record<string, boolean>>>({
        category: {},
        status: {},
    });

    const fetchDemands = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/demands');
            setDemands(response.data);
            
            // Dynamically set up filters based on fetched data
            const fetchedCategories = [...new Set(response.data.map((d: Demand) => d.category))];
            const fetchedStatuses = [...new Set(response.data.map((d: Demand) => d.status))];
            setFilters({
                category: fetchedCategories.reduce((acc, category) => ({ ...acc, [category]: true }), {}),
                status: fetchedStatuses.reduce((acc, status) => ({ ...acc, [status]: true }), {}),
            });

        } catch (err) {
            console.error("Failed to fetch demands:", err);
            setError("无法加载需求列表，请稍后重试。");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDemands();
    }, []);

    const filteredDemands = useMemo(() => {
        if (isLoading) return [];
        return demands.filter(demand => {
            const searchMatch = demand.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                demand.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const categoryMatch = filters.category[demand.category] ?? true;
            const statusMatch = filters.status[demand.status] ?? true;
            return searchMatch && categoryMatch && statusMatch;
        });
    }, [searchTerm, filters, demands, isLoading]);
    
    const categories = useMemo(() => Object.keys(filters.category), [filters.category]);
    const statuses = useMemo(() => Object.keys(filters.status), [filters.status]);


    const handleFilterChange = (filterType: 'category' | 'status', value: string, checked: boolean) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: {
                ...prev[filterType],
                [value]: checked,
            },
        }));
    };
    
    const formatDemandForDialog = (demand: Demand | null) => {
        if (!demand) return null;
        const postedDate = new Date(demand.posted_date).toLocaleDateString();
        return {
            title: demand.title,
            description: `预算: ${demand.budget}`,
            details: {
                "需求描述": demand.description,
                "类别": demand.category,
                "标签": demand.tags.join(", "),
                "状态": demand.status,
                "发布者": demand.posted_by,
                "发布日期": postedDate,
                "需求ID": demand.id,
            }
        };
    };

    const handleTakeOrder = async (demandId: string) => {
        if (!user) {
            toast({ title: "请先登录", description: "登录后才能响应需求。", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(demandId);
        try {
            // Note: In a real app, supplier_id would come from the user session.
            // Here, we're using the logged-in user's ID, assuming they are a supplier/creator.
            await api.post(`/api/demands/${demandId}/respond`, { supplier_id: user.id });
            toast({
                title: "抢单成功",
                description: "您已成功响应此需求，状态已更新为“洽谈中”。",
            });
            // Refresh the list to show the updated status
            await fetchDemands();
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "操作失败，请稍后重试。";
            toast({
                title: "抢单失败",
                description: errorMessage,
                variant: "destructive",
            });
            console.error("Failed to respond to demand:", error);
        } finally {
            setIsSubmitting(null);
        }
    };
    
     const handleDeleteDemand = async (demandId: string) => {
        try {
            await api.delete(`/api/demands/${demandId}`);
            toast({
                title: "删除成功",
                description: "该需求已从系统中删除。",
            });
            await fetchDemands();
        } catch (error) {
            toast({
                title: "删除失败",
                description: "无法删除该需求，请稍后重试。",
                variant: "destructive",
            });
            console.error("Failed to delete demand:", error);
        }
    };
    
    const canTakeOrder = user?.role === 'supplier' || user?.role === 'creator';
    
    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case "开放中": return "default";
            case "洽谈中": return "secondary";
            case "已完成": return "outline";
            default: return "secondary";
        }
    };

    return (
        <>
            <main className="p-4 md:p-6">
                <div className="flex flex-col items-center text-center mb-8">
                     <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                        <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">需求池</h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        平台可用AI智能推送需求给供应商或创意者，供应商和创作者也可以在公共需求池中找需求，需求发布者决定与哪个供应商或创意者合作。
                    </p>
                </div>

                <Card className="mx-auto mt-8 max-w-7xl">
                     <CardHeader>
                        <CardTitle>公开需求列表</CardTitle>
                        <CardDescription>查看所有已发布的需求，寻找与您业务相关的机会。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="搜索需求标题或标签..." 
                                    className="pl-10" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-1">
                                            <ListFilter className="h-3.5 w-3.5" />
                                            <span>筛选</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>按类别筛选</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {categories.map(category => (
                                            <DropdownMenuCheckboxItem
                                                key={category}
                                                checked={filters.category[category]}
                                                onCheckedChange={(checked) => handleFilterChange('category', category, !!checked)}
                                            >
                                                {category}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>按状态筛选</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {statuses.map(status => (
                                            <DropdownMenuCheckboxItem
                                                key={status}
                                                checked={filters.status[status]}
                                                onCheckedChange={(checked) => handleFilterChange('status', status, !!checked)}
                                            >
                                                {status}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 {user?.role === 'user' && (
                                     <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        发布新需求
                                    </Button>
                                 )}
                            </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>需求标题</TableHead>
                                        <TableHead>预算</TableHead>
                                        <TableHead>类别</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead>发布日期</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex justify-center items-center">
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    正在加载需求...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-destructive">
                                                {error}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredDemands.length > 0 ? (
                                        filteredDemands.map((demand) => (
                                            <TableRow key={demand.id} onDoubleClick={() => setSelectedDemand(demand)} className="cursor-pointer">
                                                <TableCell className="font-medium">{demand.title}</TableCell>
                                                <TableCell>{demand.budget}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{demand.category}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(demand.status)}>{demand.status}</Badge>
                                                </TableCell>
                                                <TableCell>{new Date(demand.posted_date).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {canTakeOrder && demand.status === '开放中' && (
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleTakeOrder(demand.id)}
                                                                disabled={isSubmitting === demand.id}
                                                            >
                                                                {isSubmitting === demand.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Hand className="mr-2 h-4 w-4" />}
                                                                抢单
                                                            </Button>
                                                        )}
                                                        {demand.status === '洽谈中' && (
                                                            <Button size="sm" variant="secondary">
                                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                                开始沟通
                                                            </Button>
                                                        )}
                                                        {demand.status === '已完成' && (
                                                            <Button size="sm" variant="outline" disabled>已完成</Button>
                                                        )}
                                                         {user?.role === 'admin' && (
                                                             <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                     <Button variant="destructive" size="sm">
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        删除
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                    <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        此操作无法撤销。这将永久删除此需求。
                                                                    </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteDemand(demand.id)}>
                                                                        继续删除
                                                                    </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                <p>未找到匹配的需求。</p>
                                                <p className="text-sm">请尝试调整您的搜索词或筛选条件。</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <ItemDetailsDialog
                isOpen={!!selectedDemand}
                onClose={() => setSelectedDemand(null)}
                item={formatDemandForDialog(selectedDemand)}
            />
        </>
    );
}
