
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import type { Message, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getAiResponse } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Image as ImageIcon, Send, ArrowRight, CornerDownLeft, Star, Briefcase, Diamond, CheckCircle, Wand2, ExternalLink, Eye } from "lucide-react";
import Image from "next/image";
import type { GenerateUserProfileOutput } from "@/ai/flows/generate-user-profile";
import type { RecommendProductsOrServicesOutput } from "@/ai/flows/recommend-products-or-services";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

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
      const aiResult = await getAiResponse({
          textInput: input,
          imageDataUri: imageDataUri ?? undefined,
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
        description: `从 AI 获取回应失败: ${errorMessage}. 请稍后重试。`,
        variant: "destructive",
      });
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id)
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center p-4">
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
    <main className="p-4 md:p-8 flex-1">
        <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">欢迎光临“情动于艺”</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
                与AI导购对话,发现为您量身推荐的独特设计,部分商品更支持个性化定制。
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: AI Chat */}
            <Card className="lg:col-span-2 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">AI购物助手</CardTitle>
                    <CardDescription>告诉我您的想法,我会为您找到完美的作品。</CardDescription>
                </CardHeader>
                <CardContent ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-6">
                     {messages.length === 0 && !isLoading && (
                        <div className="flex items-start gap-3">
                           <Avatar className="w-9 h-9 border-2 border-primary/50">
                              <AvatarFallback className="bg-primary/20 text-primary"><Bot className="w-5 h-5" /></AvatarFallback>
                           </Avatar>
                           <div className="rounded-2xl p-4 bg-card max-w-2xl">
                              <p className="whitespace-pre-wrap">您好!我是您的专属购物助手。请问您在寻找什么?比如,是为自己选购,还是为朋友挑选</p>
                           </div>
                        </div>
                    )}
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isLoading && <LoadingMessage />}
                </CardContent>
                <div className="border-t bg-background/80 backdrop-blur-sm p-4 rounded-b-lg">
                   <form onSubmit={handleSendMessage} className="relative">
                        {previewImage && (
                            <div className="absolute bottom-full mb-2 left-0 p-2 bg-card border rounded-lg shadow-sm">
                                <Image src={previewImage} alt="图片预览" width={64} height={64} className="rounded-md object-cover"/>
                                <button type="button" onClick={() => { setPreviewImage(null); setImageDataUri(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 text-xs">&times;</button>
                            </div>
                        )}
                      <div className="flex items-center gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden"/>
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary">
                          <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="例如: 我想找一个送给科幻迷的礼物..."
                          className="w-full resize-none py-2 text-base"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          rows={1}
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                          <Send className="w-5 h-5" />
                          <span className="sr-only">发送</span>
                        </Button>
                      </div>
                    </form>
                </div>
            </Card>

            {/* Right Column: Customization Service */}
            <div className="flex flex-col gap-8">
                 {user?.role === 'creator' && (
                     <Button asChild size="lg" className="w-full">
                        <Link href="/creator-workbench">
                            <Wand2 className="mr-2 h-5 w-5" />
                            进入创作者工作台
                        </Link>
                    </Button>
                 )}
                <Card className="bg-accent/20 border-accent/30">
                    <CardHeader className="text-center p-4 pb-2">
                        <div className="inline-block p-2 bg-primary/10 rounded-full mb-2 mx-auto border-2 border-primary/20">
                          <Diamond className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-lg text-primary-foreground/90">高端定制服务</CardTitle>
                        <CardDescription className="text-xs max-w-xs mx-auto pt-1">
                            将您的构想变为现实。我们的顶尖设计师将与您合作,打造专属艺术品。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-1">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                            <li className="flex items-start">
                                <ArrowRight className="w-3 h-3 mr-1.5 mt-0.5 text-primary shrink-0" />
                                <span>与专业3D艺术家深度沟通</span>
                            </li>
                             <li className="flex items-start">
                                <ArrowRight className="w-3 h-3 mr-1.5 mt-0.5 text-primary shrink-0" />
                                <span>从草图到模型的全程跟进</span>
                            </li>
                             <li className="flex items-start">
                                <ArrowRight className="w-3 h-3 mr-1.5 mt-0.5 text-primary shrink-0" />
                                <span>使用顶级材质和工艺制作</span>
                            </li>
                        </ul>
                    </CardContent>
                    <div className="p-4 pt-2">
                        <Button className="w-full bg-primary/90 hover:bg-primary text-primary-foreground" size="sm" asChild>
                           <Link href="/designers">
                            预约设计师 (付费) <ArrowRight className="ml-2 w-4 h-4" />
                           </Link>
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </main>
  );
}

function ChatMessage({ message }: { message: Message }) {
    const isAssistant = message.role === 'assistant';
    const { user } = useAuth();

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
                    {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
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
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-headline">生成的用户画像</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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

function ProductCard({ product }: { product: Product }) {
    return (
        <Card className="bg-background/50 border-accent/20 overflow-hidden flex flex-col">
            <div className="relative aspect-video">
                <Image 
                    src={product.panoramicImage} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                    data-ai-hint="panoramic product image"
                />
            </div>
            <div className="flex flex-col flex-grow p-4">
                <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base font-semibold font-headline flex-grow">{product.name}</CardTitle>
                    <div className="text-lg font-bold text-primary whitespace-nowrap flex-shrink-0">{product.price}</div>
                </div>
                <CardDescription className="text-xs pt-1 mt-1 flex-grow">{product.description}</CardDescription>
            </div>
            <CardFooter className="p-4 pt-2 flex gap-2">
                 <Button size="sm" className="w-full" variant="outline" asChild>
                    <Link href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">
                       <Eye className="mr-2 h-4 w-4" /> 查看详情
                    </Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                    <Link href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">
                       立即购买 <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function RecommendationsDisplay({ recommendations }: { recommendations: RecommendProductsOrServicesOutput }) {
    const { user } = useAuth();
    return (
        <div className="mt-4">
            <h3 className="font-headline text-lg font-semibold mb-3">首要推荐</h3>
            <div className="grid grid-cols-1 gap-4">
                {recommendations.recommendations.map((rec, index) => (
                    <ProductCard key={index} product={rec} />
                ))}
            </div>
             <Card className="mt-4 bg-background/50 border-dashed">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-headline">推荐理由</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recommendations.reasoning}</p>
                </CardContent>
            </Card>
             {user?.role === 'user' && (
                <div className="mt-6 text-center">
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
