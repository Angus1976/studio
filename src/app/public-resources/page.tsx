
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Library } from "lucide-react";

export default function PublicResourcesPage() {
    const { user } = useAuth();

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

    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
                 <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <Library className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">公共资源库管理</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    管理外部链接、API接口及其他关联信息。支持批量导入和导出，丰富AI的数据维度。
                </p>
            </div>

            <div className="mx-auto mt-8 max-w-7xl text-center">
                {/* Future implementation of public resources management UI will go here */}
                <p className="text-muted-foreground">(功能开发中...)</p>
            </div>
        </main>
    );
}
