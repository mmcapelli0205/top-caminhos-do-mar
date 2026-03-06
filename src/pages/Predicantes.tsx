import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Search, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";
import PredicasTab from "@/components/predicas/PredicasTab";

export default function Predicantes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isDiretoria = role === "diretoria";
  const [addOpen, setAddOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [moverExclusivo, setMoverExclusivo] = useState(false);

  // Get active TOP
  const { data: topAtivo } = useQuery({
    queryKey: ["top-ativo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tops")
        .select("id, nome")
        .in("status", ["em_andamento", "inscricoes_abertas", "planejamento"])
        .order("data_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Predicantes with joined servidor data
  const { data: predicantes = [], isLoading } = useQuery({
    queryKey: ["predicantes", topAtivo?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predicantes")
        .select("id, servidor_id, observacoes, created_at, servidores(id, nome, numero_legendario, area_servico, experiencia, cargo_area)")
        .eq("top_id", topAtivo!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        servidor_id: string;
        observacoes: string | null;
        created_at: string | null;
        servidores: {
          id: string;
          nome: string;
          numero_legendario: string | null;
          area_servico: string | null;
          experiencia: string | null;
          cargo_area: string | null;
        } | null;
      }>;
    },
    enabled: !!topAtivo?.id,
  });

  // All approved servidores for the add dialog
  const { data: todosServidores = [] } = useQuery({
    queryKey: ["servidores-aprovados-predicantes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome, numero_legendario, area_servico")
        .eq("status", "aprovado")
        .order("nome");
      return data ?? [];
    },
    enabled: addOpen,
  });

  const predicanteIds = new Set(predicantes.map((p) => p.servidor_id));
  const servidoresDisponiveis = todosServidores.filter((s) => !predicanteIds.has(s.id));

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async ({ servidorId, mover }: { servidorId: string; mover: boolean }) => {
      const { error } = await supabase.from("predicantes").insert({
        top_id: topAtivo!.id,
        servidor_id: servidorId,
      });
      if (error) {
        if (error.code === "23505") {
          throw new Error("UNIQUE");
        }
        throw error;
      }
      // Se toggle ligado, mover servidor para Predicantes
      if (mover) {
        const { error: updateErr } = await supabase
          .from("servidores")
          .update({ area_servico: "Predicantes" })
          .eq("id", servidorId);
        if (updateErr) throw updateErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predicantes"] });
      queryClient.invalidateQueries({ queryKey: ["servidores"] });
      toast.success("Predicante adicionado!");
      setAddOpen(false);
      setMoverExclusivo(false);
    },
    onError: (err: Error) => {
      if (err.message === "UNIQUE") {
        toast.error("Este servidor já está na equipe Predicantes.");
      } else {
        toast.error("Erro ao adicionar predicante");
      }
    },
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("predicantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predicantes"] });
      toast.success("Predicante removido");
    },
    onError: () => toast.error("Erro ao remover predicante"),
  });

  const filtered = predicantes.filter((p) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    const s = p.servidores;
    return (
      s?.nome?.toLowerCase().includes(q) ||
      s?.numero_legendario?.toLowerCase().includes(q) ||
      s?.area_servico?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/servidores")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Servidores
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: "#7C3AED", color: "#fff" }}
        >
          📖
        </div>
        <div>
          <h1 className="text-2xl font-bold">Predicantes</h1>
          <p className="text-sm text-muted-foreground">
            {predicantes.length} membros • {topAtivo?.nome ?? "Sem TOP ativo"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="membros" className="w-full">
        <TabsList>
          <TabsTrigger value="membros" className="gap-1">
            <Users className="h-4 w-4" /> Membros
          </TabsTrigger>
          <TabsTrigger value="predicas" className="gap-1">
            <BookOpen className="h-4 w-4" /> Prédicas
          </TabsTrigger>
        </TabsList>

        {/* Tab Membros */}
        <TabsContent value="membros" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar predicante..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            {isDiretoria && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Predicante
              </Button>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nº LGND</TableHead>
                  <TableHead>Equipe de Origem</TableHead>
                  <TableHead>Experiência</TableHead>
                  {isDiretoria && <TableHead className="w-20">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isDiretoria ? 6 : 5} className="text-center text-muted-foreground py-8">
                      Nenhum predicante encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p, idx) => {
                  const s = p.servidores;
                  const isExclusivo = s?.area_servico === "Predicantes";
                  const labelEquipe = isExclusivo ? "Exclusivo" : (s?.area_servico ?? "—");
                  const corEquipe = isExclusivo ? "#7C3AED" : (CORES_EQUIPES[s?.area_servico ?? ""] ?? "#6366f1");
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{s?.nome ?? "—"}</TableCell>
                      <TableCell>
                        {s?.numero_legendario ? (
                          <Badge variant="outline" className="text-xs">#{s.numero_legendario}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {s?.area_servico ? (
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: corEquipe,
                              color: getTextColor(corEquipe),
                              border: "none",
                            }}
                          >
                            {labelEquipe}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{s?.experiencia ?? "—"}</TableCell>
                      {isDiretoria && (
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover predicante?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {s?.nome} será removido da equipe Predicantes. Isso NÃO altera a equipe de origem.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeMutation.mutate(p.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum predicante encontrado.</p>
            )}
            {filtered.map((p, idx) => {
              const s = p.servidores;
              const isExclusivo = s?.area_servico === "Predicantes";
              const labelEquipe = isExclusivo ? "Exclusivo" : (s?.area_servico ?? "");
              const corEquipe = isExclusivo ? "#7C3AED" : (CORES_EQUIPES[s?.area_servico ?? ""] ?? "#6366f1");
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium text-sm">{s?.nome ?? "—"}</span>
                        {s?.numero_legendario && (
                          <Badge variant="outline" className="text-[10px]">#{s.numero_legendario}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {s?.area_servico && (
                          <Badge
                            className="text-[10px]"
                            style={{
                              backgroundColor: corEquipe,
                              color: getTextColor(corEquipe),
                              border: "none",
                            }}
                          >
                            {labelEquipe}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{s?.experiencia ?? ""}</span>
                      </div>
                    </div>
                    {isDiretoria && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover predicante?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {s?.nome} será removido da equipe Predicantes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMutation.mutate(p.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Prédicas — reuses existing component */}
        <TabsContent value="predicas">
          <PredicasTab canEdit={isDiretoria} />
        </TabsContent>
      </Tabs>

      {/* Add Predicante Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setMoverExclusivo(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Predicante</DialogTitle>
            <DialogDescription>Selecione um servidor aprovado para adicionar à equipe Predicantes.</DialogDescription>
          </DialogHeader>
          <Command className="border rounded-lg">
            <CommandInput placeholder="Buscar servidor..." />
            <CommandList className="max-h-72">
              <CommandEmpty>Nenhum servidor encontrado.</CommandEmpty>
              <CommandGroup>
                {servidoresDisponiveis.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.nome} ${s.numero_legendario ?? ""} ${s.area_servico ?? ""}`}
                    onSelect={() => addMutation.mutate({ servidorId: s.id, mover: moverExclusivo })}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">{s.nome}</span>
                      {s.numero_legendario && (
                        <Badge variant="outline" className="text-[10px]">#{s.numero_legendario}</Badge>
                      )}
                      {s.area_servico && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">{s.area_servico}</Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t pt-3 mt-1 space-y-1.5">
            <div className="flex items-center gap-3">
              <Switch
                id="mover-exclusivo"
                checked={moverExclusivo}
                onCheckedChange={setMoverExclusivo}
              />
              <Label htmlFor="mover-exclusivo" className="text-sm font-medium cursor-pointer">
                Mover para Predicantes (remover da equipe atual)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-[52px]">
              Ative para servidores que servirão APENAS como Predicantes.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
