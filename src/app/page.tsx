"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app/header";
import { AdminDashboard } from "@/components/app/admin-dashboard";
import { TenantDashboard } from "@/components/app/tenant-dashboard";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { PromptEngineerWorkbench } from "@/components/app/prompt-engineer-workbench";
import { AppLogo } from "@/components/app/icons";
import { UserPersonaView } from "@/components/app/user-persona-view";


const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const storedRole = localStorage.getItem('userRole');
                setIsAuthenticated(true);
                setUserRole(storedRole);
            } else {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userRole');
                setIsAuthenticated(false);
                setUserRole(null);
            }
        });

        const localAuth = localStorage.getItem('isAuthenticated') === 'true';
        if (!auth.currentUser && localAuth) {
            const localRole = localStorage.getItem('userRole');
            setIsAuthenticated(true);
            setUserRole(localRole);
        } else if (!auth.currentUser && !localAuth) {
            setIsAuthenticated(false);
            setUserRole(null);
        }

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    };

    return { isAuthenticated, userRole, isLoading: isAuthenticated === null, logout };
};


export default function Home() {
  const { isAuthenticated, userRole, isLoading: isAuthLoading, logout } = useAuth();
  
  if (isAuthLoading) {
      return (
          <div className="flex h-full items-center justify-center bg-background">
              <LoaderCircle className="h-12 w-12 animate-spin text-accent" />
          </div>
      )
  }

  if (!isAuthenticated) {
    return (
         <div className="flex flex-col h-full items-center justify-center bg-background p-8 text-center">
            <AppLogo className="h-20 w-20 text-accent mb-6" />
            <h1 className="text-4xl lg:text-5xl font-bold font-headline text-foreground mb-4">欢迎来到提示词宇宙</h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
               一个面向企业和开发者的下一代、多租户SaaS平台，旨在提供集中化、结构化、可版本化的提示词管理与优化解决方案。
            </p>
            <div className="flex gap-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/login">
                        <LogIn className="mr-2" />
                        登录
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/signup">
                       <UserPlus className="mr-2" />
                       注册
                    </Link>
                </Button>
            </div>
        </div>
    )
  }

  const renderContent = () => {
    switch (userRole) {
        case 'Platform Admin':
            return <AdminDashboard />;
        case 'Tenant Admin':
            return <TenantDashboard />;
        case 'Prompt Engineer/Developer':
            return <PromptEngineerWorkbench />;
        case 'Individual User':
             return <UserPersonaView />;
        default:
            // Fallback for any other user role or if role is not defined
            return <UserPersonaView />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <AppHeader userRole={userRole} onLogout={logout} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
