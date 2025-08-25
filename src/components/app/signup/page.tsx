
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { createUserRecord } from "@/ai/flows/user-auth-flow";
import { z } from "zod";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Code, User, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";


const roleMap: { [key: string]: string } = {
    'tenant': 'Tenant Admin',
    'engineer': 'Prompt Engineer/Developer',
    'user': 'Individual User'
};

const signupFormSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2个字符。" }),
  email: z.string().email({ message: "请输入有效的电子邮件地址。" }),
  password: z.string().min(6, { message: "密码必须至少为6个字符。" }),
});


type RegistrationRole = 'tenant' | 'engineer' | 'user';


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RegistrationRole | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: z.infer<typeof signupFormSchema>) => {
    setIsLoading(true);
    
    if (!selectedRole) {
        toast({
            variant: "destructive",
            title: "注册失败",
            description: "未选择角色，请返回重试。",
        });
        setIsLoading(false);
        return;
    }
    const fullRoleName = roleMap[selectedRole];

    try {
        // Step 1: Create user on the client using Firebase Auth SDK
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        
        // Step 2: Call the server action to create the user record in Firestore
        await createUserRecord({
            uid: userCredential.user.uid,
            email: values.email,
            role: fullRoleName,
            name: values.name,
        });

        toast({
            title: "注册成功",
            description: "已为您创建账户，请登录。",
        });
        router.push('/login');

    } catch (error: any) {
        console.error("Signup failed:", error);
        let description = "发生未知错误。";
        // Firebase Auth errors have a 'code' property
        if (error.code === 'auth/email-already-in-use') {
            description = '此电子邮件地址已被注册。';
        } else if (error.message) {
            description = error.message;
        }

        toast({
            variant: "destructive",
            title: "注册失败",
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const registrationOptions = [
    { role: 'tenant' as RegistrationRole, icon: Building, title: '企业租户', description: '为您的组织采购和管理 AI 解决方案。' },
    { role: 'engineer' as RegistrationRole, icon: Code, title: '技术工程师', description: '设计、开发和发布 AI 能力场景。' },
    { role: 'user' as RegistrationRole, icon: User, title: '个人用户', description: '使用 AI 工具解决个人工作流问题。' },
  ];

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-3xl font-bold font-headline leading-9 tracking-tight text-foreground">
          {selectedRole ? `注册为${registrationOptions.find(o => o.role === selectedRole)?.title}` : "创建新账户"}
        </h2>
         <p className="mt-2 text-center text-sm text-muted-foreground">
            {selectedRole ? "请填写以下信息完成注册。" : "请首先选择您的账户类型。"}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
            <CardContent className="p-6">
            {selectedRole ? (
                <div>
                     <Button variant="link" onClick={() => setSelectedRole(null)} className="p-0 h-auto mb-4 text-sm">
                        &larr; 返回选择角色
                     </Button>
                    <AuthForm
                        mode="signup"
                        onSubmit={handleSignup}
                        isLoading={isLoading}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {registrationOptions.map(opt => (
                        <button key={opt.role} onClick={() => setSelectedRole(opt.role)} className="w-full text-left">
                            <Card className="hover:bg-accent/10 hover:border-accent transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <opt.icon className="h-6 w-6 text-accent" />
                                        <div>
                                            <CardTitle className="text-lg">{opt.title}</CardTitle>
                                            <CardDescription>{opt.description}</CardDescription>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                            </Card>
                        </button>
                    ))}
                    <Separator className="my-4"/>
                    <p className="text-xs text-muted-foreground text-center">
                        平台方管理员角色由系统生成，不支持公开注册。
                    </p>
                </div>
            )}
            </CardContent>
        </Card>

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
