
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
import { Bot, Home, Search, UploadCloud } from "lucide-react";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "智能匹配", icon: Home },
    { href: "/search", label: "智能搜索", icon: Search },
    { href: "/suppliers", label: "供应商整合", icon: UploadCloud },
  ];

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter>
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
