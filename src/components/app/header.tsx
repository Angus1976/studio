
import { Badge } from "@/components/ui/badge";
import { UserCircle, LogOut } from "lucide-react";
import { AppLogo } from "@/components/app/icons";
import { Button } from "@/components/ui/button";

const roleDisplayMap: { [key: string]: string } = {
  'Platform Admin': '平台管理员',
  'Tenant Admin': '租户管理员',
  'Prompt Engineer/Developer': '提示词工程师',
  'Individual User': '个人用户',
};


export function AppHeader({ userRole, onLogout }: { userRole: string | null, onLogout: () => void }) {
  const displayRole = userRole ? (roleDisplayMap[userRole] || userRole) : '';
  
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/50 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <AppLogo className="h-8 w-8 text-accent" />
        <h1 className="text-xl font-bold font-headline text-foreground tracking-tight">
          提示词宇宙
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {userRole && (
          <Badge variant="outline" className="text-sm">
            {displayRole}
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
