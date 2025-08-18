
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader, AlertCircle, Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/data-types";

type TaskCardProps = {
  task: Task;
  onExecute: (taskId: string) => void;
  isExecuting: boolean;
};

const statusConfig = {
  pending: { icon: Play, color: "bg-gray-400", label: "待执行" },
  in_progress: { icon: Loader, color: "bg-blue-500", label: "执行中" },
  completed: { icon: CheckCircle2, color: "bg-green-500", label: "已完成" },
  failed: { icon: AlertCircle, color: "bg-red-500", label: "失败" },
};

export function TaskCard({ task, onExecute, isExecuting }: TaskCardProps) {
  const { icon: Icon, color, label } = statusConfig[task.status];
  
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
         <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white", color)}>
            <Icon className={cn("h-6 w-6", task.status === 'in_progress' && 'animate-spin')} />
        </div>
      </div>
      <Card className="flex-1">
        <CardHeader className="p-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.agent}</CardTitle>
                <Badge variant="outline">{label}</Badge>
            </div>
          <CardDescription className="text-sm pt-1">{task.description}</CardDescription>
        </CardHeader>
        {task.status === 'pending' && (
            <CardFooter className="p-4 pt-0">
                <Button size="sm" onClick={() => onExecute(task.id)} disabled={isExecuting}>
                    {isExecuting ? '...': '执行此步骤'}
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}


export function TaskDependencyArrow() {
    return (
        <div className="h-8 flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground/50 -rotate-90" />
        </div>
    )
}
