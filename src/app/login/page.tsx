"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Briefcase, Building } from "lucide-react";

type DemoRole = {
  key: string;
  name: string;
  icon: React.ElementType;
};

const demoRoles: DemoRole[] = [
    { key: 'admin', name: '平台方 - 管理员', icon: Shield },
    { key: 'engineer', name: '平台方 - 技术工程师', icon: User },
    { key: 'tenant', name: '用户方 - 企业租户', icon: Building },
    { key: 'individual', name: '用户方 - 个人用户', icon: Briefcase },
];


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
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', values.role);
        toast({
            title: "登录成功",
            description: "欢迎回来！",
        });
        setIsLoading(false);
        // 登录成功后重定向到主页
        router.push('/');
    }, 1000);
  };
  
  const handleDemoLogin = (role: DemoRole) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role.name);
    toast({
      title: '演示登录成功',
      description: `您现在以“${role.name}”的身份登录。`,
    });
    router.push('/');
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
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg text-center font-headline">一键登录演示账户</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {demoRoles.map((role) => (
                        <Button key={role.key} variant="outline" onClick={() => handleDemoLogin(role)}>
                            <role.icon className="mr-2" />
                            {role.name.split(' - ')[1]}
                        </Button>
                    ))}
                </CardContent>
            </Card>
      </div>


      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-sm text-muted-foreground mb-4">或者使用邮箱登录</p>
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
