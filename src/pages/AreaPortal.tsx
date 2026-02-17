import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Phone, Plus, FileCheck, QrCode, AlertTriangle } from "lucide-react";
import CronogramaTop from "@/components/cronograma/CronogramaTop";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { getUser } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { usePermissoes } from "@/hooks/usePermissoes";
import {
  isAbaVisivel,
  canEdit as canEditPerm,
  canCreate as canCreatePerm,
  canDelete as canDeletePerm,
  canApprove as canApprovePerm,
} from "@/lib/permissoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AreaHeader from "@/components/area/AreaHeader";
import AreaMural from "@/components/area/AreaMural";
import AreaCalendario from "@/components/area/AreaCalendario";
import AreaDesignacoes from "@/components/area/AreaDesignacoes";
import AreaDocumentos from "@/components/area/AreaDocumentos";
import AreaRadar from "@/components/area/AreaRadar";
import AreaIACriativa from "@/components/area/AreaIACriativa";
import AreaPedidos from "@/components/area/AreaPedidos";
import AdmPedidosDashboard from "@/components/area/AdmPedidosDashboard";
import AdmFinanceiroDashboard from "@/components/area/AdmFinanceiroDashboard";
import HomologacaoTimeline from "@/components/area/HomologacaoTimeline";
import PredicasTab from "@/components/predicas/PredicasTab";
import EquipeTab from "@/components/hakunas/EquipeTab";
import ErgometricosTab from "@/components/hakunas/ErgometricosTab";
import AutorizacoesTab from "@/components/hakunas/AutorizacoesTab";
import MedicamentosEstoqueTab from "@/components/hakunas/MedicamentosEstoqueTab";
import EquipamentosEstoqueTab from "@/components/hakunas/EquipamentosEstoqueTab";
import Familias from "@/pages/Familias";
import Tirolesa from "@/pages/Tirolesa";
import type { Tables } from "@/integrations/supabase/types";

type Area = Tables<"areas">;

