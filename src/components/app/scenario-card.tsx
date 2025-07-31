"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  description: string;
  industry: string;
  task: string;
  prompt: string;
};

type ScenarioCardProps = {
  scenario: Scenario;
};

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow min-h-[220px]">
      <CardHeader>
        <CardTitle className="text-lg font-headline">{scenario.title}</CardTitle>
        <CardDescription className="text-xs pt-1 h-10 overflow-hidden text-ellipsis">
          {scenario.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{scenario.industry}</Badge>
          <Badge variant="outline">{scenario.task}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 mt-auto pt-4">
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
