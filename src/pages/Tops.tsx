import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, LayoutDashboard, Calendar, MessageCircle } from "lucide-react";
import { STATUS_COLORS } from "@/lib/whatsappUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import TopActiveCard from "@/components/tops/TopActiveCard";
import TopFormDialog from "@/components/tops/TopFormDialog";
import WhatsAppConfigSection from "@/components/tops/WhatsAppConfigSection";
import WhatsAppTemplatesSection from "@/components/tops/WhatsAppTemplatesSection";
import WhatsAppDisparoSection from "@/components/tops/WhatsAppDisparoSection";
import WhatsAppLogSection from "@/components/tops/WhatsAppLogSection";

export default function Tops() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTop, setEditingTop] = useState<any>(null);

  const { data: tops = [] } = useQuery({
    queryKey: ["tops"],
    queryFn: async () => {
      const { data } = await supabase.from("tops").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: topCounts = {} } = useQuery({
    queryKey: ["tops-counts", tops.map(t => t.id).join(",")],
    enabled: tops.length > 0,
    queryFn: async () => {
      const ids = tops.map(t => t.id);
      const [partRes, servRes] = await Promise.all([
        supabase.from("participantes").select("top_id").in("top_id", ids),
        supabase.from("servidores").select("top_id").in("top_id", ids),
      ]);
      const counts: Record<string, { p: number; s: number }> = {};
      ids.forEach(id => { counts[id] = { p: 0, s: 0 }; });
      (partRes.data || []).forEach(r => { if (r.top_id && counts[r.top_id]) counts[r.top_id].p++; });
      (servRes.data || []).forEach(r => { if (r.top_id && counts[r.top_id]) counts[r.top_id].s++; });
      return counts;
    },
  });

  const activeTop = tops.find(t => t.status !== "Finalizado") || tops[0];
  const fmtDate = (d: string | null) => d ? format(new Date(d + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">TOPs</h1>
        </div>
      </div>

      <Tabs defaultValue="edicoes">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="edicoes" className="gap-1.5"><Calendar className="h-4 w-4" /> Edições</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageCircle className="h-4 w-4" /> WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="edicoes" className="space-y-6">
          {activeTop && <TopActiveCard top={activeTop} />}

          <div className="flex justify-end">
            <Button className="w-full sm:w-auto" onClick={() => { setEditingTop(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo TOP</Button>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {tops.map(t => {
                const sc = STATUS_COLORS[t.status || "Planejamento"] || STATUS_COLORS["Planejamento"];
                const c = (topCounts as Record<string, { p: number; s: number }>)[t.id];
                return (
                  <Card key={t.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium truncate">{t.nome}</span>
                        <Badge className={sc + " text-xs"}>{t.status || "Planejamento"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{t.local || "—"}</span>
                        <span>{fmtDate(t.data_inicio)} - {fmtDate(t.data_fim)}</span>
                      </div>
                      <div className="flex gap-x-4 text-sm text-muted-foreground">
                        <span>Participantes: {c?.p ?? "—"}</span>
                        <span>Servidores: {c?.s ?? "—"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingTop(t); setFormOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/dashboard")}>
                          <LayoutDashboard className="h-3.5 w-3.5 mr-1" /> Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead className="text-center">Participantes</TableHead>
                    <TableHead className="text-center">Servidores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tops.map(t => {
                    const sc = STATUS_COLORS[t.status || "Planejamento"] || STATUS_COLORS["Planejamento"];
                    const c = (topCounts as Record<string, { p: number; s: number }>)[t.id];
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nome}</TableCell>
                        <TableCell>{t.local || "—"}</TableCell>
                        <TableCell>{fmtDate(t.data_inicio)}</TableCell>
                        <TableCell>{fmtDate(t.data_fim)}</TableCell>
                        <TableCell className="text-center">{c?.p ?? "—"}</TableCell>
                        <TableCell className="text-center">{c?.s ?? "—"}</TableCell>
                        <TableCell><Badge className={sc + " text-xs"}>{t.status || "Planejamento"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingTop(t); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><LayoutDashboard className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <TopFormDialog open={formOpen} onOpenChange={setFormOpen} top={editingTop} />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppConfigSection />
          <WhatsAppTemplatesSection />
          <WhatsAppDisparoSection />
          <WhatsAppLogSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
