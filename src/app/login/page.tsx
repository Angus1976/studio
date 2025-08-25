
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
import { Button } from "@/components/ui/button";
import { Building, Code, User, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: any) => {
    setIsLoading(true);
    try {
        // Step 1: Sign in on the client using Firebase Auth SDK
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        
        // Step 2: Call the server action to get additional user data (like role)
        const result = await loginUser({ uid: userCredential.user.uid });

        // Step 3: Store session info and navigate
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', result.role);
        
        toast({
            title: "登录成功",
            description: `欢迎回来, ${result.name}!`,
        });
        
        router.push('/');

    } catch (error: any) {
        console.error("Login failed:", error);
        let description = "登录时发生未知错误。";
        // Firebase Auth errors have a 'code' property
        switch (error.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
                description = "用户不存在或密码错误。";
                break;
            case "auth/invalid-credential":
                 description = "用户不存在或密码错误。";
                break;
            default:
                description = error.message || description;
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
        <p className="mt-2 text-center text-sm text-muted-foreground">
            请选择您的登录角色
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-8 shadow-lg rounded-lg sm:px-12 space-y-6">
            <div>
                 <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">平台方</h3>
                 <div className="grid grid-cols-1 gap-4">
                     <Button variant="outline" size="lg" className="justify-start text-base py-6">
                         <Shield className="mr-4 text-accent" /> 平台管理员
                     </Button>
                 </div>
            </div>
            
            <div className="flex items-center">
                <Separator className="flex-1" />
                <span className="mx-4 text-xs text-muted-foreground">或</span>
                <Separator className="flex-1" />
            </div>

            <div>
                <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">用户方</h3>
                 <div className="grid grid-cols-1 gap-4">
                     <Button variant="outline" size="lg" className="justify-start text-base py-6">
                         <Building className="mr-4 text-accent" /> 企业租户
                     </Button>
                     <Button variant="outline" size="lg" className="justify-start text-base py-6">
                         <Code className="mr-4 text-accent" /> 技术工程师
                     </Button>
                      <Button variant="outline" size="lg" className="justify-start text-base py-6">
                         <User className="mr-4 text-accent" /> 个人用户
                     </Button>
                 </div>
            </div>
             <Separator />
            <AuthForm
              mode="login"
              onSubmit={handleLogin}
              isLoading={isLoading}
            />
        </div>

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
