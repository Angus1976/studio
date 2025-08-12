
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, User, Briefcase, Mail, Phone, Users } from "lucide-react";
import type { Scenario } from "./designer";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type ScenarioLibraryViewerProps = {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
  onEdit: (scenario: Scenario) => void;
};

const platformEngineers = [
    { name: "张工", title: "平台方高级工程师", company: "AI 任务流平台", avatar: "https://placehold.co/128x128.png", hint: "male portrait" },
    { name: "陈工", title: "平台方解决方案架构师", company: "AI 任务流平台", avatar: "https://placehold.co/128x128.png", hint: "female portrait" },
];

const thirdPartyEngineers = [
    { name: "李总", title: "认证解决方案专家", company: "A.I. Solutions Ltd.", avatar: "https://placehold.co/128x128.png", hint: "male portrait" },
    { name: "王博士", title: "认证数据科学家", company: "Future Dynamics", avatar: "https://placehold.co/128x128.png", hint: "female portrait" },
];

function ContactEngineerDialog() {
    const { toast } = useToast();
    const handleContact = (engineerName: string) => {
        toast({
            title: "已发送联系请求",
            description: `已向工程师 ${engineerName} 发送您的联系请求。`,
        });
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">联系工程师</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>联系在线工程师</DialogTitle>
                    <DialogDescription>
                        选择一位工程师请求帮助。他们可以是平台方专家，也可以是经过认证的第三方合作伙伴。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><User className="text-accent" /> 平台方工程师</h3>
                        <div className="space-y-4">
                            {platformEngineers.map(eng => (
                                <Card key={eng.name}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <Avatar className="w-16 h-16 border">
                                            <AvatarImage src={eng.avatar} data-ai-hint={eng.hint} />
                                            <AvatarFallback>{eng.name.slice(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-bold">{eng.name}</p>
                                            <p className="text-xs text-muted-foreground">{eng.title}</p>
                                            <p className="text-xs text-muted-foreground">{eng.company}</p>
                                             <Button size="sm" className="mt-1" onClick={() => handleContact(eng.name)}>联系</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Users className="text-accent" /> 第三方认证工程师</h3>
                        <div className="space-y-4">
                            {thirdPartyEngineers.map(eng => (
                                <Card key={eng.name}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <Avatar className="w-16 h-16 border">
                                            <AvatarImage src={eng.avatar} data-ai-hint={eng.hint} />
                                            <AvatarFallback>{eng.name.slice(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-bold">{eng.name}</p>
                                            <p className="text-xs text-muted-foreground">{eng.title}</p>
                                            <p className="text-xs text-muted-foreground">{eng.company}</p>
                                            <Button size="sm" className="mt-1" onClick={() => handleContact(eng.name)}>联系</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">关闭</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export function ScenarioLibraryViewer({ scenarios, onSelect, onEdit }: ScenarioLibraryViewerProps) {

  if (scenarios.length === 0) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Library className="h-6 w-6 text-accent" />
                    推荐能力场景
                </CardTitle>
                <CardDescription>
                    根据您的需求，我们没有在场景库中找到完全匹配的场景。
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground mb-4">您可以尝试调整需求，或直接联系我们的工程师为您定制解决方案。</p>
                <ContactEngineerDialog />
            </CardContent>
        </Card>
    )
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Library className="h-6 w-6 text-accent" />
          推荐能力场景
        </CardTitle>
        <CardDescription>
          根据您的需求，我们为您推荐了以下场景。您可以直接选用，或选择一个进行微调。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{scenario.title}</CardTitle>
                  <CardDescription className="text-xs h-10">{scenario.description}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto flex-col items-stretch gap-2">
                  <Button onClick={() => onSelect(scenario)}>选用此场景</Button>
                  <Button variant="secondary" onClick={() => onEdit(scenario)}>微调此场景</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
       <CardFooter className="pt-4 border-t">
            <div className="text-center w-full">
                <p className="text-sm text-muted-foreground mb-2">没有找到合适的？</p>
                <ContactEngineerDialog />
            </div>
       </CardFooter>
    </Card>
  );
}

    