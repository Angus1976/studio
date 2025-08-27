
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
import { Building, Code, User, Shield, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (values: any) => {
    setIsLoading(true);
    try {
        // Step 1: Sign in on the client using Firebase Auth SDK
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        
        // Step 2: Call the server action to get additional user data (like role and name)
        const result = await loginUser({ uid: userCredential.user.uid });
        
        if (result.status !== '活跃') {
             let statusMessage = `您的账户当前状态为“${result.status}”。`;
             if(result.status === '待审核') {
                statusMessage += '请等待平台管理员审核通过。';
             } else if (result.status === '已禁用') {
                 statusMessage += '请联系平台管理员。';
             }
            await auth.signOut(); // Sign out the user
            toast({
                variant: "destructive",
                title: "登录被拒绝",
                description: statusMessage,
            });
            setIsLoading(false);
            return;
        }

        // Step 3: Store session info and navigate
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', result.role);
        localStorage.setItem('userName', result.name);
        if (result.tenantId) {
            localStorage.setItem('tenantId', result.tenantId);
        } else {
            localStorage.removeItem('tenantId');
        }
        
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
            请使用您的电子邮件和密码登录
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <Card className="shadow-lg">
            <CardContent className="p-6 space-y-6">
                <div>
                     <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">平台方</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="lg" className="w-full justify-between text-base py-6">
                              <div className="flex items-center">
                                  <Shield className="mr-4 text-accent" /> 平台管理员
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>管理员登录说明</AlertDialogTitle>
                            <AlertDialogDescription>
                              平台管理员账户拥有最高权限，为安全起见，此账户由系统在后台为第一位注册的用户自动创建，不提供单独的登录入口。
                              <br/><br/>
                              如果您是平台的第一个用户并希望以管理员身份登录，请使用您注册时的邮箱和密码从下方的用户方入口登录。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogAction>我明白了</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                </div>
                
                <div className="flex items-center">
                    <Separator className="flex-1" />
                    <span className="mx-4 text-xs text-muted-foreground">用户方</span>
                    <Separator className="flex-1" />
                </div>
                
                <AuthForm
                  mode="login"
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                />
            </CardContent>
        </Card>

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
