import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableHeader, TableRow, TableHead, TableCell, TableBody,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Unlink, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Participante } from "@/hooks/useParticipantes";

interface Props {
  participantes: Participante[];
  familiaMap: Map<number, number>;
  userId: string;
}

export function GestaoCheckinTab({ participantes, familiaMap, userId }: Props) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroFamilia, setFiltroFamilia] = useState("todas");
  const [busca, setBusca] = useState("");

  const realizados = participantes.filter(p => p.checkin_realizado);
  const pendentes = participantes.filter(p => !p.checkin_realizado);
  const total = participantes.length;
  const pct = total > 0 ? Math.round((realizados.length / total) * 100) : 0;

  // Get unique families
  const familiasUnicas = [...new Set(participantes.map(p => p.familia_id).filter(Boolean))].sort((a, b) => (a ?? 0) - (b ?? 0));

  let filtered = participantes;
  if (filtroStatus === "realizado") filtered = filtered.filter(p => p.checkin_realizado);
  if (filtroStatus === "pendente") filtered = filtered.filter(p => !p.checkin_realizado);
  if (filtroFamilia !== "todas") filtered = filtered.filter(p => String(p.familia_id) === filtroFamilia);
  if (busca.trim()) {
    const term = busca.toLowerCase();
    filtered = filtered.filter(p => p.nome.toLowerCase().includes(term));
  }

  const desvincularMutation = useMutation({
    mutationFn: async (participanteId: string) => {
      const { error: e1 } = await supabase
        .from("participantes")
        .update({
          qr_code: null,
          peso_checkin: null,
          checkin_realizado: false,
          checkin_em: null,
          checkin_por: null,
          numero_legendario: null,
        })
        .eq("id", participanteId);
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("pulseiras")
        .update({
          status: "disponivel",
          participante_id: null,
          vinculada_em: null,
          vinculada_por: null,
          desvinculada_em: new Date().toISOString(),
          desvinculada_por: userId,
        })
        .eq("participante_id", participanteId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast({ title: "Pulseira desvinculada e check-in resetado" });
      queryClient.invalidateQueries({ queryKey: ["participantes"] });
      queryClient.invalidateQueries({ queryKey: ["pulseiras"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao desvincular", description: e.message, variant: "destructive" });
    },
  });

  const getPesoDiff = (p: Participante) => {
    if (!p.peso || !p.peso_checkin) return null;
    return Math.abs(Number(p.peso) - Number(p.peso_checkin));
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-green-400">Realizados</p>
            <p className="text-2xl font-bold text-green-400">{realizados.length}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-yellow-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-400">{pendentes.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Progresso</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="realizado">Realizados</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroFamilia} onValueChange={setFiltroFamilia}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Família" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {familiasUnicas.map(fId => (
              <SelectItem key={fId} value={String(fId)}>
                Família {familiaMap.get(fId!) ?? fId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table or cards */}
      {isMobile ? (
        <div className="space-y-2">
          {filtered.slice(0, 50).map(p => {
            const diff = getPesoDiff(p);
            return (
              <Card key={p.id}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{p.nome}</span>
                    <Badge variant={p.checkin_realizado ? "default" : "secondary"}>
                      {p.checkin_realizado ? "✓" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Fam: {p.familia_id ? familiaMap.get(p.familia_id) ?? "-" : "-"}</span>
                    {p.peso_checkin && <span>Peso: {Number(p.peso_checkin).toFixed(1)}kg</span>}
                    {diff !== null && (
                      <span className={diff > 3 ? "text-red-400" : "text-green-400"}>
                        Δ{diff.toFixed(1)}kg
                      </span>
                    )}
                  </div>
                  {p.checkin_realizado && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Unlink className="h-3 w-3 mr-1" /> Desvincular
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desvincular pulseira?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso remove o vínculo da pulseira e reseta o check-in de {p.nome}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => desvincularMutation.mutate(p.id)}>
                            Confirmar
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
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Peso Inscr.</TableHead>
                <TableHead>Peso Check-in</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Nº Leg.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(p => {
                const diff = getPesoDiff(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.familia_id ? familiaMap.get(p.familia_id) ?? "-" : "-"}</TableCell>
                    <TableCell>{p.peso ? Number(p.peso).toFixed(1) : "—"}</TableCell>
                    <TableCell>{p.peso_checkin ? Number(p.peso_checkin).toFixed(1) : "—"}</TableCell>
                    <TableCell>
                      {diff !== null ? (
                        <span className={diff > 3 ? "text-red-400 font-bold" : "text-green-400"}>
                          {diff.toFixed(1)} kg
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{p.numero_legendario ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.checkin_realizado ? "default" : "secondary"}>
                        {p.checkin_realizado ? "Realizado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.checkin_realizado && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Unlink className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Desvincular pulseira?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso remove o vínculo da pulseira e reseta o check-in de {p.nome}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => desvincularMutation.mutate(p.id)}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 100 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Mostrando 100 de {filtered.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
