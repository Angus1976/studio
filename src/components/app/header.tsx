
import { Badge } from "@/components/ui/badge";
import { UserCircle, LogOut } from "lucide-react";
import { AppLogo } from "@/components/app/icons";
import { Button } from "@/components/ui/button";

export function AppHeader({ userRole, onLogout }: { userRole: string | null, onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/50 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <AppLogo className="h-8 w-8 text-accent" />
        <h1 className="text-xl font-bold font-headline text-foreground tracking-tight">
          AI 任务流
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {userRole && (
          <Badge variant="outline" className="text-sm">
            {userRole}
          </Badge>
        )}
        <UserCircle className="h-8 w-8 text-muted-foreground" />
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="登出">
            <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
