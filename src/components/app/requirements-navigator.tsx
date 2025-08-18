
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { Bot, User, Send, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type RequirementsNavigatorProps = {
  history: Message[];
  isLoading: boolean;
  isFinished: boolean;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  onFormSubmit: (e: FormEvent) => Promise<void>;
};

export function RequirementsNavigator({
  history,
  isLoading,
  isFinished,
  currentInput,
  setCurrentInput,
  onFormSubmit,
}: RequirementsNavigatorProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history]);

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Bot className="h-6 w-6 text-accent" />
          AI 需求导航器
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {history.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 border border-accent/20">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs md:max-w-sm lg:max-w-xs xl:max-w-sm rounded-lg px-4 py-3 text-sm shadow",
                    message.role === "user"
                      ? "bg-primary/80 text-primary-foreground rounded-br-none"
                      : "bg-secondary text-secondary-foreground rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                 <Avatar className="h-8 w-8 border border-accent/20">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-lg px-4 py-3 shadow rounded-bl-none">
                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={onFormSubmit} className="mt-auto pt-4 border-t">
          {isFinished ? (
             <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
               需求分析完成！请在右侧查看为您推荐的解决方案。
            </div>
          ) : (
            <div className="relative">
              <Textarea
                placeholder="在此输入您的消息..."
                className="pr-16 resize-none"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onFormSubmit(e);
                  }
                }}
                rows={2}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                disabled={isLoading || !currentInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
