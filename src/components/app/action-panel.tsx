
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ClipboardCheck, ExternalLink, Link, ShieldCheck, Users, Bot, BrainCircuit, Blocks, Building2, Landmark, Plug, PlusCircle, Pencil, Trash2, Database, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


type ActionPanelProps = {
  isScenarioReady: boolean;
  onGenerateTaskOrder: () => void;
  onConnectPrompt: (promptId: string) => void;
};

function SystemCapabilities() {
    const { toast } = useToast();
    const capabilities = [
        { name: "软件系统", icon: Blocks },
        { name: "LLM", icon: BrainCircuit },
        { name: "RPA", icon: Bot },
        { name: "ERP", icon: Building2 },
        { name: "财务", icon: Landmark },
        { name: "通用接口", icon: Plug },
    ];
    
    const handleActionClick = (action: string) => {
        toast({
            title: "操作提示",
            description: `已点击 "${action}" 按钮，功能待实现。`,
        });
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    平台能力库
                </h4>
                <TooltipProvider>
                    <div className="flex items-center gap-1">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleActionClick('新增')}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>新增能力</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleActionClick('编辑')}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>编辑能力</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleActionClick('删除')}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>删除能力</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                {capabilities.map(cap => (
                    <div key={cap.name} className="flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-secondary/50">
                        <cap.icon className="h-5 w-5 text-accent" />
                        <span className="text-xs text-muted-foreground">{cap.name}</span>
                    </div>
                ))}
            </div>
             <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={() => handleActionClick('配置账号数据')}>
                <Settings className="mr-2 h-3 w-3" />
                配置账号/数据
            </Button>
        </div>
    )
}


export function ActionPanel({ isScenarioReady, onGenerateTaskOrder, onConnectPrompt }: ActionPanelProps) {
  const [promptId, setPromptId] = useState("");

  const handleConnectClick = () => {
    onConnectPrompt(promptId);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-accent" />
            <span>操作</span>
          </CardTitle>
          <CardDescription>
            管理您的工作流、角色和付款。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <SystemCapabilities />
            <Separator />
            {/* Prompt Library Connector */}
            <div>
              <Label htmlFor="prompt-id" className="text-sm font-medium flex items-center gap-2 mb-2">
                <Link className="h-4 w-4" />
                提示库连接器
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="prompt-id" 
                  placeholder="输入提示 ID" 
                  value={promptId}
                  onChange={(e) => setPromptId(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={handleConnectClick}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* SecurePay */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4" />
                安全支付
              </h4>
              <p className="text-xs text-muted-foreground mb-3">通过可信的第三方平台（如天猫）担保交易，保障资金安全。</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline">
                  支付定金
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline">
                  支付尾款
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Task Order Creator */}
          <div className="mt-auto">
             <Separator className="mb-6" />
            <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!isScenarioReady}
                onClick={onGenerateTaskOrder}
            >
              确认并生成任务订单
            </Button>
            {!isScenarioReady && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                    敲定需求以生成订单。
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
