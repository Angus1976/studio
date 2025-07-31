import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileSpreadsheet } from "lucide-react";

export default function SuppliersPage() {
  return (
    <main className="p-4 md:p-6">
       <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">供应商整合</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          让供应商通过电子表格批量导入数据，并自动评估供应商匹配度。
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">导入供应商数据</CardTitle>
                <CardDescription>上传 CSV 或 Excel 文件以添加或更新供应商信息。</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-12 text-center">
                    <div className="rounded-full border bg-card p-4">
                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">将文件拖放到此处或点击浏览</p>
                    <Button>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        选择电子表格
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">当前供应商</CardTitle>
                <CardDescription>当前数据库中的供应商列表。</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>供应商名称</TableHead>
                            <TableHead>类别</TableHead>
                            <TableHead>匹配率</TableHead>
                            <TableHead>添加日期</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                无供应商数据。上传文件以开始。
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
