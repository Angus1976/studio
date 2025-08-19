
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

const roleMap: { [key: string]: string } = {
    'admin': 'Platform Admin',
    'tenant': 'Tenant Admin',
    'engineer': 'Prompt Engineer/Developer',
    'user': 'Individual User'
};

const signupSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2个字符。" }),
  email: z.string().email({ message: "请输入有效的电子邮件地址。" }),
  password: z.string().min(6, { message: "密码必须至少为6个字符。" }),
  role: z.string({ required_error: "请选择一个角色。" }),
});


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    
    const fullRoleName = roleMap[values.role];

    if (!fullRoleName) {
        toast({
            variant: "destructive",
            title: "注册失败",
            description: "选择了无效的角色。",
        });
        setIsLoading(false);
        return;
    }

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

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AppLogo className="mx-auto h-12 w-auto text-accent" />
        <h2 className="mt-6 text-center text-3xl font-bold font-headline leading-9 tracking-tight text-foreground">
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
