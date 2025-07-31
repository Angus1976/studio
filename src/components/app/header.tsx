import { UserCircle } from "lucide-react";
import { AppLogo } from "@/components/app/icons";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/50 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <AppLogo className="h-8 w-8 text-accent" />
        <h1 className="text-xl font-bold font-headline text-foreground tracking-tight">
          AI 任务流
        </h1>
      </div>
      <UserCircle className="h-8 w-8 text-muted-foreground" />
    </header>
  );
}
