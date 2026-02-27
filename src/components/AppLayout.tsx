import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { useAreaServico } from "@/hooks/useAreaServico";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import AguardandoAprovacao from "@/pages/AguardandoAprovacao";
import { isServidorComum } from "@/lib/auth";

const CARGO_LABELS: Record<string, string> = {
  diretoria: "Diretoria",
  coordenacao: "Coordenação",
  coord02: "Coord 02",
  coord03: "Coord 03",
  flutuante01: "Flutuante 01",
  flutuante02: "Flutuante 02",
  flutuante03: "Flutuante 03",
  expert: "Expert",
  servidor: "Servidor",
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, role, loading, signOut, refreshProfile } = useAuth();
  useInactivityTimeout(40);
  const [timedOut, setTimedOut] = useState(false);

  const cargo = role || profile?.cargo || null;
  const isServidor = isServidorComum(cargo);
  const { areaServico } = useAreaServico();

  // Effect 1: Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !session) {
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  // Effect 2: Timeout de 12s para mostrar botão de retry
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 12_000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Effect 3: Store profile info in localStorage for backward-compatible legacy components
  useEffect(() => {
    if (!profile) return;
    try {
      const legacyUser = {
        id: profile.id,
        nome: profile.nome,
        papel: role || profile.cargo || "servidor",
        area_servico: profile.area_preferencia || "",
      };
      localStorage.setItem("top_user", JSON.stringify(legacyUser));
    } catch {
      // Safari private browsing - ignorar silenciosamente
    }
  }, [profile, role]);

  // Effect 4: Proteção de rotas para servidor comum — sempre chamado, guard interno
  useEffect(() => {
    if (!isServidor) return;
    const pathname = location.pathname;
    const allowed = pathname === "/dashboard" || pathname.startsWith("/areas/");
    if (!allowed) navigate("/dashboard", { replace: true });
  }, [isServidor, location.pathname, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleRetry = async () => {
    setTimedOut(false);
    await refreshProfile();
  };

  if (loading || !session) {
    if (timedOut && session) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
          <p className="text-center text-sm text-muted-foreground">
            O carregamento está demorando mais que o esperado.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  // Check profile status
  if (!profile || profile.status === "pendente") {
    return <AguardandoAprovacao status="pendente" onLogout={handleLogout} />;
  }

  // Redirect primeiro_acesso users
  if ((profile as any).primeiro_acesso === true) {
    navigate("/primeiro-acesso", { replace: true });
    return null;
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

  // Layout para servidor comum: sem sidebar, conteúdo 100% largura
  if (isServidor) {
    return (
      <div className="flex min-h-svh w-full flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/topsys-logo.png" alt="TOPSYS" className="h-7 object-contain" />
            <span className="hidden text-sm text-muted-foreground md:inline">
              TOP #1575 - Caminhos do Mar | 02-05 Abril 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-foreground">{profile.nome}</span>
              <Badge variant="secondary" className="text-xs">
                {CARGO_LABELS[cargo || ""] ?? cargo}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-2 md:p-6">
          <ErrorBoundary fallbackTitle="Erro na página" onReset={() => navigate(0)}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  // Layout normal com sidebar para todos os outros cargos
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar cargo={cargo} areaServico={areaServico} podeAprovar={!!profile.pode_aprovar} />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <img src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/topsys-logo.png" alt="TOPSYS" className="h-7 object-contain" />
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

          <main className="flex-1 p-2 md:p-6">
            <ErrorBoundary
              fallbackTitle="Erro na página"
              onReset={() => navigate(0)}
            >
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
