
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ClipboardCheck, ExternalLink, Link, ShieldCheck, Users, Bot, BrainCircuit, Blocks, Building2, Landmark, Plug } from "lucide-react";

type ActionPanelProps = {
  isScenarioReady: boolean;
  onGenerateTaskOrder: () => void;
  onConnectPrompt: (promptId: string) => void;
};

function RoleManagement() {
    return (
        <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                角色管理
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">平台方:</span> 管理员, 技术工程师</p>
                <p><span className="font-semibold text-foreground">用户方:</span> 企业租户, 个人用户</p>
            </div>
        </div>
    )
}

function SystemCapabilities() {
    const capabilities = [
        { name: "软件系统", icon: Blocks },
        { name: "LLM", icon: BrainCircuit },
        { name: "RPA", icon: Bot },
        { name: "ERP", icon: Building2 },
        { name: "财务", icon: Landmark },
        { name: "通用接口", icon: Plug },
    ];
    return (
        <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4" />
                平台能力库
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
                {capabilities.map(cap => (
                    <div key={cap.name} className="flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-secondary/50">
                        <cap.icon className="h-5 w-5 text-accent" />
                        <span className="text-xs text-muted-foreground">{cap.name}</span>
                    </div>
                ))}
            </div>
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
            <RoleManagement />
            <Separator />
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
