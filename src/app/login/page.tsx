
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
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as z from "zod";

type DemoRole = {
  key: string;
  name: string;
  icon: React.ElementType;
  group: 'platform' | 'user';
};

// This now matches the labels in AuthForm for consistency
const demoRoles: DemoRole[] = [
    { key: 'admin', name: '平台方 - 管理员', icon: Shield, group: 'platform' },
    { key: 'engineer', name: '平台方 - 技术工程师', icon: Code, group: 'platform' },
    { key: 'tenant', name: '用户方 - 企业租户', icon: Building, group: 'user' },
    { key: 'individual', name: '用户方 - 个人用户', icon: Briefcase, group: 'user' },
];

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.string(),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Fetch user role from Firestore to ensure user exists there
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast({
          title: "登录成功",
          description: `欢迎回来, ${userData.roleName}!`,
        });
        router.push('/');
      } else {
        throw new Error("用户数据未找到。");
      }
    } catch (error: any) {
      console.error("登录失败:", error);
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error.message || "无效的凭证，请重试。",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDemoLogin = (role: DemoRole) => {
    // This now simulates a successful login by setting a demo user state
    // in a way the main page's useAuth hook can understand without localStorage.
    sessionStorage.setItem('isDemo', 'true');
    sessionStorage.setItem('demoRole', role.name);
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

       <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
            <Card className="mb-8 shadow-lg border-accent/20">
                <CardHeader>
                    <CardTitle className="text-lg text-center font-headline">一键登录演示账户</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">以不同角色体验平台</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-center font-semibold mb-4 text-foreground">平台方</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {demoRoles.filter(r => r.group === 'platform').map((role) => (
                                <Button key={role.key} variant="outline" onClick={() => handleDemoLogin(role)} className="flex items-center justify-center h-12 text-base">
                                    <role.icon className="mr-2 h-5 w-5 text-accent" />
                                    <span>{role.name.split(' - ')[1]}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-center font-semibold mb-4 text-foreground">用户方</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {demoRoles.filter(r => r.group === 'user').map((role) => (
                                <Button key={role.key} variant="outline" onClick={() => handleDemoLogin(role)} className="flex items-center justify-center h-12 text-base">
                                    <role.icon className="mr-2 h-5 w-5 text-accent" />
                                    <span>{role.name.split(' - ')[1]}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
      </div>


      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-sm text-muted-foreground mb-4">或者使用邮箱和角色登录</p>
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
