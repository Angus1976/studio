import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <main className="p-4 md:p-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Intelligent Search</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Search our knowledge base to supplement information at any stage of your journey.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for products, services, suppliers..."
            className="w-full rounded-full bg-card py-6 pl-12 pr-24 text-lg"
          />
          <Button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full"
            size="lg"
          >
            Search
          </Button>
        </div>
      </div>
       <div className="mx-auto mt-8 max-w-4xl">
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="font-headline">Search Results</CardTitle>
                <CardDescription>Your search results will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground">
                    <p>Start by typing in the search bar above.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
