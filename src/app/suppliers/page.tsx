
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
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
import { User, Building, Briefcase, Trash2, UploadCloud, FileUp, Video, Image as ImageIcon, AlertTriangle, Download, FileText, LoaderCircle, PlusCircle, Link as LinkIcon, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { handleFileUpload } from "./actions";
import type { ProcessSupplierDataOutput } from "@/ai/flows/process-supplier-data";
import { useToast } from "@/hooks/use-toast";
import { ItemDetailsDialog } from "@/components/item-details-dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

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
  contactWeCom: z.string().optional(),
  customFields: z.array(customFieldSchema).optional(),
});

const productServiceSchema = z.object({
  products: z.array(z.object({
    name: z.string().min(1, "产品名称不能为空"),
    category: z.string().optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    purchaseLink: z.string().url("请输入有效的链接").optional().or(z.literal("")),
    mediaPanoramic: z.any().optional(),
    mediaTop: z.any().optional(),
    mediaBottom: z.any().optional(),
    mediaLeft: z.any().optional(),
    mediaRight: z.any().optional(),
    mediaFront: z.any().optional(),
    mediaBack: z.any().optional(),
    customFields: z.array(customFieldSchema).optional(),
  }))
});

type SupplierInfoForm = z.infer<typeof supplierInfoSchema>;
type ProductServiceForm = z.infer<typeof productServiceSchema>;
type Supplier = ProcessSupplierDataOutput['suppliers'][0] & { rawData?: string };


