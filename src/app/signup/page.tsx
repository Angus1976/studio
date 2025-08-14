
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/app/icons";
import { AuthForm } from "@/components/app/auth-form";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import * as z from "zod";

const rolesMap: { [key: string]: string } = {
    'admin': '平台方 - 管理员',
    'engineer': '平台方 - 技术工程师',
    'tenant': '用户方 - 企业租户',
    'individual': '用户方 - 个人用户',
};

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.string(),
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Store user role in Firestore
      const roleName = rolesMap[values.role] || '用户方 - 个人用户';
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        roleKey: values.role,
        roleName: roleName,
        createdAt: new Date(),
      });

      toast({
        title: "注册成功",
        description: "已为您创建账户，请登录。",
      });
      router.push('/login');
    } catch (error: any) {
      console.error("注册失败:", error);
      toast({
        variant: "destructive",
        title: "注册失败",
        description: error.message || "无法创建账户，请重试。",
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
