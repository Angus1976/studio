"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Code, Building, Briefcase } from "lucide-react";
import { loginUser, registerUser } from "@/ai/flows/user-auth-flow";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';


type DemoRole = {
  key: string;
  name: string;
  email: string;
  icon: React.ElementType;
  group: 'platform' | 'user';
  fullName: string;
};

const demoRoles: DemoRole[] = [
    { key: 'admin', name: '管理员', email: 'admin@example.com', icon: Shield, group: 'platform', fullName: '平台方 - 管理员' },
    { key: 'engineer', name: '技术工程师', email: 'engineer@example.com', icon: Code, group: 'platform', fullName: '平台方 - 技术工程师' },
    { key: 'tenant', name: '企业租户', email: 'tenant@example.com', icon: Building, group: 'user', fullName: '用户方 - 企业租户' },
    { key: 'individual', name: '个人用户', email: 'user@example.com', icon: Briefcase, group: 'user', fullName: '用户方 - 个人用户' },
];


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: any) => {
    setIsLoading(true);
    try {
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
        toast({
            variant: "destructive",
            title: "登录失败",
            description: error.message || "发生未知错误。",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDemoLogin = async (role: DemoRole) => {
    setIsLoading(true);
    try {
      const result = await loginUser({ email: role.email, password: 'password' });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', result.role);
      toast({
        title: '演示登录成功',
        description: `您现在以“${role.fullName}”的身份登录。`,
      });
      router.push('/');
    } catch (error: any) {
      if (error.message && error.message.includes('用户不存在')) {
        try {
          await registerUser({
            email: role.email,
            password: 'password',
            role: role.fullName,
            name: role.name,
          });

          await signInWithEmailAndPassword(clientAuth, role.email, 'password');

          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', role.fullName);
          
          toast({
            title: '演示账户已创建并登录',
            description: `欢迎体验“${role.fullName}”角色。`,
          });
          router.push('/');
        } catch (registerError: any) {
          console.error("Demo account creation failed:", registerError);
          toast({
            variant: "destructive",
            title: "演示账户创建失败",
            description: registerError.message,
          });
        }
      } else {
        console.error("Demo login failed:", error);
        toast({
          variant: "destructive",
          title: "演示账户登录失败",
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          登录您的账户
        </h2>
      </div>

       <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
            <Card className="mb-8 shadow-lg border-accent/20">
                <CardHeader>
                    <CardTitle className="text-lg text-center font-headline">一键登录演示账户</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">以不同角色体验平台（首次点击将自动创建账户）</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-center font-semibold mb-4 text-foreground">平台方</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {demoRoles.filter(r => r.group === 'platform').map((role) => (
                                <Button key={role.key} variant="outline" onClick={() => handleDemoLogin(role)} className="flex items-center justify-center h-12 text-base" disabled={isLoading}>
                                    <role.icon className="mr-2 h-5 w-5 text-accent" />
                                    <span>{role.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-center font-semibold mb-4 text-foreground">用户方</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {demoRoles.filter(r => r.group === 'user').map((role) => (
                                <Button key={role.key} variant="outline" onClick={() => handleDemoLogin(role)} className="flex items-center justify-center h-12 text-base" disabled={isLoading}>
                                    <role.icon className="mr-2 h-5 w-5 text-accent" />
                                    <span>{role.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
      </div>


      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-sm text-muted-foreground mb-4">或者使用您的邮箱和密码登录</p>
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