export default function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // State for bulk processing
  const [isUploading, setIsUploading] = useState(false);
  const [processedSuppliers, setProcessedSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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
      contactWeCom: "",
      customFields: [],
    },
  });

  const productServiceForm = useForm<ProductServiceForm>({
    resolver: zodResolver(productServiceSchema),
    defaultValues: {
      products: [{ 
        name: "", 
        category: "", 
        sku: "", 
        description: "", 
        price: "", 
        purchaseLink: "", 
        customFields: [] 
      }]
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

  const onSupplierSubmit = async (data: SupplierInfoForm) => {
    if (!user) {
        toast({ title: "错误", description: "请先登录", variant: "destructive" });
        return;
    }
    
    // NOTE: In a real app, file uploads would be handled properly (e.g., to a cloud storage service)
    // For this demo, we'll just log that they exist and send the other text-based data.
    const { logo, businessLicense, ...supplierData } = data;
    console.log("Logo file to upload:", logo);
    console.log("Business license file to upload:", businessLicense);

    try {
        await api.put(`/api/suppliers/${user.id}`, {
            // Mapping frontend camelCase to backend snake_case
            full_name: supplierData.fullName,
            short_name: supplierData.shortName,
            introduction: supplierData.introduction,
            region: supplierData.region,
            address: supplierData.address,
            establishment_date: supplierData.establishmentDate,
            registered_capital: supplierData.registeredCapital,
            credit_code: supplierData.creditCode,
            contact_person: supplierData.contactPerson,
            contact_title: supplierData.contactTitle,
            contact_mobile: supplierData.contactMobile,
            contact_phone: supplierData.contactPhone,
            contact_email: supplierData.contactEmail,
            contact_wecom: supplierData.contactWeCom,
            custom_fields: supplierData.customFields,
            // logo_url and business_license_url would be set after file upload
        });
        toast({ title: "操作成功", description: "供应商基本信息已保存。" });
    } catch (err) {
        console.error("Failed to save supplier info:", err);
        toast({ title: "保存失败", description: "无法保存供应商信息，请稍后重试。", variant: "destructive" });
    }
  };

  const onProductSubmit = async (data: ProductServiceForm) => {
    if (!user) {
        toast({ title: "错误", description: "请先登录", variant: "destructive" });
        return;
    }

    // In a real app, you would handle the media files.
    // For this DEMO, we just log the form data and send text-based fields.
    try {
        for (const product of data.products) {
            const { mediaPanoramic, mediaTop, mediaBottom, mediaLeft, mediaRight, mediaFront, mediaBack, ...productData } = product;

            // Log files that would be uploaded
            console.log(`Files for product "${productData.name}":`, { mediaPanoramic, mediaTop, mediaBottom, mediaLeft, mediaRight, mediaFront, mediaBack });

            await api.post(`/api/suppliers/${user.id}/products`, {
                // Mapping frontend camelCase to backend snake_case
                name: productData.name,
                category: productData.category,
                sku: productData.sku,
                description: productData.description,
                price: productData.price,
                purchase_url: productData.purchaseLink,
                custom_fields: productData.customFields,
                // media_... urls would be set after file uploads
            });
        }
        toast({ title: "操作成功", description: "商品/服务信息已保存。" });
    } catch (err) {
        console.error("Failed to save product(s):", err);
        toast({ title: "保存失败", description: "无法保存商品/服务信息，请稍后重试。", variant: "destructive" });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: any, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      supplierForm.setValue(fieldName, file);
    }
  };

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAndProcessFile(file);
    }
  };

   const handleDragEvents = (e: DragEvent<HTMLDivElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(isOver);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        uploadAndProcessFile(file);
    }
  };
  
  const uploadAndProcessFile = async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
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
        // Attach raw data for view details
        const suppliersWithRawData = result.suppliers.map((supplier, index) => ({
          ...supplier,
          rawData: csvData.split('\n').slice(3)[index] || 'N/A' // Crude but works for demo
        }));
        setProcessedSuppliers(suppliersWithRawData);

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
    reader.readAsText(file, 'utf-8');
  };

  const downloadTemplate = () => {
    // Helper to repeat a string
    const repeat = (str: string, times: number) => new Array(times).fill(str).join('');

    // Define header structure
    const header1 = [
        `基本信息${repeat(',', 8)}`,
        `经营范围${repeat(',', 5)}`,
        `标品（标准内容）交付${repeat(',', 3)}`,
        `标品（标准内容）关键词备注/建议${repeat(',', 2)}`,
        `定制（客制化内容）交付${repeat(',', 5)}`,
        `定制（客制化内容）关键词备注${repeat(',', 2)}`,
        `质量安全${repeat(',', 3)}`,
        '质量安全关键词备注',
        `业务联系${repeat(',', 6)}`,
        `配送供应${repeat(',', 3)}`,
        `配送供应关键词备注${repeat(',', 1)}`,
        `价格接洽${repeat(',', 1)}`,
        `价格接洽关键词备注${repeat(',', 3)}`,
        `系统ai检验-资质/安全${repeat(',', 4)}`,
        `系统ai检验-价格${repeat(',', 3)}`
    ].join(',');

    const header2 = [
        // 基本信息
        '公司名称', '注册', '法人', '地址', '业务覆盖', '产地', '生产规模', '业务规模', '渠道分布',
        // 经营范围
        '经营范围/行业', '主营业务', '资质', '设备', '环境', '经营许可证（图片）',
        // 标品（标准内容）交付
        '类别/领域', '自主设计/创作', '设计/创作版权', '自主生产制作',
        // 标品（标准内容）关键词备注/建议
        '消费者用途', '用户类型', '平台业务意愿',
        // 定制（客制化内容）交付
        '类别/领域', '设计/创作调整', '规格开模调整', '原材料调整', '结构调整', '包装',
        // 定制（客制化内容）关键词备注
        '消费者用途', '用户类型', '平台业务意愿',
        // 质量安全
        '生产许可', '安全许可', '原材料', '抽检/认证',
        // 质量安全关键词备注
        '质量安全提价意愿',
        // 业务联系
        '接洽方式', '联系方式', '线上', '线下', '链接渠道', '平台使用', '客户接洽',
        // 配送供应
        '国内地区', '国外地区', '线上供应', '线下供应',
        // 配送供应关键词备注
        '配送供应周期', '配送供应要求',
        // 价格接洽
        '业务领域/产品', '市场参考范围',
        // 价格接洽关键词备注
        '设计单价接洽范围', '成品单价接洽范围', '灵活面聊', '精准推送',
        // 系统ai检验-资质/安全
        '公司名称', '注册', '法人', '经营许可', '抽检/认证',
        // 系统ai检验-价格
        '线上店铺', '线上价格', '线下店铺', '线下价格'
    ].join(',');

    const csvContent = `${header1}\n${header2}\n`;
    
    // Add BOM to ensure UTF-8 compatibility with Excel
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
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
    const csvContent = processedSuppliers.map(s => `"${s.name}","${s.category}",${s.matchRate},${s.addedDate}`).join("\n");
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "processed_suppliers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "数据已开始导出" });
  };
  
  const formatSupplierForDialog = (supplier: Supplier | null) => {
    if (!supplier) return null;
    return {
        title: supplier.name,
        description: `匹配度: ${supplier.matchRate}%`,
        details: {
            "类别": supplier.category,
            "添加日期": supplier.addedDate,
            "原始导入数据": supplier.rawData || 'N/A'
        }
    };
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
    <>
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
            <Building className="w-8 h-8 text-primary" />
        </div>
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
                      <FormItem>
                        <FormLabel>供应商LOGO</FormLabel>
                        <div className="flex items-center gap-4">
                        {logoPreview && <Image src={logoPreview} alt="logo 预览" width={64} height={64} className="rounded-md object-cover" />}
                        <Input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo", setLogoPreview)} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}><FileUp className="mr-2"/>上传图片</Button>
                        </div>
                      </FormItem>
                      <FormItem>
                        <FormLabel>营业执照</FormLabel>
                        <div className="flex items-center gap-4">
                        {licensePreview && <Image src={licensePreview} alt="营业执照预览" width={64} height={64} className="rounded-md object-cover" />}
                        <Input id="license-upload" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, "businessLicense", setLicensePreview)} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('license-upload')?.click()}><FileUp className="mr-2"/>上传文件</Button>
                        </div>
                      </FormItem>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold">联系人信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField control={supplierForm.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>联系人</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactTitle" render={({ field }) => ( <FormItem><FormLabel>职务</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactMobile" render={({ field }) => ( <FormItem><FormLabel>手机</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactPhone" render={({ field }) => ( <FormItem><FormLabel>座机</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactWeCom" render={({ field }) => ( <FormItem><FormLabel>企微/客服</FormLabel><FormControl><Input placeholder="企业微信号或其它客服联系方式" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={supplierForm.control} name="contactEmail" render={({ field }) => ( <FormItem><FormLabel>邮箱</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
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

                  <Button type="submit" disabled={supplierForm.formState.isSubmitting}>
                    {supplierForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                    保存基本信息
                  </Button>
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
                       <ProductServiceItem 
                            key={item.id} 
                            form={productServiceForm}
                            index={index} 
                            remove={() => remove(index)}
                        />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ 
                        name: "", 
                        category: "", 
                        sku: "", 
                        description: "", 
                        price: "", 
                        purchaseLink: "", 
                        customFields: [] 
                      })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      增加一项
                    </Button>
                    <Button type="submit" disabled={productServiceForm.formState.isSubmitting}>
                        {productServiceForm.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                        保存商品/服务
                    </Button>
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
                            className={cn(
                                "border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                                isDragOver ? "bg-accent" : "hover:bg-muted/50"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={(e) => handleDragEvents(e, true)}
                            onDragLeave={(e) => handleDragEvents(e, false)}
                            onDragOver={(e) => handleDragEvents(e, true)}
                            onDrop={handleDrop}
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
                              <TableHead className="text-right">操作</TableHead>
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
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(supplier)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">查看详情</span>
                                    </Button>
                                  </TableCell>
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
    <ItemDetailsDialog
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        item={formatSupplierForDialog(selectedSupplier)}
    />
    </>
  );
}

// Extracted component for product/service item

type MediaUploadProps = {
    form: ReturnType<typeof useForm<ProductServiceForm>>,
    index: number,
    fieldName: "mediaPanoramic" | "mediaTop" | "mediaBottom" | "mediaLeft" | "mediaRight" | "mediaFront" | "mediaBack",
    label: string,
}

function MediaUpload({ form, index, fieldName, label }: MediaUploadProps) {
    const [fileName, setFileName] = useState<string | null>(null);
    const inputId = `${fieldName}-${index}`;
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue(`products.${index}.${fieldName}`, file);
            setFileName(file.name);
        } else {
            form.setValue(`products.${index}.${fieldName}`, null);
            setFileName(null);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={inputId} className="text-sm font-medium">{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    id={inputId}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(inputId)?.click()}
                >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    上传
                </Button>
                 {fileName && <span className="text-sm text-muted-foreground truncate">{fileName}</span>}
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <Video className="h-4 w-4" />
                <span className="text-xs">支持图片/视频</span>
            </div>
        </div>
    );
}

function ProductServiceItem({ form, index, remove }: {
    form: ReturnType<typeof useForm<ProductServiceForm>>,
    index: number,
    remove: () => void,
}) {
    const { control } = form;
    const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({
        control: control,
        name: `products.${index}.customFields`
    });

    return (
        <Card className="p-4 relative bg-background/50">
            <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-7 h-7"
                onClick={remove}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">移除此项</span>
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
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
                    control={control}
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
                    control={control}
                    name={`products.${index}.purchaseLink`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>购买链接</FormLabel>
                            <FormControl>
                               <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="https://item.jd.com/..." {...field} className="pl-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
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
                    control={control}
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
                control={control}
                name={`products.${index}.description`}
                render={({ field }) => (
                    <FormItem className="mt-6">
                        <FormLabel>描述</FormLabel>
                        <FormControl><Textarea placeholder="详细介绍产品或服务..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <Card className="mt-6 bg-background/50">
                <CardHeader>
                    <CardTitle className="text-md font-semibold">典型图/视频</CardTitle>
                    <CardDescription className="text-xs">请上传产品在7个标准方位的图片或视频。</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     <MediaUpload form={form} index={index} fieldName="mediaPanoramic" label="全景" />
                     <MediaUpload form={form} index={index} fieldName="mediaTop" label="上" />
                     <MediaUpload form={form} index={index} fieldName="mediaBottom" label="下" />
                     <MediaUpload form={form} index={index} fieldName="mediaLeft" label="左" />
                     <MediaUpload form={form} index={index} fieldName="mediaRight" label="右" />
                     <MediaUpload form={form} index={index} fieldName="mediaFront" label="前" />
                     <MediaUpload form={form} index={index} fieldName="mediaBack" label="后" />
                </CardContent>
            </Card>

            <div className="space-y-4 mt-6">
                <h4 className="font-headline text-md font-semibold">补充内容</h4>
                {customFields.map((customField, k) => (
                  <div key={customField.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <FormField
                      control={control}
                      name={`products.${index}.customFields.${k}.fieldName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">字段名</FormLabel>
                          <FormControl><Input placeholder="例如：颜色" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={control}
                      name={`products.${index}.customFields.${k}.fieldValue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">字段值</FormLabel>
                          <FormControl><Input placeholder="例如：黑色" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(k)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">移除补充内容</span>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendCustomField({ fieldName: "", fieldValue: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    增加补充内容
                </Button>
            </div>
        </Card>
    );
}

    

    