export default function AreaPortal() {
  const { nome } = useParams<{ nome: string }>();
  const decodedNome = decodeURIComponent(nome ?? "");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = getUser();

  const dashData = useDashboardData();

  // Fetch or auto-create area
  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ["area", decodedNome],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("nome", decodedNome)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Area;
      // Auto-create
      const { data: created, error: createErr } = await supabase
        .from("areas")
        .insert({ nome: decodedNome })
        .select()
        .single();
      if (createErr) throw createErr;
      return created as Area;
    },
    enabled: !!decodedNome,
  });

  // Stats
  const { data: servidoresDaArea = [], isLoading: loadingServidores } = useQuery({
    queryKey: ["area-servidores-list", decodedNome],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome, numero_legendario, telefone, cargo_area, status")
        .eq("area_servico", decodedNome)
        .order("nome");
      return data ?? [];
    },
    enabled: !!decodedNome,
  });

  const servidoresCount = servidoresDaArea.length;

  const { data: designacoesCount = 0 } = useQuery({
    queryKey: ["area-designacoes-count", area?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("area_designacoes")
        .select("id", { count: "exact", head: true })
        .eq("area_id", area!.id);
      return count ?? 0;
    },
    enabled: !!area?.id,
  });

  const { data: avisosRecentes = [] } = useQuery({
    queryKey: ["area-avisos-recentes", area?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_avisos")
        .select("*")
        .eq("area_id", area!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
    enabled: !!area?.id,
  });

  const { data: proximosEventos = [] } = useQuery({
    queryKey: ["area-eventos-proximos", area?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_eventos")
        .select("*")
        .eq("area_id", area!.id)
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio", { ascending: true })
        .limit(3);
      return data ?? [];
    },
    enabled: !!area?.id,
  });

  // Granular permissions via hook
  const { cargo, getPermissao, isDiretoria: isDiretoriaP } = usePermissoes(decodedNome);

  // Derived permission helpers
  const headerCanEdit =
    cargo === "coord_01" || cargo === "coord_02" || cargo === "coord_03" || isDiretoriaP;
  const canComment = cargo !== "servidor";

  const defaultTab = "painel";

  if (loadingArea) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Área não encontrada.
        <Button variant="link" onClick={() => navigate("/servidores")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/servidores")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Servidores
      </Button>

      <AreaHeader
        area={area}
        canEdit={headerCanEdit}
        servidoresCount={servidoresCount}
        designacoesCount={designacoesCount}
      />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          {isAbaVisivel(getPermissao("mural")) && <TabsTrigger value="mural">Mural</TabsTrigger>}
          {isAbaVisivel(getPermissao("calendario")) && <TabsTrigger value="calendario">Calendário</TabsTrigger>}
          {isAbaVisivel(getPermissao("participantes")) && <TabsTrigger value="participantes">Participantes</TabsTrigger>}
          {isAbaVisivel(getPermissao("documentos")) && <TabsTrigger value="documentos">Documentos</TabsTrigger>}
          {(decodedNome === "Segurança" || decodedNome === "Eventos") && isAbaVisivel(getPermissao("familias")) && (
            <TabsTrigger value="familias">Famílias</TabsTrigger>
          )}
          {(decodedNome === "Segurança" || decodedNome === "Eventos") && isAbaVisivel(getPermissao("tirolesa")) && (
            <TabsTrigger value="tirolesa">Tirolesa</TabsTrigger>
          )}
          {decodedNome === "Mídia" && isAbaVisivel(getPermissao("radar")) && (
            <TabsTrigger value="radar">Radar</TabsTrigger>
          )}
          {decodedNome === "Mídia" && isAbaVisivel(getPermissao("ia_criativa")) && (
            <TabsTrigger value="ia-criativa">IA Criativa</TabsTrigger>
          )}
          {decodedNome === "ADM" && isAbaVisivel(getPermissao("homologacao")) && (
            <TabsTrigger value="homologacao">Homologação</TabsTrigger>
          )}
          {isAbaVisivel(getPermissao("cronograma")) && <TabsTrigger value="cronograma">Cronograma</TabsTrigger>}
          {isAbaVisivel(getPermissao("predicas")) && <TabsTrigger value="predicas">Prédicas</TabsTrigger>}
          {isAbaVisivel(getPermissao("pedidos")) && <TabsTrigger value="pedidos">Pedidos</TabsTrigger>}
          {decodedNome === "Hakuna" && isAbaVisivel(getPermissao("equipe")) && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
          {decodedNome === "Hakuna" && isAbaVisivel(getPermissao("ergometricos")) && <TabsTrigger value="ergometricos">Ergométricos</TabsTrigger>}
          {decodedNome === "Hakuna" && isAbaVisivel(getPermissao("autorizacoes")) && <TabsTrigger value="autorizacoes">Autorizações</TabsTrigger>}
          {decodedNome === "Hakuna" && isAbaVisivel(getPermissao("medicamentos")) && <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>}
          {decodedNome === "Hakuna" && isAbaVisivel(getPermissao("equipamentos")) && <TabsTrigger value="equipamentos_hakuna">Equipamentos</TabsTrigger>}
        </TabsList>

        {/* Tab Painel */}
        <TabsContent value="painel">
          {decodedNome === "ADM" && (
            <div className="mb-6 space-y-6">
              <AdmPedidosDashboard />
              <AdmFinanceiroDashboard />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer" onClick={() => navigate(`/servidores?area=${encodeURIComponent(decodedNome)}&status=pendente`)}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Servidores</p>
                <p className="text-2xl font-bold">{servidoresCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Participantes</p>
                <p className="text-2xl font-bold">{designacoesCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Avisos</p>
                <p className="text-2xl font-bold">{avisosRecentes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Próx. Evento</p>
                <p className="text-sm font-medium">
                  {proximosEventos[0]
                    ? format(new Date(proximosEventos[0].data_inicio), "dd/MM", { locale: ptBR })
                    : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ADM-specific KPIs */}
          {decodedNome === "ADM" && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Card className="border-l-4" style={{ borderLeftColor: "hsl(142, 70%, 45%)" }}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><FileCheck className="h-3 w-3" /> Contratos Assinados</p>
                  {dashData.isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <p className="text-2xl font-bold">{dashData.contratosAssinados}/{dashData.totalInscritos}</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-l-4" style={{ borderLeftColor: "hsl(210, 80%, 55%)" }}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><QrCode className="h-3 w-3" /> Check-ins Realizados</p>
                  {dashData.isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <p className="text-2xl font-bold">{dashData.checkinsRealizados}/{dashData.totalInscritos}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hakuna-specific KPIs */}
          {decodedNome === "Hakuna" && (
            <div className="mt-4 space-y-4">
              <Card className="border-l-4" style={{ borderLeftColor: dashData.ergometricosPendentes > 0 ? "hsl(0, 70%, 50%)" : "hsl(220, 10%, 55%)" }}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Ergométricos Pendentes</p>
                  {dashData.isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <p className="text-2xl font-bold">{dashData.ergometricosPendentes}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Participantes por Faixa Etária</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashData.isLoading ? <Skeleton className="h-[220px] w-full" /> : (
                    <ChartContainer config={{ total: { label: "Participantes", color: "hsl(27, 82%, 50%)" } }} className="h-[220px] w-full">
                      <BarChart data={dashData.ageData}>
                        <XAxis dataKey="faixa" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="hsl(27, 82%, 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Servidores */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Legendários da Área ({servidoresCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {servidoresDaArea.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum servidor alocado nesta área.</p>
              ) : (
                servidoresDaArea.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.nome}</span>
                      {s.numero_legendario && <Badge variant="outline" className="text-[10px]">#{s.numero_legendario}</Badge>}
                      {s.cargo_area && <Badge variant="secondary" className="text-[10px]">{s.cargo_area}</Badge>}
                    </div>
                    {s.telefone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {s.telefone}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {avisosRecentes.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Últimos Avisos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {avisosRecentes.map(a => (
                  <div key={a.id} className="flex items-start gap-2">
                    {a.fixado && <Badge variant="secondary" className="text-xs">Fixado</Badge>}
                    <div>
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">{a.autor_nome} • {a.created_at ? format(new Date(a.created_at), "dd/MM/yy") : ""}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {proximosEventos.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {proximosEventos.map(e => (
                  <div key={e.id} className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{e.tipo ?? "outro"}</Badge>
                    <div>
                      <p className="text-sm font-medium">{e.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.data_inicio), "dd/MM HH:mm", { locale: ptBR })}
                        {e.local && ` • ${e.local}`}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {area.descricao && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{area.descricao}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mural">
          <AreaMural area={area} canEdit={canEditPerm(getPermissao("mural"))} canComment={canComment} currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="calendario">
          <AreaCalendario area={area} canEdit={canEditPerm(getPermissao("calendario"))} currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="participantes">
          <AreaDesignacoes area={area} canEdit={canEditPerm(getPermissao("participantes"))} currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="documentos">
          <AreaDocumentos area={area} canEdit={canEditPerm(getPermissao("documentos"))} currentUser={currentUser} />
        </TabsContent>

        {(decodedNome === "Segurança" || decodedNome === "Eventos") && (
          <TabsContent value="familias">
            <Familias />
          </TabsContent>
        )}

        {(decodedNome === "Segurança" || decodedNome === "Eventos") && (
          <TabsContent value="tirolesa">
            <Tirolesa />
          </TabsContent>
        )}

        {decodedNome === "Mídia" && (
          <TabsContent value="radar">
            <AreaRadar />
          </TabsContent>
        )}

        {decodedNome === "Mídia" && (
          <TabsContent value="ia-criativa">
            <AreaIACriativa />
          </TabsContent>
        )}

        {decodedNome === "ADM" && (
          <TabsContent value="homologacao">
            <HomologacaoTimeline areaId={area.id} />
          </TabsContent>
        )}

        {isAbaVisivel(getPermissao("cronograma")) && (
          <TabsContent value="cronograma">
            {decodedNome === "Logística" ? (
              <Tabs defaultValue="oficial" className="w-full">
                <TabsList>
                  <TabsTrigger value="oficial">Cronograma Oficial</TabsTrigger>
                  <TabsTrigger value="logistica">Cronograma Logística</TabsTrigger>
                </TabsList>
                <TabsContent value="oficial">
                  <CronogramaTop canEdit={false} cronogramaTipo="adm" />
                </TabsContent>
                <TabsContent value="logistica">
                  <CronogramaTop canEdit={cargo === "coord_01" || isDiretoriaP} cronogramaTipo="logistica" />
                </TabsContent>
              </Tabs>
            ) : (
              <CronogramaTop
                canEdit={canEditPerm(getPermissao("cronograma"))}
                cronogramaTipo="adm"
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="predicas">
          <PredicasTab canEdit={canEditPerm(getPermissao("predicas"))} />
        </TabsContent>

        <TabsContent value="pedidos">
          <AreaPedidos
            areaNome={decodedNome}
            canEdit={canCreatePerm(getPermissao("pedidos"))}
            canDelete={canDeletePerm(getPermissao("pedidos"))}
          />
        </TabsContent>

        {decodedNome === "Hakuna" && (
          <TabsContent value="equipe">
            {canEditPerm(getPermissao("equipe")) && (
              <div className="flex gap-2 mb-4">
                <Button size="sm" onClick={() => navigate("/servidores/novo?area=Hakuna")}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Hakuna
                </Button>
              </div>
            )}
            <EquipeTab />
          </TabsContent>
        )}

        {decodedNome === "Hakuna" && (
          <TabsContent value="ergometricos">
            <ErgometricosTab />
          </TabsContent>
        )}

        {decodedNome === "Hakuna" && (
          <TabsContent value="autorizacoes">
            <AutorizacoesTab />
          </TabsContent>
        )}

        {decodedNome === "Hakuna" && (
          <TabsContent value="medicamentos">
            <MedicamentosEstoqueTab />
          </TabsContent>
        )}

        {decodedNome === "Hakuna" && (
          <TabsContent value="equipamentos_hakuna">
            <EquipamentosEstoqueTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
