
"use client";

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

type TaskTag = {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'primary';
};

type TaskStatus = '待确认' | '执行中' | '已完成' | '失败' | '待处理';

export type Task = {
  id: string;
  icon: keyof typeof LucideIcons;
  title: string;
  description: string;
  timestamp: string;
  status: TaskStatus;
  tags: TaskTag[];
};

const initialTasks: Task[] = [
    {
        id: 'task-1',
        icon: 'Bell',
        title: '周报提交通知',
        description: '今天是本周周报的截止日，请在下午6点前提交。',
        timestamp: '2小时前',
        status: '待处理',
        tags: [{ text: '日程提醒', variant: 'primary' }]
    },
    {
        id: 'task-2',
        icon: 'Lightbulb',
        title: '分析Q3销售数据',
        description: 'AI将连接CRM，分析第三季度销售数据并生成初步报告。',
        timestamp: '8小时前',
        status: '待确认',
        tags: [{ text: '数据分析', variant: 'secondary' }]
    },
    {
        id: 'task-3',
        icon: 'Bot',
        title: '发送营销邮件',
        description: '正在向“新用户”列表发送欢迎邮件系列。',
        timestamp: '进行中',
        status: '执行中',
        tags: [{ text: '营销自动化', variant: 'outline' }]
    },
    {
        id: 'task-4',
        icon: 'CheckCircle',
        title: '生成上周招聘简报',
        description: '已完成对上周候选人数据的分析，并生成简报。',
        timestamp: '昨天',
        status: '已完成',
        tags: [{ text: '人力资源', variant: 'outline' }]
    }
];

const IconComponent = ({ name, ...props }: { name: keyof typeof LucideIcons, [key: string]: any }) => {
    const Icon = LucideIcons[name] as React.ElementType;
    if (!Icon) return <LucideIcons.AlertCircle {...props} />; // fallback icon
    return <Icon {...props} />;
};

const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
        case '待确认':
            return { color: 'bg-yellow-500', icon: LucideIcons.HelpCircle };
        case '执行中':
            return { color: 'bg-blue-500 animate-pulse', icon: LucideIcons.LoaderCircle };
        case '已完成':
            return { color: 'bg-green-500', icon: LucideIcons.CheckCircle };
        case '失败':
            return { color: 'bg-red-500', icon: LucideIcons.XCircle };
        case '待处理':
            return { color: 'bg-gray-400', icon: LucideIcons.Clock };
        default:
            return { color: 'bg-gray-400', icon: LucideIcons.Clock };
    }
};


export function TaskDispatchCenter({ tasks, setTasks }: { tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>}) {
  const { toast } = useToast();

  React.useEffect(() => {
    // Merge initial tasks with dynamically added ones, avoiding duplicates
    setTasks(currentTasks => {
        const taskIds = new Set(currentTasks.map(r => r.id));
        const tasksToAdd = initialTasks.filter(r => !taskIds.has(r.id));
        // Put dynamic reminders first
        const dynamicTasks = currentTasks.filter(r => !initialTasks.some(ir => ir.id === r.id));
        return [...dynamicTasks, ...initialTasks];
    });
  }, [setTasks]);


  const handleConfirmTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '执行中' } : t));
    toast({
        title: "任务已开始执行",
        description: "AI Agent正在处理您的请求。"
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(r => r.id !== taskId));
    toast({
        title: "任务已删除",
        variant: "destructive"
    })
  }
  
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
            <span>任务调度中心</span>
            <Badge variant="primary" className="text-sm">{tasks.length}</Badge>
        </CardTitle>
        <CardDescription>由AI规划或您亲自创建的待办任务和自动化流程。</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
            <div className="space-y-4 p-6 pt-0">
                {tasks.map(task => {
                    const statusConfig = getStatusConfig(task.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                    <Card key={task.id} className="group/task relative">
                        <CardContent className="p-4 flex items-start gap-4">
                             <div className="relative mt-1">
                                <div className="p-2 bg-accent/10 rounded-full">
                                    <IconComponent name={task.icon} className="h-5 w-5 text-accent" />
                                </div>
                                <div className={cn("absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card", statusConfig.color)} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm">{task.title}</h4>
                                     <div className="flex flex-wrap justify-end gap-1">
                                        {task.tags.map(tag => (
                                            <Badge key={tag.text} variant={tag.variant} className="text-xs">{tag.text}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                    <StatusIcon className={cn("h-3 w-3", task.status === '执行中' && 'animate-spin')} />
                                    <span>{task.status}</span>
                                    <span>·</span>
                                    <span>{task.timestamp}</span>
                                </div>
                            </div>
                        </CardContent>
                         {task.status === '待确认' && (
                             <CardFooter className="p-2 pt-0 border-t mx-4">
                                <Button size="sm" className="w-full" onClick={() => handleConfirmTask(task.id)}>
                                    <LucideIcons.Check className="mr-2 h-4 w-4" />
                                    一键确认并执行
                                </Button>
                             </CardFooter>
                         )}
                         <div className="absolute top-2 right-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <LucideIcons.MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <LucideIcons.Info className="mr-2 h-4 w-4" />
                                        <span>查看详情</span>
                                    </DropdownMenuItem>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                 <LucideIcons.Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                                 <span className="text-destructive">删除</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   您确定要删除 “{task.title}” 这条任务吗？此操作无法撤销。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>取消</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>确认</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Card>
                    )
                })}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
