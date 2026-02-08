import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AguardandoAprovacao from "@/pages/AguardandoAprovacao";

const CARGO_LABELS: Record<string, string> = {
  diretoria: "Diretoria",
  coordenacao: "Coordenação",
  coord02: "Coord 02",
  coord03: "Coord 03",
  sombra: "Sombra",
  servidor: "Servidor",
};

export default function AppLayout() {
  const navigate = useNavigate();
  const { session, profile, role, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  // Check profile status
  if (!profile || profile.status === "pendente") {
    return <AguardandoAprovacao status="pendente" onLogout={handleLogout} />;
  }

  if (profile.status === "recusado") {
    return (
      <AguardandoAprovacao
        status="recusado"
        motivoRecusa={profile.motivo_recusa}
        onLogout={handleLogout}
      />
    );
  }

  // Store profile info in localStorage for backward-compatible legacy components
  const legacyUser = {
    id: profile.id,
    nome: profile.nome,
    papel: role || profile.cargo || "servidor",
    area_servico: profile.area_preferencia || "",
  };
  localStorage.setItem("top_user", JSON.stringify(legacyUser));

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar cargo={role || profile.cargo} />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-lg font-bold text-primary">TOP Manager</span>
              <span className="hidden text-sm text-muted-foreground md:inline">
                TOP #1575 - Caminhos do Mar | 02-05 Abril 2026
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-foreground">{profile.nome}</span>
                <Badge variant="secondary" className="text-xs">
                  {CARGO_LABELS[role || profile.cargo || ""] ?? profile.cargo}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
