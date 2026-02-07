import { useState, useMemo } from "react";
import { UsersRound, Wand2, Save, Heart, AlertTriangle } from "lucide-react";
import { useParticipantes } from "@/hooks/useParticipantes";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  distributeParticipants,
  calcAge,
  checkSeparationViolations,
  type FamilyResult,
} from "@/lib/familiaAlgorithm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const Familias = () => {
  const { participantes, isLoading } = useParticipantes();
  const queryClient = useQueryClient();

  const [numFamilias, setNumFamilias] = useState(10);
  const [result, setResult] = useState<FamilyResult | null>(null);
  const [saving, setSaving] = useState(false);

  const aptos = useMemo(
    () => participantes.filter((p) => p.status !== "cancelado"),
    [participantes]
  );

  const participantMap = useMemo(() => {
    const m = new Map<string, (typeof participantes)[0]>();
    participantes.forEach((p) => m.set(p.id, p));
    return m;
  }, [participantes]);

  const handleGenerate = () => {
    if (aptos.length === 0) {
      toast.error("Nenhum participante apto encontrado.");
      return;
    }
    const res = distributeParticipants(aptos, numFamilias);
    setResult(res);
    toast.success("Famílias geradas com sucesso!");
  };

  const handleMove = (participantId: string, fromFamily: number, toFamily: number) => {
    if (!result) return;
    const newFamilies = result.families.map((f) => [...f]);
    newFamilies[fromFamily] = newFamilies[fromFamily].filter((id) => id !== participantId);
    newFamilies[toFamily].push(participantId);
    setResult({ ...result, families: newFamilies });

    // Check separation violation in target family
    const violations = checkSeparationViolations(
      [newFamilies[toFamily]],
      result.separationPairs
    );
    if (violations.size > 0) {
      toast.warning("Atenção: essa mudança viola uma regra de separação!");
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      // Upsert families
      for (let i = 0; i < result.families.length; i++) {
        const numero = i + 1;
        const { error } = await supabase
          .from("familias")
          .upsert({ numero, nome: `Família ${numero}` }, { onConflict: "numero" });
        if (error) throw error;
      }

      // Get familia records to map numero -> id
      const { data: famData, error: famErr } = await supabase
        .from("familias")
        .select("id, numero");
      if (famErr) throw famErr;
      const numeroToId = new Map<number, number>();
      famData?.forEach((f) => numeroToId.set(f.numero, f.id));

      // Update each participant's familia_id
      for (let fi = 0; fi < result.families.length; fi++) {
        const familiaId = numeroToId.get(fi + 1);
        if (!familiaId) continue;
        const ids = result.families[fi];
        if (ids.length === 0) continue;
        const { error } = await supabase
          .from("participantes")
          .update({ familia_id: familiaId })
          .in("id", ids);
        if (error) throw error;
      }

      // Clear familia_id for unassigned participants
      const allAssigned = new Set(result.families.flat());
      const unassigned = aptos.filter((p) => !allAssigned.has(p.id)).map((p) => p.id);
      if (unassigned.length > 0) {
        await supabase
          .from("participantes")
          .update({ familia_id: null })
          .in("id", unassigned);
      }

      queryClient.invalidateQueries({ queryKey: ["participantes"] });
      queryClient.invalidateQueries({ queryKey: ["familias"] });
      toast.success("Famílias salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Compute stats per family
  const familyStats = useMemo(() => {
    if (!result) return [];
    return result.families.map((members, fi) => {
      const parts = members.map((id) => participantMap.get(id)).filter(Boolean);
      const ages = parts.map((p) => calcAge(p!.data_nascimento));
      const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
      const healthCount = parts.filter((p) => p!.doenca && p!.doenca.trim() !== "").length;
      const heavyCount = parts.filter((p) => p!.peso != null && p!.peso > 100).length;
      const lowFitCount = parts.filter(
        (p) => p!.condicionamento != null && p!.condicionamento <= 2
      ).length;
      return { fi, count: members.length, avgAge, healthCount, heavyCount, lowFitCount };
    });
  }, [result, participantMap]);

  const violations = useMemo(() => {
    if (!result) return new Map();
    return checkSeparationViolations(result.families, result.separationPairs);
  }, [result]);

  const hasBalanceViolation = useMemo(() => {
    if (familyStats.length === 0) return new Set<number>();
    const counts = familyStats.map((s) => s.count);
    const maxC = Math.max(...counts);
    const minC = Math.min(...counts);
    const bad = new Set<number>();
    familyStats.forEach((s) => {
      if (maxC - minC > 2) bad.add(s.fi);
      if (s.healthCount > 2 || s.heavyCount > 2 || s.lowFitCount > 2) bad.add(s.fi);
    });
    return bad;
  }, [familyStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UsersRound className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Famílias</h1>
      </div>

      {/* Config Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Número de Famílias
              </label>
              <Input
                type="number"
                min={2}
                max={50}
                value={numFamilias}
                onChange={(e) => setNumFamilias(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Gerar Famílias Automaticamente
            </Button>
            {result && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Famílias"}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Total participantes aptos: <strong>{aptos.length}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Family Cards Grid */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.families.map((members, fi) => {
            const stats = familyStats[fi];
            const hasViolation = violations.has(fi) || hasBalanceViolation.has(fi);
            return (
              <Card
                key={fi}
                className={hasViolation ? "border-destructive border-2" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Família {fi + 1}</CardTitle>
                    {hasViolation && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <CardDescription>
                    {stats?.count || 0} membros · Idade média: {stats?.avgAge || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((id) => {
                      const p = participantMap.get(id);
                      if (!p) return null;
                      const age = calcAge(p.data_nascimento);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 text-sm py-1 border-b border-border last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">
                              {p.nome}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {age} anos
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {p.doenca && p.doenca.trim() !== "" && (
                              <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" />
                            )}
                            {p.peso != null && p.peso > 100 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {p.peso}kg
                              </Badge>
                            )}
                            {p.condicionamento != null && (
                              <Badge
                                variant={p.condicionamento <= 2 ? "destructive" : "secondary"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                C{p.condicionamento}
                              </Badge>
                            )}
                          </div>
                          <Select
                            value={String(fi + 1)}
                            onValueChange={(v) => handleMove(id, fi, Number(v) - 1)}
                          >
                            <SelectTrigger className="w-16 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: numFamilias }, (_, i) => (
                                <SelectItem key={i} value={String(i + 1)}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    {members.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhum membro
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Table */}
      {result && familyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo de Balanceamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Família</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Idade Média</TableHead>
                  <TableHead>Saúde</TableHead>
                  <TableHead>Pesados</TableHead>
                  <TableHead>Baixo Cond.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyStats.map((s) => (
                  <TableRow
                    key={s.fi}
                    className={hasBalanceViolation.has(s.fi) ? "bg-orange-500/10" : ""}
                  >
                    <TableCell className="font-medium">Família {s.fi + 1}</TableCell>
                    <TableCell>{s.count}</TableCell>
                    <TableCell>{s.avgAge}</TableCell>
                    <TableCell>{s.healthCount}</TableCell>
                    <TableCell>{s.heavyCount}</TableCell>
                    <TableCell>{s.lowFitCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Familias;
