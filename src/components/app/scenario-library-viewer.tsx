
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Scenario } from "./ai-workbench";
import { AlertTriangle, BookCopy, Wrench, Check, Users } from "lucide-react";
import { ContactEngineersDialog } from "./contact-engineers-dialog";


type ScenarioLibraryViewerProps = {
  scenarios: Scenario[];
  isLoading: boolean;
  onSelect: (scenario: Scenario) => void;
  onTune: (scenario: Scenario) => void;
};

export function ScenarioLibraryViewer({ scenarios, isLoading, onSelect, onTune }: ScenarioLibraryViewerProps) {
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookCopy className="h-6 w-6 text-accent" />
            能力场景库
          </CardTitle>
          <CardDescription>
            请先完成左侧的需求导航，AI 将为您推荐最匹配的能力场景。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BookCopy className="h-6 w-6 text-accent" />
          能力场景推荐
        </CardTitle>
        <CardDescription>
          根据您的需求，我们为您推荐了以下 AI 能力场景。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {scenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button className="w-full" onClick={() => onSelect(scenario)}>
                    <Check className="mr-2 h-4 w-4" />
                    选用此场景
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => onTune(scenario)}>
                    <Wrench className="mr-2 h-4 w-4" />
                    微调此场景
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8">
            <AlertTriangle className="h-12 w-12 mb-4 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground mb-2">未能找到完全匹配的场景</h3>
            <p className="text-sm">
                抱歉，我们的标准库中似乎没有完美匹配您独特需求的场景。
                <br />
                您可以尝试调整导航器中的需求描述，或直接联系我们的工程师为您量身定制。
            </p>
             <ContactEngineersDialog>
                <Button variant="outline" className="mt-6">
                    <Users className="mr-2 h-4 w-4" />
                    联系工程师
                </Button>
             </ContactEngineersDialog>
          </div>
        )}
      </CardContent>
       {scenarios.length > 0 && (
         <CardFooter className="border-t pt-6 flex-col items-center gap-4 text-sm text-muted-foreground text-center">
             <p>没有找到满意的？<br/>您可以联系我们的认证工程师为您量身定制专属的 AI 能力场景。</p>
            <ContactEngineersDialog>
             <Button variant="secondary">
                <Users className="mr-2 h-4 w-4" />
                联系平台认证工程师
             </Button>
            </ContactEngineersDialog>
         </CardFooter>
       )}
    </Card>
  );
}
