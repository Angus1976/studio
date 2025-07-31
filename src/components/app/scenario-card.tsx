
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

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
  onEdit: () => void;
  onDelete: () => void;
};

export function ScenarioCard({ scenario, onEdit, onDelete }: ScenarioCardProps) {
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
        </Button>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>确认删除？</AlertDialogTitle>
                    <AlertDialogDescription>
                        您确定要删除能力场景 “{scenario.title}” 吗？此操作无法撤销。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>确认删除</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
