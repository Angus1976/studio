"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ClipboardCheck, ExternalLink, Link, ShieldCheck } from "lucide-react";

type ActionPanelProps = {
  isScenarioReady: boolean;
  onGenerateTaskOrder: () => void;
};

export function ActionPanel({ isScenarioReady, onGenerateTaskOrder }: ActionPanelProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-accent" />
            <span>Actions</span>
          </CardTitle>
          <CardDescription>
            Manage your workflow and payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Prompt Library Connector */}
            <div>
              <Label htmlFor="prompt-id" className="text-sm font-medium flex items-center gap-2 mb-2">
                <Link className="h-4 w-4" />
                Prompt Library Connector
              </Label>
              <div className="flex items-center gap-2">
                <Input id="prompt-id" placeholder="Enter Prompt ID" />
                <Button variant="outline" size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* SecurePay */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4" />
                SecurePay
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline">
                  Pay Deposit
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline">
                  Pay Final Amount
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
              Confirm & Generate Task Order
            </Button>
            {!isScenarioReady && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                    Finalize requirements to generate an order.
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
