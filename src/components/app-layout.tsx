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
import { Bot, Home, Search, UploadCloud, Github } from "lucide-react";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "SmartMatch", icon: Home },
    { href: "/search", label: "Intelligent Search", icon: Search },
    { href: "/suppliers", label: "Supplier Integration", icon: UploadCloud },
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
              <span className="font-headline font-semibold text-lg">AI SmartMatch</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter>
           <Button variant="ghost" className="justify-start gap-2">
             <Github className="w-4 h-4" />
             <span className="group-data-[collapsible=icon]:hidden">GitHub</span>
           </Button>
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
