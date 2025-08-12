
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

type ReminderTag = {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'primary';
};

export type Reminder = {
  id: string;
  icon: keyof typeof LucideIcons;
  title: string;
  description: string;
  timestamp: string;
  tags: ReminderTag[];
};

const initialReminders: Reminder[] = [
    {
        id: 'reminder-1',
        icon: 'Bell',
        title: '周报提交通知',
        description: '今天是本周周报的截止日，请在下午6点前提交。',
        timestamp: '2小时前',
        tags: [{ text: '日程提醒', variant: 'primary' }]
    },
    {
        id: 'reminder-2',
        icon: 'Lightbulb',
        title: '客户反馈洞察',
        description: '本周客户好评数较上周有所提升，建议您继续保持优质服务。',
        timestamp: '8小时前',
        tags: [{ text: '智能建议', variant: 'secondary' }]
    },
    {
        id: 'reminder-3',
        icon: 'TrendingUp',
        title: '销售线索高价值提醒',
        description: '系统分析发现客户“未来动力公司”有强烈购买意向，建议立即跟进。',
        timestamp: '昨天',
        tags: [{ text: '智能建议', variant: 'secondary' }]
    },
    {
        id: 'reminder-4',
        icon: 'ServerCog',
        title: 'OA系统维护',
        description: '今晚10点至11点，OA系统将进行升级维护。',
        timestamp: '3天前',
        tags: [{ text: '系统通知', variant: 'destructive' }]
    }
];

const IconComponent = ({ name, ...props }: { name: keyof typeof LucideIcons, [key: string]: any }) => {
    const Icon = LucideIcons[name] as React.ElementType;
    if (!Icon) return <LucideIcons.AlertCircle {...props} />; // fallback icon
    return <Icon {...props} />;
};


export function IntelligentReminders({ reminders, setReminders }: { reminders: Reminder[], setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>}) {
  const { toast } = useToast();

  React.useEffect(() => {
    // Merge initial reminders with dynamically added ones, avoiding duplicates
    setReminders(currentReminders => {
        const reminderIds = new Set(currentReminders.map(r => r.id));
        const remindersToAdd = initialReminders.filter(r => !reminderIds.has(r.id));
        // Put dynamic reminders first
        const dynamicReminders = currentReminders.filter(r => !initialReminders.some(ir => ir.id === r.id));
        return [...dynamicReminders, ...initialReminders];
    });
  }, [setReminders]);


  const handleAddToCalendar = (reminder: Reminder) => {
    // This is a mock function. In a real app, it would generate an .ics file or use a calendar API.
    const calContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${reminder.title}
DESCRIPTION:${reminder.description}
DTSTART:${new Date().toISOString()}
DTEND:${new Date().toISOString()}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([calContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reminder.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: "已添加到日历",
        description: `已为您生成 “${reminder.title}” 的日历文件。`
    });
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    toast({
        title: "提醒已删除",
        variant: "destructive"
    })
  }
  
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
            <span>智能提醒</span>
            <Badge variant="primary" className="text-sm">{reminders.length}</Badge>
        </CardTitle>
        <CardDescription>由AI生成或您亲自创建的待办事项和洞察。</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
            <div className="space-y-4 p-6 pt-0">
                {reminders.map(reminder => (
                    <Card key={reminder.id} className="group/reminder relative">
                        <CardContent className="p-4 flex items-start gap-4">
                            <div className="p-2 bg-accent/10 rounded-full mt-1">
                                <IconComponent name={reminder.icon} className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm">{reminder.title}</h4>
                                     <div className="flex flex-wrap justify-end gap-1">
                                        {reminder.tags.map(tag => (
                                            <Badge key={tag.text} variant={tag.variant} className="text-xs">{tag.text}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{reminder.description}</p>
                                <p className="text-xs text-muted-foreground pt-1">{reminder.timestamp}</p>
                            </div>
                        </CardContent>
                         <div className="absolute top-2 right-2 opacity-0 group-hover/reminder:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <LucideIcons.MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleAddToCalendar(reminder)}>
                                        <LucideIcons.CalendarPlus className="mr-2 h-4 w-4" />
                                        <span>添加到日历</span>
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
                                                <AlertDialogTitle>确认删除提醒？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   您确定要删除 “{reminder.title}” 这条提醒吗？此操作无法撤销。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>取消</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteReminder(reminder.id)}>确认</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </Card>
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
