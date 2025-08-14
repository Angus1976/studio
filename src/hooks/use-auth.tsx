"use client";

import { useState, useEffect, createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type AuthContextType = {
    isAuthenticated: boolean;
    user: User | null;
    userRole: string | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    demoLogin: (role: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser(currentUser);
                    setUserRole(userDoc.data().roleName);
                } else {
                    // This case handles demo users or if a real user's doc is missing
                    if (currentUser?.uid.startsWith('demo-')) {
                       setUser(currentUser); // Keep demo user
                    } else {
                       await signOut(auth);
                       setUser(null);
                       setUserRole(null);
                    }
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            const isDemo = user?.uid.startsWith('demo-');
            if (!isDemo) {
               await signOut(auth);
            }
            setUser(null);
            setUserRole(null);
            toast({ title: "已登出", description: "您已成功登出。" });
            router.push('/login');
        } catch (error) {
            console.error("登出失败:", error);
            toast({ variant: "destructive", title: "登出失败" });
        }
    };
    
    const demoLogin = (role: string) => {
        const demoUser = { uid: `demo-user-${Date.now()}` } as User;
        setUser(demoUser);
        setUserRole(role);
        setIsLoading(false);
    };

    const value = useMemo(() => ({
        isAuthenticated: !!user,
        user,
        userRole,
        isLoading,
        logout,
        demoLogin
    }), [user, userRole, isLoading, logout, demoLogin]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
