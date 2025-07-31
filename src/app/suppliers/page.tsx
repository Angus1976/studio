
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileSpreadsheet, LoaderCircle, AlertCircle, User } from "lucide-react";
import { handleFileUpload } from "./actions";
import type { ProcessSupplierDataOutput } from "@/ai/flows/process-supplier-data";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

type Supplier = ProcessSupplierDataOutput['suppliers'][0];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuppliers([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      try {
        const result = await handleFileUpload(csvData);
        setSuppliers(result.suppliers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "处理文件时发生未知错误。");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("读取文件失败。");
      setIsLoading(false);
    };
    reader.readAsText(file);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  if (!user || !['admin', 'supplier'].includes(user.role)) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <User className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-destructive/90">访问被拒绝</h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          您没有权限访问此页面。请使用管理员或供应商账户登录。
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">前往登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">供应商整合</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          让供应商通过电子表格批量导入数据，并自动评估供应商匹配度。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">导入供应商数据</CardTitle>
            <CardDescription>上传 CSV 文件以添加或更新供应商信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-12 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                disabled={isLoading}
              />
              <div className="rounded-full border bg-card p-4">
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">将文件拖放到此处或点击浏览</p>
              <Button onClick={triggerFileSelect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    选择电子表格
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 flex items-center justify-center text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">当前供应商</CardTitle>
            <CardDescription>当前数据库中的供应商列表。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>供应商名称</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead className="w-[180px]">匹配率</TableHead>
                  <TableHead>添加日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                       <div className="flex justify-center items-center py-10">
                            <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
                            <p className="ml-4">AI 正在分析数据...</p>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      无供应商数据。上传文件以开始。
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && suppliers.length > 0 && suppliers.map((supplier) => (
                  <TableRow key={supplier.name}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{supplier.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={supplier.matchRate} className="h-2" />
                        <span>{supplier.matchRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.addedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
