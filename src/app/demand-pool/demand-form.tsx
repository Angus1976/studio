
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

const demandSchema = z.object({
  title: z.string().min(1, "需求标题不能为空"),
  category: z.string().min(1, "类别不能为空"),
  description: z.string().min(1, "详细描述不能为空"),
  budget: z.string().optional(),
  tags: z.string().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

export type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DemandFormValues) => Promise<void>;
}

export function DemandFormDialog({ isOpen, onClose, onSubmit }: DemandFormDialogProps) {
  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      budget: "",
      tags: [],
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: DemandFormValues) => {
    await onSubmit(data);
    if (!form.formState.isSubmitSuccessful) {
        // Don't reset if submission failed
    } else {
        form.reset();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">
            发布新需求
          </DialogTitle>
          <DialogDescription>
            请详细填写您的需求信息，以便供应商和创意者更好地了解。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>需求标题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：为我的新店设计一个吉祥物" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>类别</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：3D设计、品牌LOGO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>预算范围</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: ¥3000-¥5000 或 面议" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>详细描述</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="请详细描述您的需求，比如风格、颜色、参考案例、交付日期等..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field, ...rest }) => (
                <FormItem>
                  <FormLabel>标签</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="用逗号分隔, 例如: 可爱, 赛博朋克, 吉祥物"
                      // Type assertion because react-hook-form doesn't know about our transform
                      value={field.value as unknown as string}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }} disabled={isSubmitting}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                立即发布
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
