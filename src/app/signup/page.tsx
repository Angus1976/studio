"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: any) => {
    setIsLoading(true);
    console.log("注册信息:", values);
    // 在此处添加您的注册逻辑
    // 例如: const response = await api.signup(values);
    setTimeout(() => {
        toast({
            title: "注册成功",
            description: "已为您创建账户，请登录。",
        });
        setIsLoading(false);
        // 注册成功后重定向到登录页面
        router.push('/login');
    }, 1000);
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          创建新账户
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm
          mode="signup"
          onSubmit={handleSignup}
          isLoading={isLoading}
        />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          已经有账户了？{" "}
          <Link
            href="/login"
            className="font-semibold leading-6 text-accent hover:text-accent/80"
          >
            在此登录
          </Link>
        </p>
      </div>
    </div>
  );
}
