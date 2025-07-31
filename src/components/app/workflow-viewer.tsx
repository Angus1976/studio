"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, SlidersHorizontal } from "lucide-react";

type WorkflowViewerProps = {
  tasks: string;
};

export function WorkflowViewer({ tasks }: WorkflowViewerProps) {
  // Assuming tasks are newline-separated. Clean up any empty lines.
  const taskList = tasks.split('\n').map(task => task.trim().replace(/^- /,'')).filter(Boolean);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-accent"/>
            Workflow Viewer
        </CardTitle>
        <CardDescription>
            These tasks have been identified for AI automation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {taskList.length > 0 ? (
            <ul className="space-y-3">
            {taskList.map((task, index) => (
                <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{task}</span>
                </li>
            ))}
            </ul>
        ) : (
            <p className="text-sm text-muted-foreground">No automatable tasks were identified.</p>
        )}
      </CardContent>
    </Card>
  );
}
