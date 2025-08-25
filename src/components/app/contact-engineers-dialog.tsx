
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const platformExperts = [
  { name: "张工", title: "首席提示词架构师", avatar: "https://placehold.co/128x128.png", hint: "male portrait" },
  { name: "李经理", title: "客户成功经理", avatar: "https://placehold.co/128x128.png", hint: "female portrait" },
];

const thirdPartyEngineers = [
  { name: "王师傅", company: "A企科技", specialties: ["营销", "文案"], avatar: "https://placehold.co/128x128.png", hint: "male portrait" },
  { name: "陈老师", company: "B企智能", specialties: ["教育", "培训"], avatar: "https://placehold.co/128x128.png", hint: "female portrait" },
  { name: "周工", company: "C企咨询", specialties: ["金融", "代码"], avatar: "https://placehold.co/128x128.png", hint: "male portrait" },
];

export function ContactEngineersDialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();

    const handleContact = (name: string) => {
        toast({
            title: "已发送联系请求 (模拟)",
            description: `已向 ${name} 发送您的联系请求。请留意您的邮件或平台通知。`
        })
    }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>联系平台专家或认证工程师</DialogTitle>
          <DialogDescription>
            如果标准场景无法满足您的需求，可以联系我们的专家为您量身定制。
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-1">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><ShieldCheck className="text-accent" /> 平台官方专家</h3>
                    <div className="space-y-4">
                        {platformExperts.map(expert => (
                            <div key={expert.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={expert.avatar} data-ai-hint={expert.hint} />
                                        <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{expert.name}</p>
                                        <p className="text-sm text-muted-foreground">{expert.title}</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleContact(expert.name)}>
                                    <Mail className="mr-2 h-4 w-4"/>
                                    发起联系
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Code className="text-accent" /> 认证第三方工程师</h3>
                    <div className="space-y-4">
                        {thirdPartyEngineers.map(eng => (
                            <div key={eng.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={eng.avatar} data-ai-hint={eng.hint} />
                                        <AvatarFallback>{eng.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{eng.name} <span className="text-xs font-normal text-muted-foreground"> - {eng.company}</span></p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {eng.specialties.map(spec => <Badge key={spec} variant="outline">{spec}</Badge>)}
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleContact(eng.name)}>
                                     <Mail className="mr-2 h-4 w-4"/>
                                    发起联系
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
