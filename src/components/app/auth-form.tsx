"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "请输入有效的电子邮件地址。" }),
  password: z.string().min(6, { message: "密码必须至少为6个字符。" }),
  role: z.string({ required_error: "请选择一个角色。" }),
});

type AuthFormProps = {
  mode: "login" | "signup";
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

const roles = {
    'platform': [
        { value: 'admin', label: '平台方 - 管理员' },
        { value: 'engineer', label: '平台方 - 技术工程师' },
    ],
    'user': [
        { value: 'tenant', label: '用户方 - 企业租户' },
        { value: 'individual', label: '用户方 - 个人用户' },
    ]
};

export function AuthForm({ mode, onSubmit, isLoading }: AuthFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>电子邮件地址</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择您的角色" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {Object.entries(roles).map(([groupName, groupRoles]) => (
                        <optgroup label={groupName === 'platform' ? '平台方' : '用户方'} key={groupName}>
                            {groupRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </optgroup>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "login" ? "登录" : "注册"}
        </Button>
      </form>
    </Form>
  );
}
