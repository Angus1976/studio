
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Bot, Home, Search, UploadCloud, LogOut, User as UserIcon, Settings, Database, Library } from "lucide-react";
import { useAuth, User } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allMenuItems = [
    { href: "/", label: "智能匹配", icon: Home, roles: ['admin', 'user'] },
    { href: "/search", label: "智能搜索", icon: Search, roles: ['admin', 'user', 'supplier'] },
    { href: "/suppliers", label: "供应商整合", icon: UploadCloud, roles: ['admin', 'supplier'] },
    { href: "/prompts", label: "提示词管理", icon: Settings, roles: ['admin'] },
    { href: "/knowledge-base", label: "知识库管理", icon: Database, roles: ['admin'] },
    { href: "/public-resources", label: "公共资源库", icon: Library, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter(item => user?.role && item.roles.includes(user.role));

  const UserMenu = ({ user }: { user: User }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-start gap-3 w-full h-auto p-2">
           <Avatar className="w-9 h-9 border-2 border-muted">
              <AvatarImage src={user.avatar} alt={user.name}/>
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Bot className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-semibold text-lg">AI 智能匹配</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          {user ? menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href} className="flex items-center gap-2 w-full">
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )) : (
             <SidebarMenuItem>
                <SidebarMenuButton>
                  <Link href="/login" className="flex items-center gap-2 w-full">
                    <UserIcon />
                    <span>请先登录</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
        <SidebarFooter>
         {user && <UserMenu user={user} />}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-end md:justify-between h-16 px-4 border-b">
           <div className="hidden md:block">
            {/* Can add breadcrumbs or page title here */}
           </div>
           <SidebarTrigger/>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
