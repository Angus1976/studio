
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, LoaderCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { intelligentSearch } from "@/ai/flows/intelligent-search";
import type { IntelligentSearchOutput } from "@/ai/flows/intelligent-search";
import api from "@/lib/api";
import type { KnowledgeBaseEntry } from "@/app/knowledge-base/page";

async function performSearch(query: string) {
  if (!query) {
    return { results: [] };
  }

  try {
    // Fetch latest knowledge base from backend
    const knowledgeBaseRes = await api.get<KnowledgeBaseEntry[]>('/api/knowledge-base');
    const knowledgeBase = JSON.stringify(knowledgeBaseRes.data);

    const searchResult = await intelligentSearch({
      query,
      knowledgeBase: knowledgeBase,
    });
    // Sort results by relevance before returning
    searchResult.results.sort((a, b) => b.relevance - a.relevance);
    return searchResult;
  } catch (error) {
    console.error('Error performing search:', error);
    // In a real app, you might want to throw the error or handle it more gracefully
    return { results: [] };
  }
}


export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<IntelligentSearchOutput['results'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      const searchResult = await performSearch(query);
      setResults(searchResult.results);
    } catch (err) {
      setError("搜索时发生错误，请稍后重试。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="p-3 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
          <SearchIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">智能搜索</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          在我们的知识库中搜索，随时为您补充信息。
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索产品、服务、供应商..."
            className="w-full rounded-full bg-card py-6 pl-12 pr-24 text-lg"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? <LoaderCircle className="animate-spin" /> : "搜索"}
          </Button>
        </form>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="font-headline">搜索结果</CardTitle>
                <CardDescription>您的搜索结果将显示在此处。</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex justify-center items-center py-10">
                  <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                   <p className="ml-4 text-muted-foreground">正在为您智能搜索中...</p>
                </div>
              )}
              {error && (
                <div className="text-center text-destructive">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && (
                <div className="space-y-4">
                  {results === null && (
                     <div className="text-center text-muted-foreground py-10">
                        <p>请在上面的搜索框中输入内容开始搜索。</p>
                      </div>
                  )}
                  {results?.length === 0 && (
                     <div className="text-center text-muted-foreground py-10">
                        <p>未找到相关结果。请尝试其他关键词。</p>
                      </div>
                  )}
                  {results && results.length > 0 && (
                    <div className="space-y-4">
                      {results.map((item, index) => (
                        <SearchResultItem key={index} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SearchResultItem({ item }: { item: IntelligentSearchOutput['results'][0] }) {
  const relevancePercentage = Math.round(item.relevance * 100);
  let badgeVariant: "default" | "secondary" | "destructive" = "secondary";
  if (relevancePercentage > 75) {
    badgeVariant = "default";
  } else if (relevancePercentage < 40) {
    badgeVariant = "destructive";
  }


  return (
    <Card className="bg-background/50">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{item.snippet}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <span>相关度</span>
        <div className="flex items-center gap-2 w-1/2">
           <Progress value={relevancePercentage} className="h-2"/>
           <Badge variant={badgeVariant} className="w-16 justify-center">{relevancePercentage}%</Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
