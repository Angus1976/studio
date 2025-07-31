
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Building, Briefcase, Trash2, UploadCloud, FileUp, Video, Image as ImageIcon, AlertTriangle, Download, FileText, LoaderCircle, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { handleFileUpload } from "./actions";
import type { ProcessSupplierDataOutput } from "@/ai/flows/process-supplier-data";
import { useToast } from "@/hooks/use-toast";

const customFieldSchema = z.object({
  fieldName: z.string().min(1, "字段名不能为空"),
  fieldValue: z.string().min(1, "字段值不能为空"),
});

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
  customFields: z.array(customFieldSchema).optional(),
});

const productServiceSchema = z.object({
  products: z.array(z.object({
    name: z.string().min(1, "产品名称不能为空"),
    category: z.string().optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    media: z.any().optional(),
    customFields: z.array(customFieldSchema).optional(),
  }))
});

type SupplierInfoForm = z.infer<typeof supplierInfoSchema>;
type ProductServiceForm = z.infer<typeof productServiceSchema>;
type Supplier = ProcessSupplierDataOutput['suppliers'][0];

export default function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  
  // State for bulk processing
  const [isUploading, setIsUploading] = useState(false);
  const [processedSuppliers, setProcessedSuppliers] = useState<Supplier[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      customFields: [],
    },
  });

  const productServiceForm = useForm<ProductServiceForm>({
    resolver: zodResolver(productServiceSchema),
    defaultValues: {
      products: [{ name: "", category: "", sku: "", description: "", price: "", customFields: [] }]
    }
  });
  
  const { fields: supplierCustomFields, append: appendSupplierCustomField, remove: removeSupplierCustomField } = useFieldArray({
    control: supplierForm.control,
    name: "customFields",
  });

  const { fields, append, remove } = useFieldArray({
    control: productServiceForm.control,
    name: "products",
  });

  const onSupplierSubmit = (data: SupplierInfoForm) => {
    console.log("基本信息提交:", data);
    toast({ title: "操作成功", description: "供应商基本信息已保存。" });
  };

  const onProductSubmit = (data: ProductServiceForm) => {
    console.log("商品服务信息提交:", data);
    toast({ title: "操作成功", description: "商品/服务信息已保存。" });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: any, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      field.onChange(file);
    }
  };

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAndProcessFile(file);
    }
  };
  
  const uploadAndProcessFile = async (file: File) => {
    if (file.type !== 'text/csv') {
      toast({
        title: "文件格式错误",
        description: "请上传 CSV 格式的文件。",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setProcessedSuppliers([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      try {
        const result = await handleFileUpload(csvData);
        setProcessedSuppliers(result.suppliers);
        toast({
            title: "处理成功",
            description: `已成功处理 ${result.suppliers.length} 条供应商数据。`,
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "处理失败",
          description: "AI 处理供应商数据时发生错误，请稍后重试。",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = "公司名称,注册资本,法人,地址,业务覆盖,产地,生产规模,业务规模,渠道分布\n";
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "supplier_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
     toast({ title: "模板已开始下载" });
  };
  
  const exportData = () => {
    if (processedSuppliers.length === 0) {
      toast({ title: "无数据可导出", variant: "destructive" });
      return;
    }
    const header = "name,category,matchRate,addedDate\n";
    const csvContent = processedSuppliers.map(s => `${s.name},${s.category},${s.matchRate},${s.addedDate}`).join("\n");
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "processed_suppliers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "数据已开始导出" });
  };


  if (!user || !['admin', 'supplier'].includes(user.role)) {
    return (
      <div className="flex h-[calc(100svh-4rem)] w-full flex-col items-center justify-center text-center">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
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
          {user.role === 'admin' ? '在此管理供应商信息，或进行批量导入导出操作。' : '在此管理您的公司基本信息以及提供的商品与服务。'}
        </p>
      </div>

      <Tabs defaultValue="info" className="mx-auto max-w-5xl">
        <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="info"><Building className="mr-2" />基本信息</TabsTrigger>
          <TabsTrigger value="products"><Briefcase className="mr-2" />商品/服务</TabsTrigger>
          {user.role === 'admin' && <TabsTrigger value="batch"><UploadCloud className="mr-2" />批量处理</TabsTrigger>}
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
                       <FormField control={supplierForm.control} name="region" render={({ field }) => ( <FormItem><FormLabel>所在区域</FormLabel><FormControl><Input placeholder="例如：广东省深圳市" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>详细地址</FormLabel><FormControl><Input placeholder="例如：南山区科技园" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="establishmentDate" render={({ field }) => ( <FormItem><FormLabel>成立日期</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="registeredCapital" render={({ field }) => ( <FormItem><FormLabel>注册资本</FormLabel><FormControl><Input placeholder="例如：1000万元" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="creditCode" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>统一社会信用代码</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                       <FormField control={supplierForm.control} name="contactPhone" render={({ field }) => ( <FormItem><FormLabel>座机</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactEmail" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>邮箱</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold">补充内容</h3>
                     {supplierCustomFields.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                        <FormField
                          control={supplierForm.control}
                          name={`customFields.${index}.fieldName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>字段名</FormLabel>
                              <FormControl><Input placeholder="例如：官方网站" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={supplierForm.control}
                          name={`customFields.${index}.fieldValue`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>字段值</FormLabel>
                              <FormControl><Input placeholder="例如：https://example.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSupplierCustomField(index)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendSupplierCustomField({ fieldName: "", fieldValue: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        增加补充内容
                    </Button>
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
                       <ProductServiceItem key={item.id} form={productServiceForm} index={index} remove={remove} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ name: "", category: "", sku: "", description: "", price: "", customFields: [] })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      增加一项
                    </Button>
                    <Button type="submit">保存商品/服务</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
         {user.role === 'admin' && (
          <TabsContent value="batch">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>批量导入</CardTitle>
                        <CardDescription>上传CSV文件以批量添加或更新供应商信息。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div 
                            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-12 h-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">将文件拖放到此处，或点击浏览</p>
                            <p className="text-xs text-muted-foreground">支持的文件格式：CSV</p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={onFileSelect}
                            />
                        </div>
                        <div className="flex justify-center">
                            <Button variant="outline" onClick={downloadTemplate}><Download className="mr-2"/>下载模板</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>处理结果</CardTitle>
                        <CardDescription>导入的数据将在此处显示。</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-end mb-4">
                         <Button onClick={exportData} disabled={processedSuppliers.length === 0}><FileText className="mr-2"/>导出数据</Button>
                      </div>
                      <div className="overflow-auto border rounded-lg" style={{maxHeight: '400px'}}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>供应商名称</TableHead>
                              <TableHead>类别</TableHead>
                              <TableHead>匹配度</TableHead>
                              <TableHead>添加日期</TableHead>
                            </TableRow>
                          </TableHeader>
                           <TableBody>
                            {isUploading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            AI 正在处理数据中...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : processedSuppliers.length > 0 ? (
                              processedSuppliers.map((supplier, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{supplier.name}</TableCell>
                                  <TableCell>{supplier.category}</TableCell>
                                  <TableCell>{supplier.matchRate}%</TableCell>
                                  <TableCell>{supplier.addedDate}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">暂无数据。请上传文件开始处理。</TableCell>
                                </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

// Extracted component for product/service item to use its own useFieldArray
function ProductServiceItem({ form, index, remove }: { form: any, index: number, remove: (index: number) => void }) {
    const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({
        control: form.control,
        name: `products.${index}.customFields`
    });

    return (
        <Card className="p-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
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
                    control={form.control}
                    name={`products.${index}.price`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>价格</FormLabel>
                            <FormControl><Input placeholder="例如：¥1,299.00 或 ¥500/次" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`products.${index}.category`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>类别</FormLabel>
                            <FormControl><Input placeholder="例如：消费电子产品" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`products.${index}.sku`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU/服务代码</FormLabel>
                            <FormControl><Input placeholder="产品或服务的唯一代码" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
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
                control={form.control}
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
            
            <div className="space-y-4 mt-6">
                <h4 className="font-headline text-md font-semibold">补充内容</h4>
                {customFields.map((item, k) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`products.${index}.customFields.${k}.fieldName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>字段名</FormLabel>
                          <FormControl><Input placeholder="例如：颜色" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`products.${index}.customFields.${k}.fieldValue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>字段值</FormLabel>
                          <FormControl><Input placeholder="例如：黑色" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(k)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendCustomField({ fieldName: "", fieldValue: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    增加补充内容
                </Button>
            </div>

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
    );
}


