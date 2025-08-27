
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, Pencil, Briefcase, ShieldCheck, Upload, Building, Users, ChevronDown, ChevronRight, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Role, Department, Position } from "@/lib/data-types";
import { getOrganizationStructure, saveDepartment, deleteDepartment, savePosition, deletePosition } from "@/ai/flows/tenant-management-flows";

const permissionsList = [
  { id: 'view_dashboard', label: '查看仪表盘' },
  { id: 'manage_procurement', label: '管理集采' },
  { id: 'view_orders', label: '查看订单' },
  { id: 'manage_users', label: '管理成员' },
  { id: 'manage_roles', label: '管理角色' },
  { id: 'manage_api_keys', label: '管理API密钥' },
];

const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "角色名称至少需要2个字符。" }),
  description: z.string().min(5, { message: "角色描述至少需要5个字符。" }),
  permissions: z.array(z.string()).refine(value => value.some(item => item), {
    message: "您必须至少选择一项权限。",
  }),
});

function RoleForm({ role, onSubmit, onCancel }: { role?: Role | null; onSubmit: (values: Role) => void; onCancel: () => void }) {
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: role || { name: "", description: "", permissions: [] },
  });

  React.useEffect(() => {
    form.reset(role || { name: "", description: "", permissions: [] });
  }, [role, form]);

  const handleSubmit = (values: z.infer<typeof roleSchema>) => {
    const fullData: Role = {
      ...values,
      id: role?.id || `role-${Date.now()}`,
    };
    onSubmit(fullData);
    form.reset();
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色名称</FormLabel>
              <FormControl><Input placeholder="例如：财务专员" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色描述</FormLabel>
              <FormControl><Textarea placeholder="描述此角色的主要职责..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">权限</FormLabel>
              </div>
              <div className="space-y-2">
                {permissionsList.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
          <Button type="submit">保存角色</Button>
        </div>
      </form>
    </Form>
  )
}

function RoleManagementDialog({ roles, onSave, onDelete, children }: { roles: Role[]; onSave: (role: Role) => void; onDelete: (roleId: string) => void; children: React.ReactNode; }) {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSaveRole = (values: Role) => {
    onSave(values);
    setEditingRole(null);
    setIsFormOpen(false);
  };

  const handleDeleteRole = (roleId: string) => {
    onDelete(roleId);
  };
  
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
      setEditingRole(null);
      setIsFormOpen(false);
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) handleCancelForm() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>权限角色配置</DialogTitle>
          <DialogDescription>
            自定义企业内部的角色及其权限。更改将影响分配了该角色的所有成员。
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">角色列表</CardTitle>
                <Button size="sm" onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4"/> 添加新角色</Button>
              </CardHeader>
              <CardContent>
                {isFormOpen ? (
                  <ScrollArea className="h-[400px]">
                    <RoleForm
                      role={editingRole}
                      onSubmit={handleSaveRole}
                      onCancel={handleCancelForm}
                    />
                  </ScrollArea>
                ) : (
                <ScrollArea className="h-[400px]">
                  <ul className="space-y-2">
                      {roles.map(role => (
                        <li key={role.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <div>
                            <p className="font-semibold">{role.name}</p>
                            <p className="text-xs text-muted-foreground">{role.permissions.length}项权限</p>
                          </div>
                          <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(role)}><Pencil className="h-4 w-4"/></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                </ScrollArea>
                )}
              </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">关闭</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BatchImportDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/>导入组织结构</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>导入组织结构</DialogTitle>
                    <DialogDescription>
                        此功能正在开发中。
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

const DepartmentItem = ({ department, positions, onEdit, onDelete, onAddPosition }: { department: Department, positions: Position[], onEdit: (item: Department | Position, type: 'department' | 'position') => void, onDelete: (item: Department | Position, type: 'department' | 'position') => void, onAddPosition: (departmentId: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="ml-4 pl-4 border-l">
            <div className="flex items-center justify-between group py-1">
                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                     <div className="w-6">{positions.length > 0 && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}</div>
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{department.name}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(department, 'department')}><Pencil className="h-3 w-3"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(department, 'department')}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                </div>
            </div>
            {isOpen && (
                 <div className="ml-6 pl-4 border-l space-y-1 py-1">
                    {positions.map(pos => (
                         <div key={pos.id} className="flex items-center justify-between group">
                             <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{pos.name}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(pos, 'position')}><Pencil className="h-3 w-3"/></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(pos, 'position')}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                            </div>
                         </div>
                    ))}
                     <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onAddPosition(department.id)}>+ 添加岗位</Button>
                </div>
            )}
        </div>
    )
}

