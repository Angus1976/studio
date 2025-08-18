
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { registerUser } from "@/ai/flows/user-auth-flow";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


// Define a separate schema for the signup form
const signupFormSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2个字符。" }),
  email: z.string().email({ message: "请输入有效的电子邮件地址。" }),
  password: z.string().min(6, { message: "密码必须至少为6个字符。" }),
  role: z.string({ required_error: "请选择一个角色。" }),
});


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: undefined,
    },
  });


  const handleSignup = async (values: z.infer<typeof signupFormSchema>) => {
    setIsLoading(true);
    
    // This maps the form role key (e.g., 'individual') to the full role name
    const roleMap: { [key: string]: string } = {
        'admin': '平台方 - 管理员',
        'engineer': '平台方 - 技术工程师',
        'tenant': '用户方 - 企业租户',
        'individual': '用户方 - 个人用户',
    };
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
        await registerUser({
            email: values.email,
            password: values.password,
            role: fullRoleName,
            name: values.name
        });

        toast({
            title: "注册成功",
            description: "已为您创建账户，请登录。",
        });
        router.push('/login');
    } catch (error: any) {
        console.error("Signup failed:", error);
        toast({
            variant: "destructive",
            title: "注册失败",
            description: error.message || "发生未知错误。",
        });
    } finally {
        setIsLoading(false);
    }
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
