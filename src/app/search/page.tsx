import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">智能搜索</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          在我们的知识库中搜索，随时为您补充信息。
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索产品、服务、供应商..."
            className="w-full rounded-full bg-card py-6 pl-12 pr-24 text-lg"
          />
          <Button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full"
            size="lg"
          >
            搜索
          </Button>
        </div>
      </div>
       <div className="mx-auto mt-8 max-w-4xl">
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="font-headline">搜索结果</CardTitle>
                <CardDescription>您的搜索结果将显示在此处。</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground">
                    <p>请在上面的搜索框中输入内容开始搜索。</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
