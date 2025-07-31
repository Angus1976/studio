
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as LucideIcons from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";


const allIcons = Object.keys(LucideIcons).filter(key => 
    typeof (LucideIcons as any)[key] === 'object' && 
    'displayName' in (LucideIcons as any)[key] && 
    (LucideIcons as any)[key].displayName !== 'createLucideIcon'
).sort();


const capabilitySchema = z.object({
  name: z.string().min(1, "能力名称不能为空"),
  icon: z.string().min(1, "请选择一个图标"),
});

type Capability = z.infer<typeof capabilitySchema> & { id: string };

const initialCapabilities: Capability[] = [
    { id: "1", name: "软件系统", icon: "Blocks" },
    { id: "2", name: "LLM", icon: "BrainCircuit" },
    { id: "3", name: "RPA", icon: "Bot" },
    { id: "4", name: "ERP", icon: "Building2" },
    { id: "5", name: "财务", icon: "Landmark" },
    { id: "6", name: "通用接口", icon: "Plug" },
];

const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const Icon = (LucideIcons as any)[name] as React.ElementType;
    if (!Icon) return <LucideIcons.Blocks {...props} />; // fallback icon
    return <Icon {...props} />;
};


function CapabilityForm({ onSave, capability, children }: { onSave: (data: Capability) => void; capability?: Capability | null, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<z.infer<typeof capabilitySchema>>({
    resolver: zodResolver(capabilitySchema),
    defaultValues: capability || { name: '', icon: '' },
  });

  React.useEffect(() => {
    if (open) {
      reset(capability || { name: '', icon: '' });
    }
  }, [open, capability, reset]);

  const onSubmit = (data: z.infer<typeof capabilitySchema>) => {
    const fullData = { ...data, id: capability?.id || `cap_${Date.now()}` };
    onSave(fullData);
    setOpen(false); // Close dialog on save
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{capability ? "编辑能力" : "新增能力"}</DialogTitle>
            <DialogDescription>
              {capability ? "修改现有能力的信息。" : "添加一个新的平台能力到库中。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">名称</Label>
              <div className="col-span-3">
                <Input id="name" {...register("name")} />
                 {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">图标</Label>
               <div className="col-span-3">
                <Controller
                    name="icon"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="选择一个图标" />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-72">
                                {allIcons.map(iconName => (
                                    <SelectItem key={iconName} value={iconName}>
                                    <div className="flex items-center gap-2">
                                        <IconComponent name={iconName} className="h-4 w-4" /> {iconName}
                                    </div>
                                    </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                    )}
                />
                 {errors.icon && <p className="text-red-500 text-xs mt-1">{errors.icon.message as string}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
             <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SystemCapabilities() {
    const { toast } = useToast();
    const [capabilities, setCapabilities] = useState<Capability[]>(initialCapabilities);
    const [configData, setConfigData] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);

    const handleSaveCapability = (data: Capability) => {
        setCapabilities(prev => {
            const existing = prev.find(c => c.id === data.id);
            if (existing) {
                return prev.map(c => c.id === data.id ? data : c);
            }
            return [...prev, data];
        });
        toast({ title: "能力已保存", description: `"${data.name}" 已被成功保存。` });
    };

    const handleDeleteCapability = (id: string) => {
        setCapabilities(prev => prev.filter(c => c.id !== id));
        toast({ title: "能力已删除", variant: 'destructive' });
    };
    
    const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newConfigData: Record<string, string> = {};
        capabilities.forEach(c => {
            const value = formData.get(c.id) as string;
            if (value) {
                newConfigData[c.id] = value;
            }
        });
        setConfigData(newConfigData);
        toast({ title: "配置已保存" });
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <LucideIcons.ClipboardCheck className="h-4 w-4" />
                    平台能力库
                </h4>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-7">
                        {isEditing ? '完成' : '编辑'}
                    </Button>
                    {isEditing && (
                        <CapabilityForm onSave={handleSaveCapability}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <LucideIcons.PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>新增能力</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CapabilityForm>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                {capabilities.map(cap => (
                    <div key={cap.id} className="group relative flex flex-col items-center justify-center gap-1 p-2 rounded-md bg-secondary/50">
                        <IconComponent name={cap.icon} className="h-5 w-5 text-accent" />
                        <span className="text-xs text-muted-foreground">{cap.name}</span>

                        {isEditing && (
                            <div className="absolute top-0 right-0 flex bg-secondary/80 rounded-bl-md rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <CapabilityForm onSave={handleSaveCapability} capability={cap}>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-5 w-5">
                                                    <LucideIcons.Pencil className="h-3 w-3" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>编辑</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CapabilityForm>
                                <Dialog>
                                    <DialogTrigger asChild>
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/80 hover:text-destructive">
                                                        <LucideIcons.Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>删除</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
                                        <p>您确定要删除 "{cap.name}" 能力吗？此操作无法撤销。</p>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
                                            <DialogClose asChild><Button variant="destructive" onClick={() => handleDeleteCapability(cap.id)}>删除</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog>
                <DialogTrigger asChild>
                     <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
                        <LucideIcons.Settings className="mr-2 h-3 w-3" />
                        配置账号/数据
                    </Button>
                </DialogTrigger>
                <DialogContent>
                     <form onSubmit={handleSaveConfig}>
                        <DialogHeader>
                            <DialogTitle>配置账号/数据</DialogTitle>
                            <DialogDescription>为平台能力配置相关的账号、API密钥或数据接口。</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                            <div className="grid gap-4 py-4">
                                {capabilities.map(cap => (
                                    <div key={cap.id} className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={cap.id} className="text-right flex items-center justify-end gap-2 text-xs">
                                        <IconComponent name={cap.icon} className="h-4 w-4" /> {cap.name}
                                        </Label>
                                        <Input 
                                            id={cap.id}
                                            name={cap.id}
                                            defaultValue={configData[cap.id] || ''}
                                            className="col-span-3"
                                            placeholder={`输入${cap.name}的配置信息...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="submit">保存配置</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