const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "部门名称至少2个字符。"),
  parentId: z.string().nullable().optional(),
});
const positionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "岗位名称至少2个字符。"),
  departmentId: z.string(),
});

function OrgEditDialog({ item, itemType, departments, onSave, onCancel }: { item: Department | Position | null; itemType: 'department' | 'position'; departments: Department[], onSave: (values: any) => void; onCancel: () => void }) {
    const isEditing = !!item?.id;
    const form = useForm({
        resolver: zodResolver(itemType === 'department' ? departmentSchema : positionSchema),
        defaultValues: item || {},
    });

    useEffect(() => {
        form.reset(item || {});
    }, [item, form]);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? `编辑${itemType === 'department' ? '部门' : '岗位'}` : `添加${itemType === 'department' ? '部门' : '岗位'}`}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>名称</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        {itemType === 'department' && (
                             <FormField control={form.control} name="parentId" render={({ field }) => (
                                // A real implementation might use a Select component here.
                                <FormItem>
                                    <FormLabel>上级部门 (可选)</FormLabel>
                                    <FormControl><Input placeholder="留空则为顶级部门" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                             )}/>
                        )}
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onCancel}>取消</Button>
                            <Button type="submit">保存</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export function OrganizationAndRolesCard({ tenantId, roles, departments, positions, onSaveRole, onDeleteRole, onOrgChange }: { tenantId: string, roles: Role[], departments: Department[], positions: Position[], onSaveRole: (role: Role) => void, onDeleteRole: (roleId: string) => void, onOrgChange: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [editingItem, setEditingItem] = useState<Department | Position | null>(null);
    const [editingItemType, setEditingItemType] = useState<'department' | 'position'>('department');
    
    const handleEdit = (item: Department | Position, type: 'department' | 'position') => {
        setEditingItem(item);
        setEditingItemType(type);
    };

    const handleAdd = (type: 'department' | 'position', departmentId?: string) => {
        if (type === 'department') {
            setEditingItem({ id: '', name: '', parentId: null });
        } else {
            setEditingItem({ id: '', name: '', departmentId: departmentId! });
        }
        setEditingItemType(type);
    }
    
    const handleSave = async (values: any) => {
        try {
            if (editingItemType === 'department') {
                await saveDepartment({ tenantId, department: values });
            } else {
                await savePosition({ tenantId, position: values });
            }
            toast({ title: "保存成功" });
            setEditingItem(null);
            onOrgChange();
        } catch (e: any) {
            toast({ title: "保存失败", description: e.message, variant: "destructive" });
        }
    }
    
    const handleDelete = async (item: Department | Position, type: 'department' | 'position') => {
         try {
            if (type === 'department') {
                await deleteDepartment({ tenantId, departmentId: item.id });
            } else {
                await deletePosition({ tenantId, positionId: item.id });
            }
            toast({ title: "删除成功" });
            onOrgChange();
        } catch (e: any) {
            toast({ title: "删除失败", description: e.message, variant: "destructive" });
        }
    }
    

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             {editingItem && (
                <OrgEditDialog 
                    item={editingItem}
                    itemType={editingItemType}
                    departments={departments}
                    onSave={handleSave}
                    onCancel={() => setEditingItem(null)}
                />
            )}
            <Card>
                <CardHeader className="flex-row items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Briefcase />组织架构</CardTitle>
                        <CardDescription>管理您企业的部门和岗位。</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={() => handleAdd('department')}><PlusCircle className="mr-2 h-4 w-4"/>添加部门</Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64">
                         {isLoading ? <LoaderCircle className="animate-spin" /> : (
                            departments.filter(d => !d.parentId).map(dept => (
                                <DepartmentItem 
                                    key={dept.id} 
                                    department={dept} 
                                    positions={positions.filter(p => p.departmentId === dept.id)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onAddPosition={(deptId) => handleAdd('position', deptId)}
                                />
                            ))
                         )}
                         {!isLoading && departments.length === 0 && (
                            <div className="text-center text-muted-foreground p-4">暂无部门信息。</div>
                         )}
                    </ScrollArea>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck />权限角色配置</CardTitle>
                    <CardDescription>自定义企业内部的角色及其权限。</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">创建、编辑和删除角色，并为他们分配权限。</p>
                    <RoleManagementDialog roles={roles} onSave={onSaveRole} onDelete={onDeleteRole}>
                        <Button>配置角色</Button>
                    </RoleManagementDialog>
                </CardContent>
            </Card>
        </div>
    );
}
