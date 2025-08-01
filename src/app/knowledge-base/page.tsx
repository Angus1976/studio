
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
import { AlertTriangle, Database, Search, ListFilter, FilePenLine, Trash2, PlusCircle, Eye, LoaderCircle } from "lucide-react";
import { ItemDetailsDialog } from "@/components/item-details-dialog";
import api from "@/lib/api";

type KnowledgeBaseEntry = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  last_updated: string;
  description: string;
  price: string;
};

export default function KnowledgeBasePage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    
    const [selectedEntry, setSelectedEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchKnowledgeBase = async () => {
            if (user?.role !== 'admin') return;
            try {
                setIsLoading(true);
                setError(null);
                const response = await api.get<KnowledgeBaseEntry[]>('/api/knowledge-base');
                setEntries(response.data);
                
                const fetchedCategories = [...new Set(response.data.map((entry: KnowledgeBaseEntry) => entry.category))];
                setCategories(fetchedCategories);
                setCategoryFilters(
                    fetchedCategories.reduce((acc, category) => ({ ...acc, [category]: true }), {})
                );

            } catch (err) {
                console.error("Failed to fetch knowledge base:", err);
                setError("无法加载知识库条目，请稍后重试。");
            } finally {
                setIsLoading(false);
            }
        };

        fetchKnowledgeBase();
    }, [user]);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const searchMatch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
            const categoryMatch = categoryFilters[entry.category] ?? true;
            return searchMatch && categoryMatch;
        });
    }, [searchTerm, categoryFilters, entries]);

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

    const formatEntryForDialog = (entry: KnowledgeBaseEntry | null) => {
        if (!entry) return null;
        return {
            title: entry.name,
            description: entry.category,
            details: {
                "描述": entry.description,
                "标签": entry.tags?.join(", ") ?? '无',
                "价格": entry.price,
                "最后更新": new Date(entry.last_updated).toLocaleDateString(),
                "ID": entry.id,
            }
        };
    };

    const handleFilterChange = (category: string, checked: boolean) => {
        setCategoryFilters(prev => ({ ...prev, [category]: checked }));
    };

    return (
        <>
            <main className="p-4 md:p-6">
                <div className="flex flex-col items-center text-center mb-8">
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
                                <Input 
                                    placeholder="搜索条目名称或标签..." 
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
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>按类别筛选</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {categories.map(category => (
                                            <DropdownMenuCheckboxItem
                                                key={category}
                                                checked={categoryFilters[category] ?? false}
                                                onCheckedChange={(checked) => handleFilterChange(category, !!checked)}
                                            >
                                                {category}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 <Button disabled>
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
                                     {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <div className="flex justify-center items-center">
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    正在加载...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                         <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                                {error}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEntries.length > 0 ? (
                                        filteredEntries.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">{entry.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{entry.category}</Badge>
                                                </TableCell>
                                                <TableCell className="space-x-1">
                                                    {entry.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                                </TableCell>
                                                <TableCell>{new Date(entry.last_updated).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(entry)}>
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">查看详情</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" disabled>
                                                            <FilePenLine className="h-4 w-4" />
                                                            <span className="sr-only">编辑</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">删除</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                <p>未找到匹配的条目。</p>
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
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                item={formatEntryForDialog(selectedEntry)}
            />
        </>
    );
}
