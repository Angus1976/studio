
"use client";

import { useState } from "react";
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
import { AlertTriangle, Database, Search, ListFilter, FilePenLine, Trash2, PlusCircle, Eye } from "lucide-react";
import { ItemDetailsDialog } from "@/components/item-details-dialog";

// Mock data for the knowledge base
const knowledgeBaseEntries = [
  {
    id: "kb-001",
    name: "智能家庭中心 Pro",
    category: "消费电子产品",
    tags: ["智能家居", "语音助手", "Zigbee"],
    lastUpdated: "2024-07-28",
    description: "一款集成了语音助手、智能家居控制和家庭娱乐功能的中心设备。支持 Zigbee、Wi-Fi 和蓝牙连接。",
    price: "¥1299"
  },
  {
    id: "kb-002",
    name: "静音大师洗衣机",
    category: "家用电器",
    tags: ["节能", "直驱变频", "10公斤"],
    lastUpdated: "2024-07-27",
    description: "采用直驱变频电机，实现超静音洗涤。拥有10公斤大容量和多种智能洗涤程序。",
    price: "¥3499"
  },
  {
    id: "kb-003",
    name: "云端数据备份服务",
    category: "软件服务",
    tags: ["SaaS", "数据安全", "多设备同步"],
    lastUpdated: "2024-07-26",
    description: "提供安全可靠的云端数据备份方案，支持多设备同步和文件版本历史记录。",
    price: "¥99/年"
  },
  {
    id: "kb-004",
    name: "个性化营养咨询",
    category: "健康服务",
    tags: ["在线咨询", "营养师", "定制方案"],
    lastUpdated: "2024-07-25",
    description: "由专业营养师提供在线一对一咨询，根据您的身体状况和饮食习惯定制个性化营养方案。",
    price: "¥499/次"
  },
    {
    id: "kb-005",
    name: "便携式咖啡机",
    category: "厨房小电",
    tags: ["户外", "旅行", "手动"],
    lastUpdated: "2024-07-24",
    description: "小巧便携，适合户外旅行使用，手动操作，无需电源。",
    price: "¥299"
  },
];


export default function KnowledgeBasePage() {
    const { user } = useAuth();
    const [selectedEntry, setSelectedEntry] = useState<typeof knowledgeBaseEntries[0] | null>(null);

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-headline font-bold text-destructive/90">访问受限</h1>
                <p className="mt-2 text-muted-foreground max-w-md">
                    只有管理员才能访问此页面。请使用管理员账户登录。
                </p>
                <Button asChild className="mt-6">
                    <Link href="/login">前往登录</Link>
                </Button>
            </div>
        );
    }

    const formatEntryForDialog = (entry: typeof knowledgeBaseEntries[0] | null) => {
        if (!entry) return null;
        return {
            title: entry.name,
            description: entry.category,
            details: {
                "描述": entry.description,
                "标签": entry.tags.join(", "),
                "价格": entry.price,
                "最后更新": entry.lastUpdated,
                "ID": entry.id,
            }
        };
    };

    return (
        <>
            <main className="p-4 md:p-6">
                <div className="flex flex-col items-center text-center">
                     <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                        <Database className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">知识库管理系统</h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        在此增、改、删知识条目。知识库支持标签化管理，并可由AI辅助进行维护，为智能匹配和智能搜索提供数据基础。
                    </p>
                </div>

                <Card className="mx-auto mt-8 max-w-7xl">
                     <CardHeader>
                        <CardTitle>知识条目列表</CardTitle>
                        <CardDescription>管理所有产品、服务及相关知识。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="搜索条目名称或标签..." className="pl-10" />
                            </div>
                            <div className="flex items-center gap-2">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-1">
                                            <ListFilter className="h-3.5 w-3.5" />
                                            <span>筛选</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>按类别筛选</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem checked>消费电子产品</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>家用电器</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>软件服务</DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>健康服务</DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    新增条目
                                </Button>
                            </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>条目名称</TableHead>
                                        <TableHead>类别</TableHead>
                                        <TableHead>标签</TableHead>
                                        <TableHead>最后更新</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {knowledgeBaseEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{entry.category}</Badge>
                                            </TableCell>
                                            <TableCell className="space-x-1">
                                                {entry.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                            </TableCell>
                                            <TableCell>{entry.lastUpdated}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(entry)}>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">查看详情</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <FilePenLine className="h-4 w-4" />
                                                        <span className="sr-only">编辑</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">删除</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <ItemDetailsDialog
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                item={formatEntryForDialog(selectedEntry)}
            />
        </>
    );
}
