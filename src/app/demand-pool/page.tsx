
"use client";

import { useState, useMemo } from "react";
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
import { AlertTriangle, Search, ListFilter, PlusCircle, Hand, MessageSquare, Briefcase } from "lucide-react";
import { ItemDetailsDialog } from "@/components/item-details-dialog";

// Mock data for the demand pool
const demands = [
  {
    id: "demand-001",
    title: "寻找一款适合送给女友的生日礼物",
    budget: "¥500 - ¥1000",
    category: "礼品定制",
    tags: ["生日礼物", "设计感", "女性"],
    status: "开放中",
    postedBy: "张伟",
    postedDate: "2024-08-01",
    description: "希望找到一款有设计感、不那么大众化的生日礼物送给女友，她喜欢艺术和手工艺品。预算在500到1000元之间。",
  },
  {
    id: "demand-002",
    title: "需要为新公司的LOGO设计一个3D动画",
    budget: "¥3000 - ¥5000",
    category: "3D设计",
    tags: ["Logo动画", "赛博朋克", "创意者"],
    status: "开放中",
    postedBy: "李明",
    postedDate: "2024-07-30",
    description: "我们是一家科技初创公司，logo已经有了，需要一位创意者为其制作一个5-10秒的赛博朋克风格3D开场动画。",
  },
  {
    id: "demand-003",
    title: "批量采购一批智能办公插座",
    budget: "¥10000+",
    category: "智能硬件",
    tags: ["智能家居", "企业采购", "供应商"],
    status: "洽谈中",
    postedBy: "王芳",
    postedDate: "2024-07-29",
    description: "公司装修，需要采购约200个智能插座，要求支持远程控制和电量统计，希望有实力的供应商报价。",
  },
  {
    id: "demand-004",
    title: "为宠物狗定制一个智能项圈",
    budget: "¥300 - ¥600",
    category: "宠物用品",
    tags: ["智能穿戴", "宠物", "GPS"],
    status: "已完成",
    postedBy: "赵强",
    postedDate: "2024-07-25",
    description: "希望能定制一款带有GPS定位、活动量监测功能的宠物项圈，外观希望能个性化一点。",
  },
];

const categories = [...new Set(demands.map(demand => demand.category))];
const statuses = [...new Set(demands.map(demand => demand.status))];

export default function DemandPoolPage() {
    const { user } = useAuth();
    const [selectedDemand, setSelectedDemand] = useState<typeof demands[0] | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<Record<string, Record<string, boolean>>>({
        category: categories.reduce((acc, category) => ({ ...acc, [category]: true }), {}),
        status: statuses.reduce((acc, status) => ({ ...acc, [status]: true }), {}),
    });

    const filteredDemands = useMemo(() => {
        return demands.filter(demand => {
            const searchMatch = demand.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                demand.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const categoryMatch = filters.category[demand.category];
            const statusMatch = filters.status[demand.status];
            return searchMatch && categoryMatch && statusMatch;
        });
    }, [searchTerm, filters]);

    const handleFilterChange = (filterType: 'category' | 'status', value: string, checked: boolean) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: {
                ...prev[filterType],
                [value]: checked,
            },
        }));
    };
    
    const formatDemandForDialog = (demand: typeof demands[0] | null) => {
        if (!demand) return null;
        return {
            title: demand.title,
            description: `预算: ${demand.budget}`,
            details: {
                "需求描述": demand.description,
                "类别": demand.category,
                "标签": demand.tags.join(", "),
                "状态": demand.status,
                "发布者": demand.postedBy,
                "发布日期": demand.postedDate,
                "需求ID": demand.id,
            }
        };
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
                <div className="flex flex-col items-center text-center">
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
                                    {filteredDemands.map((demand) => (
                                        <TableRow key={demand.id} onDoubleClick={() => setSelectedDemand(demand)} className="cursor-pointer">
                                            <TableCell className="font-medium">{demand.title}</TableCell>
                                            <TableCell>{demand.budget}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{demand.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(demand.status)}>{demand.status}</Badge>
                                            </TableCell>
                                            <TableCell>{demand.postedDate}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canTakeOrder && demand.status === '开放中' && (
                                                        <Button size="sm">
                                                            <Hand className="mr-2 h-4 w-4" />
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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         {filteredDemands.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>未找到匹配的需求。</p>
                                <p className="text-sm">请尝试调整您的搜索词或筛选条件。</p>
                            </div>
                        )}
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
