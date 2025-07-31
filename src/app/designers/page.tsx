
"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, PlusCircle, CheckCircle, Circle, MessageSquare } from "lucide-react";

// Mock data for creative designers
const designers = [
  {
    id: "designer-001",
    name: "Alex Chen",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["赛博朋克", "未来主义", "3D角色"],
    status: "online",
    description: "专注于创造沉浸式赛博朋克世界的资深3D艺术家。"
  },
  {
    id: "designer-002",
    name: "Emily Wang",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["有机建模", "自然场景", "写实渲染"],
    status: "online",
    description: "擅长用细腻的笔触雕刻出栩栩如生的动植物和自然景观。"
  },
  {
    id: "designer-003",
    name: "David Li",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["硬表面建模", "科幻载具", "机械设计"],
    status: "offline",
    description: "对复杂的机械结构和科幻载具有着无限的热情和创造力。"
  },
  {
    id: "designer-004",
    name: "Sophia Zhang",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["可爱风", "手办原型", "潮流玩具"],
    status: "online",
    description: "将可爱的想象变为现实，创造能温暖人心的角色和玩具。"
  },
];


export default function DesignersPage() {
    const { user } = useAuth();
    
    return (
        <main className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center mb-8">
                 <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">创意设计师</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    系统将为您推荐在线的创意设计师，您也可以直接预约他们。若没有找到合适的服务，可以将您的具体需求发布到需求池。
                </p>
                 <div className="flex gap-4 mt-6">
                     <Button size="lg">
                        <CheckCircle className="mr-2 h-5 w-5"/>
                        系统推荐
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                       <Link href="/demand-pool">
                         <Briefcase className="mr-2 h-5 w-5" />
                         去需求池发布
                       </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {designers.map(designer => (
                    <Card key={designer.id} className="flex flex-col">
                        <CardHeader className="items-center text-center">
                            <div className="relative">
                                <Avatar className="w-24 h-24 mb-4 border-4 border-muted">
                                  <AvatarImage src={designer.avatar} alt={designer.name} />
                                  <AvatarFallback>{designer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {designer.status === 'online' ? (
                                    <Badge className="absolute bottom-4 right-0 flex items-center gap-1 border-2 border-background" variant="default">
                                        <CheckCircle className="h-3 w-3" /> 在线
                                    </Badge>
                                ) : (
                                    <Badge className="absolute bottom-4 right-0 flex items-center gap-1 border-2 border-background" variant="secondary">
                                        <Circle className="h-3 w-3" /> 离线
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="font-headline text-xl">{designer.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4 text-center">
                            <p className="text-sm text-muted-foreground px-2">
                                {designer.description}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {designer.specialties.map(spec => <Badge key={spec} variant="outline">{spec}</Badge>)}
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0">
                           {designer.status === 'online' ? (
                               <div className="flex gap-2">
                                   <Button className="w-full">
                                       预约
                                   </Button>
                                   <Button className="w-full" variant="secondary">
                                       <MessageSquare className="mr-2 h-4 w-4" />
                                       沟通
                                   </Button>
                               </div>
                           ) : (
                               <Button className="w-full" disabled>
                                   预约
                               </Button>
                           )}
                        </div>
                    </Card>
                ))}
            </div>

        </main>
    );
}
