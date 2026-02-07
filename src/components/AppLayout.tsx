import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getUser, logout, type TopUser } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PAPEL_LABELS: Record<string, string> = {
  diretoria: "Diretoria",
  coordenacao: "Coordenação",
  servidor: "Servidor",
  participante: "Participante",
};

export default function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<TopUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate("/", { replace: true });
    } else {
      setUser(u);
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-lg font-bold text-primary">TOP Manager</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-foreground">{user.nome}</span>
                <Badge variant="secondary" className="text-xs">
                  {PAPEL_LABELS[user.papel] ?? user.papel}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
