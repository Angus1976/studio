
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
import { Bot, Home, Search, UploadCloud, LogOut, User as UserIcon, Settings, Database, Library, Wand2, Briefcase, Users, UserCog } from "lucide-react";
import { useAuth, User } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const navLabels = {
  main: "AI 智能匹配",
  search: "智能搜索",
  suppliers: "供应商中心",
  prompts: "提示词管理",
  knowledgeBase: "知识库管理",
  publicResources: "公共资源库",
  creatorWorkbench: "创意者工作台",
  demandPool: "需求池",
  designers: "创意设计师",
  permissions: "权限管理",
  login: "请先登录",
  account: "我的账户",
  logout: "退出登录",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const allMenuItems = [
    { href: "/", label: navLabels.main, icon: Home, roles: ['admin', 'user', 'supplier', 'creator'] },
    { href: "/demand-pool", label: navLabels.demandPool, icon: Briefcase, roles: ['admin', 'user', 'supplier', 'creator'] },
    { href: "/designers", label: navLabels.designers, icon: Users, roles: ['admin', 'user', 'supplier', 'creator'] },
    { href: "/creator-workbench", label: navLabels.creatorWorkbench, icon: Wand2, roles: ['creator'] },
    { href: "/search", label: navLabels.search, icon: Search, roles: ['admin', 'user', 'supplier', 'creator'] },
    { href: "/suppliers", label: navLabels.suppliers, icon: UploadCloud, roles: ['admin', 'supplier'] },
    { href: "/knowledge-base", label: navLabels.knowledgeBase, icon: Database, roles: ['admin'] },
    { href: "/public-resources", label: navLabels.publicResources, icon: Library, roles: ['admin'] },
    { href: "/prompts", label: navLabels.prompts, icon: Settings, roles: ['admin'] },
    { href: "/permissions", label: navLabels.permissions, icon: UserCog, roles: ['admin'] },
  ];

  const menuItems = user ? allMenuItems.filter(item => item.roles.includes(user.role)) : [];

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
        <DropdownMenuLabel>{navLabels.account}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{navLabels.logout}</span>
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
              <span className="font-headline font-semibold text-lg">{navLabels.main}</span>
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
                    <span>{navLabels.login}</span>
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
