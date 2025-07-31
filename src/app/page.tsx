
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import type { Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getAiResponse } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Image as ImageIcon, Send, CornerDownLeft, Star, Wand2, Briefcase } from "lucide-react";
import Image from "next/image";
import type { GenerateUserProfileOutput } from "@/ai/flows/generate-user-profile";
import type { RecommendProductsOrServicesOutput } from "@/ai/flows/recommend-products-or-services";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { knowledgeBase, publicResources, supplierDatabases } from "@/lib/data";

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImageDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageDataUri) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      imageDataUri: previewImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");
    setPreviewImage(null);
    setImageDataUri(null);

    try {
      // Pass the full data context to the AI
      const aiResult = await getAiResponse({
          textInput: input,
          imageDataUri: imageDataUri ?? undefined,
          knowledgeBase,
          publicResources,
          supplierDatabases,
      });

      if (!aiResult || !aiResult.userProfile || !aiResult.recommendations) {
        throw new Error("AI response is incomplete.");
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "这是我为您找到的结果：",
        aiContent: aiResult,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "发生错误",
        description: `从 AI 获取回应失败: ${errorMessage}. 请检查您的API密钥并稍后重试。`,
        variant: "destructive",
      });
      // Remove the user message that caused the error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id)
      );
    } finally {
      setIsLoading(false);
    }
  };
  
    if (!user) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-primary-foreground/90">请先登录</h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          您需要登录后才能使用智能匹配功能。
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">前往登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] w-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
             <div className="p-4 bg-primary/10 rounded-full mb-4">
               <Bot className="w-10 h-10 text-primary" />
             </div>
            <h1 className="text-3xl font-headline font-bold text-primary-foreground/90">AI 智能匹配</h1>
             <p className="mt-2 text-muted-foreground max-w-md">
              描述您的需求，甚至可以上传图片。我将分析您的请求，并为您推荐最合适的产品或服务。
            </p>
            {user.role === 'creator' && (
                 <Card className="mt-8 bg-accent/10 border-accent/20 animate-in fade-in-50">
                    <CardHeader>
                        <CardTitle className="font-headline text-accent flex items-center"><Wand2 className="mr-2"/>创意者专属入口</CardTitle>
                        <CardDescription>直接进入您的创意工作台开始创作</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href="/creator-workbench">前往创作者工作台</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <LoadingMessage />}
      </div>
      <div className="border-t bg-background/80 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            {previewImage && (
                <div className="absolute bottom-full mb-2 left-0 p-2 bg-card border rounded-lg shadow-sm">
                    <Image src={previewImage} alt="图片预览" width={64} height={64} className="rounded-md object-cover"/>
                    <button type="button" onClick={() => { setPreviewImage(null); setImageDataUri(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 text-xs">&times;</button>
                </div>
            )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你的需求，什么时间花多少预算送给什么人用于什么场景的物品或服务？"
            className="w-full resize-none pr-56 pl-12 py-3 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden"/>
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary">
              <ImageIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <Button type="button" variant="outline" className="text-accent border-accent/50 hover:bg-accent/10 hover:text-accent">
                <Wand2 className="mr-2 h-4 w-4" />
                定制我的独特创意
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "思考中..." : "发送"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
         <p className="text-xs text-muted-foreground text-center mt-2">
            <CornerDownLeft className="inline w-3 h-3 mr-1" />
            <span className="font-semibold">Shift + Enter</span> 换行。
          </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
    const isAssistant = message.role === 'assistant';
    return (
        <div className={`flex items-start gap-3 ${isAssistant ? '' : 'justify-end'}`}>
            {isAssistant && (
                <Avatar className="w-9 h-9 border-2 border-primary/50">
                    <AvatarFallback className="bg-primary/20 text-primary"><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
            )}
            <div className={`flex flex-col gap-2 max-w-2xl ${isAssistant ? '' : 'items-end'}`}>
                <div className={`rounded-2xl p-4 ${isAssistant ? 'bg-card' : 'bg-primary text-primary-foreground'}`}>
                    {message.imageDataUri && (
                        <Image src={message.imageDataUri} alt="用户上传" width={200} height={200} className="rounded-lg mb-2"/>
                    )}
                    {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                    {message.aiContent?.userProfile && <UserProfileDisplay profile={message.aiContent.userProfile} />}
                    {message.aiContent?.recommendations && <RecommendationsDisplay recommendations={message.aiContent.recommendations} />}
                </div>
            </div>
             {!isAssistant && (
                <Avatar className="w-9 h-9 border-2 border-muted">
                    <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

function LoadingMessage() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-9 h-9 border-2 border-primary/50">
        <AvatarFallback className="bg-primary/20 text-primary">
          <Bot className="w-5 h-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="rounded-2xl p-4 bg-card w-full">
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProfileDisplay({ profile }: { profile: GenerateUserProfileOutput }) {
    return (
        <Card className="mt-4 bg-background/50 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline">生成的用户画像</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{profile.profileSummary}</p>
                <div className="flex flex-wrap gap-2">
                    {profile.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function RecommendationsDisplay({ recommendations }: { recommendations: RecommendProductsOrServicesOutput }) {
    const { user } = useAuth();
    return (
        <div className="mt-4">
            <h3 className="font-headline text-lg font-semibold mb-2">首要推荐</h3>
            <div className="space-y-3">
                {recommendations.recommendations.map((rec, index) => (
                    <Card key={index} className="bg-background/50 border-accent/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-semibold font-headline flex items-center">
                               <Star className="w-4 h-4 mr-2 text-accent" /> {rec}
                            </CardTitle>
                            <Button size="sm" variant="outline">查看详情</Button>
                        </CardHeader>
                    </Card>
                ))}
            </div>
             <Card className="mt-4 bg-background/50 border-dashed">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-headline">推荐理由</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{recommendations.reasoning}</p>
                </CardContent>
            </Card>
             {user?.role === 'user' && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">没有找到满意的结果？</p>
                    <Button variant="secondary" asChild>
                       <Link href="/demand-pool">
                         <Briefcase className="mr-2 h-4 w-4" />
                         发布到需求池
                       </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
