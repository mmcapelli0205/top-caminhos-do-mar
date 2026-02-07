import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Plus, Eye, Pencil, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ServidorSheet from "@/components/ServidorSheet";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Servidor = Tables<"servidores">;
type Hakuna = Tables<"hakunas">;

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

export default function Hakunas() {
  const navigate = useNavigate();
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null);

  const { data: servidores = [], isLoading: loadingServ } = useQuery({
    queryKey: ["servidores-hakuna"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servidores")
        .select("*").eq("area_servico", "Hakuna").eq("status", "aprovado").order("nome");
      if (error) throw error;
      return data as Servidor[];
    },
  });

  const { data: hakunas = [], isLoading: loadingHak } = useQuery({
    queryKey: ["hakunas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hakunas").select("*");
      if (error) throw error;
      return data as Hakuna[];
    },
  });

  const hakunaMap = useMemo(() => {
    const map = new Map<string, Hakuna>();
    hakunas.forEach(h => { if (h.servidor_id) map.set(h.servidor_id, h); });
    return map;
  }, [hakunas]);

  const especCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    servidores.forEach(s => {
      const h = hakunaMap.get(s.id);
      const esp = h?.especialidade_medica || "Não definida";
      counts[esp] = (counts[esp] || 0) + 1;
    });
    return counts;
  }, [servidores, hakunaMap]);

  const isLoading = loadingServ || loadingHak;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Hakunas — Equipe de Saúde</h1>
          <span className="text-sm text-muted-foreground">({servidores.length})</span>
        </div>
        <Button size="sm" onClick={() => navigate("/servidores/novo?area=Hakuna")}>
          <Plus className="h-4 w-4 mr-1" /> Novo Hakuna
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Aprovados</p>
            <span className="text-2xl font-bold text-foreground">{servidores.length}</span>
          </CardContent>
        </Card>
        {Object.entries(especCounts).map(([esp, count]) => (
          <Card key={esp}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground truncate">{esp}</p>
              <span className="text-lg font-bold text-foreground">{count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Idade</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead className="hidden lg:table-cell">CRM/Registro</TableHead>
              <TableHead className="hidden lg:table-cell">Igreja</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : servidores.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum Hakuna aprovado.</TableCell></TableRow>
            ) : servidores.map(s => {
              const h = hakunaMap.get(s.id);
              return (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedServidor(s)}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="hidden md:table-cell">{calcAge(s.data_nascimento) ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.telefone ?? "—"}</TableCell>
                  <TableCell>{h?.especialidade_medica ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{h?.crm || h?.registro_profissional || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{s.igreja ?? "—"}</TableCell>
                  <TableCell>
                    {s.checkin ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedServidor(s)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/servidores/${s.id}/editar`)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ServidorSheet servidor={selectedServidor} open={!!selectedServidor} onOpenChange={open => { if (!open) setSelectedServidor(null); }} />
    </div>
  );
}
