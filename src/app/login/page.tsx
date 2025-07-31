
"use client";

import { useAuth, mockUsers, User } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const getRoleBadgeVariant = (role: User['role']): "destructive" | "secondary" | "default" | "outline" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supplier':
        return 'secondary';
      case 'creator':
        return 'default'; // Using 'default' (primary color) for creator
      case 'user':
        return 'outline';
    }
  };
  
  const getRoleDisplayName = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'supplier':
        return '供应商';
      case 'creator':
        return '创意者';
      case 'user':
        return '普通用户';
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100svh-4rem)] p-4 md:p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">选择一个角色登录</h1>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            体验不同用户角色的功能。这是一个模拟登录，无需密码。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {mockUsers.map((mockUser) => (
            <Card key={mockUser.id} className="flex flex-col">
              <CardHeader className="items-center text-center">
                <Avatar className="w-20 h-20 mb-4 border-4 border-muted">
                  <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                  <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline text-2xl">{mockUser.name}</CardTitle>
                <CardDescription>
                  <Badge variant={getRoleBadgeVariant(mockUser.role)}>{getRoleDisplayName(mockUser.role)}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground text-center">{mockUser.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => login(mockUser.id)}>
                  以 {mockUser.name.split(' ')[0]} 身份登录
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

    