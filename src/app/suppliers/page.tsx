
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building, Briefcase, Trash2, UploadCloud, FileUp, Video, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

// Zod schema for validation
const supplierInfoSchema = z.object({
  fullName: z.string().min(2, "请输入完整的供应商名称"),
  shortName: z.string().optional(),
  logo: z.any().optional(),
  introduction: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  establishmentDate: z.string().optional(),
  registeredCapital: z.string().optional(),
  creditCode: z.string().optional(),
  businessLicense: z.any().optional(),
  contactPerson: z.string().optional(),
  contactTitle: z.string().optional(),
  contactMobile: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
});

const productServiceSchema = z.object({
  products: z.array(z.object({
    name: z.string().min(1, "产品名称不能为空"),
    description: z.string().optional(),
    price: z.string().optional(),
    media: z.any().optional(),
  }))
});

type SupplierInfoForm = z.infer<typeof supplierInfoSchema>;
type ProductServiceForm = z.infer<typeof productServiceSchema>;


export default function SuppliersPage() {
  const { user } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const supplierForm = useForm<SupplierInfoForm>({
    resolver: zodResolver(supplierInfoSchema),
    defaultValues: {
      fullName: "",
      shortName: "",
      introduction: "",
      region: "",
      address: "",
      establishmentDate: "",
      registeredCapital: "",
      creditCode: "",
      contactPerson: "",
      contactTitle: "",
      contactMobile: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  const productServiceForm = useForm<ProductServiceForm>({
    resolver: zodResolver(productServiceSchema),
    defaultValues: {
      products: [{ name: "", description: "", price: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: productServiceForm.control,
    name: "products",
  });

  const onSupplierSubmit = (data: SupplierInfoForm) => {
    console.log("基本信息提交:", data);
    // Here you would typically call a server action to save the data
  };

  const onProductSubmit = (data: ProductServiceForm) => {
    console.log("商品服务信息提交:", data);
     // Here you would typically call a server action to save the data
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: any, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      field.onChange(file);
    }
  };

  if (!user || !['admin', 'supplier'].includes(user.role)) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <User className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-destructive/90">访问被拒绝</h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          您没有权限访问此页面。请使用管理员或供应商账户登录。
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">前往登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">供应商中心</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          在此管理您的公司基本信息以及提供的商品与服务。
        </p>
      </div>

      <Tabs defaultValue="info" className="mx-auto max-w-4xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info"><Building className="mr-2" />基本信息</TabsTrigger>
          <TabsTrigger value="products"><Briefcase className="mr-2" />商品/服务</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>供应商基本信息</CardTitle>
              <CardDescription>请填写准确、完整的公司信息。</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...supplierForm}>
                <form onSubmit={supplierForm.handleSubmit(onSupplierSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold">公司资料</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField
                        control={supplierForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>供应商全称</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：创新科技（深圳）有限公司" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={supplierForm.control}
                        name="shortName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>供应商简称</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：创新科技" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                        control={supplierForm.control}
                        name="introduction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>供应商简介</FormLabel>
                            <FormControl>
                              <Textarea placeholder="简单介绍一下您的公司..." {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={supplierForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>供应商LOGO</FormLabel>
                            <FormControl>
                               <div className="flex items-center gap-4">
                                {logoPreview && <Image src={logoPreview} alt="logo 预览" width={64} height={64} className="rounded-md object-cover" />}
                                <Input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, field, setLogoPreview)} className="hidden" />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}><FileUp className="mr-2"/>上传图片</Button>
                               </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={supplierForm.control}
                        name="businessLicense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>营业执照</FormLabel>
                            <FormControl>
                               <div className="flex items-center gap-4">
                                {licensePreview && <Image src={licensePreview} alt="营业执照预览" width={64} height={64} className="rounded-md object-cover" />}
                                <Input id="license-upload" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, field, setLicensePreview)} className="hidden" />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('license-upload')?.click()}><FileUp className="mr-2"/>上传文件</Button>
                               </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold">联系人信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField control={supplierForm.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>联系人</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactTitle" render={({ field }) => ( <FormItem><FormLabel>职务</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactMobile" render={({ field }) => ( <FormItem><FormLabel>手机</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactEmail" render={({ field }) => ( <FormItem><FormLabel>邮箱</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                  </div>

                  <Button type="submit">保存基本信息</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>商品/服务管理</CardTitle>
              <CardDescription>添加和管理贵公司提供的商品或服务。</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...productServiceForm}>
                <form onSubmit={productServiceForm.handleSubmit(onProductSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {fields.map((item, index) => (
                      <Card key={item.id} className="p-4 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                              control={productServiceForm.control}
                              name={`products.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>名称</FormLabel>
                                  <FormControl><Input placeholder="产品或服务名称" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={productServiceForm.control}
                              name={`products.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>价格</FormLabel>
                                  <FormControl><Input placeholder="例如：¥1,299.00 或 ¥500/次" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                         <FormField
                            control={productServiceForm.control}
                            name={`products.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="mt-6">
                                <FormLabel>描述</FormLabel>
                                <FormControl><Textarea placeholder="详细介绍产品或服务..." {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        <Controller
                            control={productServiceForm.control}
                            name={`products.${index}.media`}
                            render={({ field }) => (
                              <FormItem className="mt-6">
                                <FormLabel>相关媒体</FormLabel>
                                 <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input id={`media-upload-${index}`} type="file" accept="image/*,video/*" onChange={(e) => field.onChange(e.target.files?.[0])} className="hidden" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`media-upload-${index}`)?.click()}><UploadCloud className="mr-2 h-4 w-4"/>上传文件</Button>
                                    {field.value && <span className="text-sm text-muted-foreground">{field.value.name}</span>}
                                    <ImageIcon className="text-muted-foreground" />
                                    <Video className="text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ name: "", description: "", price: "" })}
                    >
                      增加一项
                    </Button>
                    <Button type="submit">保存商品/服务</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

