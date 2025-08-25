
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, Send, User, Bot } from 'lucide-react';
// import { aiRequirementsNavigator } from '@/ai/flows/ai-requirements-navigator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
// import type { RequirementsNavigatorInput } from '@/lib/data-types';

// Mocked types and functions
type Message = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

type RequirementsNavigatorInput = {
    conversationHistory: Message[];
};

type RequirementsNavigatorOutput = {
    response: string;
    isFinished: boolean;
    suggestedPromptId?: string;
};

const aiRequirementsNavigator = async (input: RequirementsNavigatorInput): Promise<RequirementsNavigatorOutput> => {
    console.log("Navigating requirements (mocked):", input);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (input.conversationHistory.length === 0) {
        return {
            response: "您好！我是您的AI需求导航器。为了给您推荐最合适的AI能力，我需要先了解一些您的基本信息。请问，您所在的企业主要从事哪个行业呢？",
            isFinished: false
        };
    }
    // Simulate finishing after one user response
    return {
        response: "感谢您的信息！根据您的描述，我将为您推荐一些营销相关的能力场景。",
        isFinished: true,
        suggestedPromptId: 'marketing-expert'
    };
};


// This component is kept for potential future use, but is currently not active in the main user flow.
export function RequirementsNavigator({ onFinish }: { onFinish: (expertId: string) => void }) {
    const { toast } = useToast();
    const [conversation, setConversation] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [conversation]);
    
    // Initial message from bot
    useEffect(() => {
        if (conversation.length === 0 && !isLoading) {
            setIsLoading(true);
            aiRequirementsNavigator({ conversationHistory: [] })
                .then(result => {
                    setConversation([{ role: 'model', parts: [{ text: result.response }] }]);
                })
                .catch(error => {
                     toast({ variant: 'destructive', title: 'AI初始化失败', description: error.message });
                })
                .finally(() => setIsLoading(false));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', parts: [{ text: input }] };
        const newConversation = [...conversation, userMessage];
        setConversation(newConversation);
        setInput('');
        setIsLoading(true);

        try {
            const result = await aiRequirementsNavigator({ conversationHistory: newConversation });
            setConversation(prev => [...prev, { role: 'model', parts: [{ text: result.response }] }]);
            
            if(result.isFinished && result.suggestedPromptId) {
                 setIsFinished(true);
                 toast({ title: "需求分析完成", description: "正在为您推荐能力场景..." });
                 onFinish(result.suggestedPromptId);
            }

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '对话出错',
                description: error.message,
            });
            // Restore conversation on error
            setConversation(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {conversation.map((msg, index) => (
                           <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'model' && (
                                     <Avatar className="h-8 w-8 bg-accent/20 text-accent">
                                        <AvatarFallback><Bot size={18}/></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-md rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-muted text-muted-foreground rounded-bl-none"
                                    )}>
                                    {msg.parts[0].text}
                                </div>
                                {msg.role === 'user' && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarFallback><User size={18}/></AvatarFallback>
                                    </Avatar>
                                )}
                           </div>
                        ))}
                         {isLoading && conversation.length > 0 && !isFinished &&(
                            <div className="flex items-start gap-3 justify-start">
                                <Avatar className="h-8 w-8 bg-accent/20 text-accent">
                                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                                </Avatar>
                                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 rounded-bl-none flex items-center">
                                    <LoaderCircle className="h-4 w-4 animate-spin"/>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="relative">
                    <Textarea
                        placeholder={isFinished ? "需求分析完成。请查看右侧推荐。" : "输入您的需求..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        disabled={isLoading || isFinished}
                        className="pr-14"
                    />
                     <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-10" disabled={isLoading || !input.trim() || isFinished}>
                        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardContent>
        </div>
    );
}
