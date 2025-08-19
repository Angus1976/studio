
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/ai/flows/user-auth-flow";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: any) => {
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        const result = await loginUser({ email: values.email, password: values.password });

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', result.role);
        
        toast({
            title: "登录成功",
            description: `欢迎回来, ${result.name}!`,
        });
        
        router.push('/');

    } catch (error: any) {
        console.error("Login failed:", error);
        let description = "用户名或密码不正确，请重试。";
        if (error instanceof Error) {
           if (error.message.includes("auth/invalid-credential") || error.message.includes("auth/user-not-found") || error.message.includes("auth/wrong-password")) {
                description = "用户不存在或密码错误。";
           } else {
                description = error.message;
           }
        }
        toast({
            variant: "destructive",
            title: "登录失败",
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-3xl font-bold font-headline leading-9 tracking-tight text-foreground">
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
