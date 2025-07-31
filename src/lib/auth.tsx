
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'user' | 'creator';
  avatar: string;
  description: string;
  status: 'active' | 'suspended' | 'blacklisted';
  rating: number; // 1 to 5
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: '李明 (管理员)',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://placehold.co/100x100.png',
    description: '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。',
    status: 'active',
    rating: 5,
  },
  {
    id: '2',
    name: '创新科技 (供应商)',
    email: 'supplier@example.com',
    role: 'supplier',
    avatar: 'https://placehold.co/100x100.png',
    description: '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。',
    status: 'active',
    rating: 4,
  },
  {
    id: '3',
    name: '张伟 (普通用户)',
    email: 'user@example.com',
    role: 'user',
    avatar: 'https://placehold.co/100x100.png',
    description: '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。',
    status: 'active',
    rating: 3,
  },
  {
    id: '4',
    name: '王芳 (创意者)',
    email: 'creator@example.com',
    role: 'creator',
    avatar: 'https://placehold.co/100x100.png',
    description: '可以访问创意工坊，利用AI工具进行内容创作和设计。',
    status: 'active',
    rating: 5,
  },
   {
    id: '5',
    name: '问题用户',
    email: 'suspended@example.com',
    role: 'user',
    avatar: 'https://placehold.co/100x100.png',
    description: '这是一个被暂停的用户账户示例。',
    status: 'suspended',
    rating: 1,
  },
];

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Find the user in mockUsers to get the latest data structure
        const fullUser = mockUsers.find(u => u.id === parsedUser.id);
        setUser(fullUser || null);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userId: string) => {
    const userToLogin = mockUsers.find((u) => u.id === userId);
    if (userToLogin) {
      if (userToLogin.status !== 'active') {
        alert(`登录失败：该账户当前状态为 "${userToLogin.status}"`);
        return;
      }
      setUser(userToLogin);
      localStorage.setItem('currentUser', JSON.stringify(userToLogin));
      router.push('/');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
