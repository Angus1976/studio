
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import type { KnowledgeBaseEntry } from "./page";
import { useEffect } from "react";

const entrySchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  category: z.string().min(1, "类别不能为空"),
  description: z.string().min(1, "描述不能为空"),
  price: z.string().optional(),
  tags: z.string().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

export type KnowledgeBaseFormValues = z.infer<typeof entrySchema>;

interface EntryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KnowledgeBaseFormValues) => Promise<void>;
  defaultValues?: KnowledgeBaseEntry | null;
}

export function EntryFormDialog({ isOpen, onClose, onSubmit, defaultValues }: EntryFormDialogProps) {
  const form = useForm<KnowledgeBaseFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultValues,
        tags: defaultValues.tags ? defaultValues.tags.join(', ') : '',
      });
    } else {
      form.reset({
        name: "",
        category: "",
        description: "",
        price: "",
        tags: '',
      });
    }
  }, [defaultValues, form]);

  const { isSubmitting } = form.formState;
  const isEditing = !!defaultValues;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isEditing ? "编辑知识条目" : "新增知识条目"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "修改以下信息以更新条目。" : "填写以下信息以创建新条目。"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：赛博朋克飞行摩托" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类别</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：载具" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="对该条目进行详细描述..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>价格</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: ¥1999.00 或 面议" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input placeholder="用逗号分隔, 例如: 未来, 科幻, 交通工具" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "保存更改" : "创建条目"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    