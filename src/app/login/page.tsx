"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: any) => {
    setIsLoading(true);
    console.log("登录信息:", values);
    // 在此处添加您的登录逻辑
    // 例如: const response = await api.login(values);
    setTimeout(() => {
        toast({
            title: "登录成功",
            description: "欢迎回来！",
        });
        setIsLoading(false);
        // 登录成功后重定向到主页
        router.push('/');
    }, 1000);
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          登录您的账户
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm
          mode="login"
          onSubmit={handleLogin}
          isLoading={isLoading}
        />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          还没有账户？{" "}
          <Link
            href="/signup"
            className="font-semibold leading-6 text-accent hover:text-accent/80"
          >
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
