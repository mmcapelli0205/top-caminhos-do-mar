import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParticipantes } from "@/hooks/useParticipantes";
import { useAuth } from "@/hooks/useAuth";
import { generateZiplinePairs, type ZiplinePair, type IneligibleEntry } from "@/lib/tiralesaAlgorithm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CableCar, Users, UserX, AlertTriangle, Printer, RefreshCw, User } from "lucide-react";
import jsPDF from "jspdf";

type DuplaRow = {
  id: string;
  familia_id: number;
  participante_1_id: string;
  participante_2_id: string | null;
  peso_1: number;
  peso_2: number | null;
  peso_total: number;
  ordem: number;
  status: string;
  observacao: string | null;
  top_id: string | null;
};

export default function Tirolesa() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { participantes, familias, isLoading: loadingParts } = useParticipantes();
  const [generating, setGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const topId = useMemo(() => {
    if (participantes.length > 0 && participantes[0].top_id) return participantes[0].top_id;
    return null;
  }, [participantes]);

  const duplasQuery = useQuery({
    queryKey: ["tirolesa_duplas", topId],
    queryFn: async () => {
      const q = supabase.from("tirolesa_duplas" as any).select("*");
      if (topId) (q as any).eq("top_id", topId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as DuplaRow[];
    },
  });

  const duplas = duplasQuery.data ?? [];

  // Build participant map for display
  const partMap = useMemo(() => {
    const m = new Map<string, typeof participantes[0]>();
    participantes.forEach((p) => m.set(p.id, p));
    return m;
  }, [participantes]);

  const familiaMap = useMemo(() => {
    const m = new Map<number, typeof familias[0]>();
    familias.forEach((f) => m.set(f.id, f));
    return m;
  }, [familias]);

  // Compute algorithm results for summary (ineligible count etc.)
  const algoResult = useMemo(() => {
    if (familias.length === 0 || participantes.length === 0) return null;
    return generateZiplinePairs(familias, participantes);
  }, [familias, participantes]);

  // Stats
  const totalDuplas = duplas.filter((d) => d.participante_2_id).length;
  const totalSolo = duplas.filter((d) => !d.participante_2_id).length;
  const totalAptos = totalDuplas * 2 + totalSolo;
  const totalInaptos = algoResult?.ineligible.length ?? 0;
  const pesoMedio = totalDuplas > 0
    ? duplas.filter((d) => d.participante_2_id).reduce((s, d) => s + d.peso_total, 0) / totalDuplas
    : 0;

  // Group duplas by familia
  const duplasByFamilia = useMemo(() => {
    const map = new Map<number, DuplaRow[]>();
    duplas.forEach((d) => {
      const arr = map.get(d.familia_id) ?? [];
      arr.push(d);
      map.set(d.familia_id, arr);
    });
    // sort each group by ordem
    map.forEach((arr) => arr.sort((a, b) => a.ordem - b.ordem));
    return map;
  }, [duplas]);

  // Group ineligible by familia
  const ineligibleByFamilia = useMemo(() => {
    const map = new Map<number, IneligibleEntry[]>();
    algoResult?.ineligible.forEach((e) => {
      const arr = map.get(e.familiaId) ?? [];
      arr.push(e);
      map.set(e.familiaId, arr);
    });
    return map;
  }, [algoResult]);

  const handleGerarDuplas = async () => {
    if (duplas.length > 0) {
      setConfirmOpen(true);
      return;
    }
    await doGenerate();
  };

  const doGenerate = async () => {
    setConfirmOpen(false);
    setGenerating(true);
    try {
      const result = generateZiplinePairs(familias, participantes);

      // Delete existing
      if (topId) {
        await (supabase.from("tirolesa_duplas" as any) as any).delete().eq("top_id", topId);
      } else {
        await (supabase.from("tirolesa_duplas" as any) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      // Insert new pairs
      if (result.pairs.length > 0) {
        const rows = result.pairs.map((p) => ({
          familia_id: p.familiaId,
          participante_1_id: p.participante1.id,
          participante_2_id: p.participante2?.id ?? null,
          peso_1: p.peso1,
          peso_2: p.peso2,
          peso_total: p.pesoTotal,
          ordem: p.ordem,
          status: "aguardando",
          observacao: p.participante2 ? null : "Solo",
          top_id: topId,
        }));

        const { error } = await (supabase.from("tirolesa_duplas" as any) as any).insert(rows);
        if (error) throw error;
      }

      toast({ title: `${result.pairs.length} duplas geradas com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
    } catch (e: any) {
      toast({ title: e.message || "Erro ao gerar duplas", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (duplaId: string, newStatus: string) => {
    const { error } = await (supabase.from("tirolesa_duplas" as any) as any)
      .update({ status: newStatus })
      .eq("id", duplaId);
    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
    }
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text("Tirolesa - Lista de Duplas", 14, y);
    y += 12;

    const sortedFamilias = [...familias].sort((a, b) => a.numero - b.numero);

    for (const fam of sortedFamilias) {
      const famDuplas = duplasByFamilia.get(fam.id);
      if (!famDuplas || famDuplas.length === 0) continue;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.text(`Família ${fam.numero}${fam.nome ? ` - ${fam.nome}` : ""}`, 14, y);
      y += 8;
      doc.setFontSize(10);

      for (const d of famDuplas) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const p1 = partMap.get(d.participante_1_id);
        const p2 = d.participante_2_id ? partMap.get(d.participante_2_id) : null;

        if (p2) {
          doc.text(
            `Dupla ${d.ordem}: ${p1?.nome ?? "?"} (${d.peso_1}kg) + ${p2?.nome ?? "?"} (${d.peso_2}kg) = ${d.peso_total}kg`,
            18, y
          );
        } else {
          doc.text(`Solo ${d.ordem}: ${p1?.nome ?? "?"} (${d.peso_1}kg)`, 18, y);
        }
        y += 6;
      }
      y += 4;
    }

    doc.save("tirolesa-duplas.pdf");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pronto": return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "desceu": return "bg-green-500/20 text-green-700 border-green-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isLoading = loadingParts || duplasQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CableCar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tirolesa</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintPDF} disabled={duplas.length === 0}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button onClick={handleGerarDuplas} disabled={generating || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Gerando..." : "Gerar Duplas"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Duplas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalDuplas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Aptos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center gap-1">
              <Users className="h-4 w-4" /> {totalAptos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inaptos (&gt;120kg)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center gap-1 text-destructive">
              <UserX className="h-4 w-4" /> {totalInaptos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peso Médio Dupla</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{pesoMedio > 0 ? `${pesoMedio.toFixed(1)}kg` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Duplas List by Familia */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : duplas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CableCar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma dupla gerada ainda.</p>
            <p className="text-sm">Clique em "Gerar Duplas" para formar as duplas automaticamente.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {[...familias]
            .sort((a, b) => a.numero - b.numero)
            .filter((f) => duplasByFamilia.has(f.id) || ineligibleByFamilia.has(f.id))
            .map((fam) => {
              const famDuplas = duplasByFamilia.get(fam.id) ?? [];
              const famIneligible = ineligibleByFamilia.get(fam.id) ?? [];
              return (
                <AccordionItem key={fam.id} value={String(fam.id)} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        Família {fam.numero}{fam.nome ? ` — ${fam.nome}` : ""}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {famDuplas.filter((d) => d.participante_2_id).length} duplas
                      </Badge>
                      {famDuplas.some((d) => !d.participante_2_id) && (
                        <Badge className="text-xs bg-orange-500/20 text-orange-700 border-orange-300">
                          {famDuplas.filter((d) => !d.participante_2_id).length} solo
                        </Badge>
                      )}
                      {famIneligible.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {famIneligible.length} inaptos
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 py-2">
                      {famDuplas.map((d) => {
                        const p1 = partMap.get(d.participante_1_id);
                        const p2 = d.participante_2_id ? partMap.get(d.participante_2_id) : null;
                        return (
                          <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {p2 ? (
                                <>
                                  <Users className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Dupla {d.ordem}:</strong>{" "}
                                    {p1?.nome ?? "?"} ({d.peso_1}kg) + {p2?.nome ?? "?"} ({d.peso_2}kg) ={" "}
                                    <strong>{d.peso_total}kg</strong>
                                    {d.peso_total > 170 && " ⚠️"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-orange-500 shrink-0" />
                                  <span className="text-sm truncate">
                                    <strong>Solo {d.ordem}:</strong>{" "}
                                    {p1?.nome ?? "?"} ({d.peso_1}kg)
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={statusColor(d.status)}>
                                {d.status === "aguardando" ? "Aguardando" : d.status === "pronto" ? "Pronto" : "Desceu"}
                              </Badge>
                              <Select value={d.status} onValueChange={(v) => handleStatusChange(d.id, v)}>
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="aguardando">Aguardando</SelectItem>
                                  <SelectItem value="pronto">Pronto</SelectItem>
                                  <SelectItem value="desceu">Desceu</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                      {famIneligible.map((ie) => (
                        <div key={ie.participante.id} className="flex items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span className="text-sm text-destructive">
                            {ie.participante.nome} ({ie.participante.peso}kg) — {ie.motivo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>
      )}

      {/* Confirm regenerate dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refazer duplas?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apagará todas as duplas atuais e gerará novas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doGenerate}>Refazer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
