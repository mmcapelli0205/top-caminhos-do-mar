import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Pill, Save, Loader2 } from "lucide-react";

interface Props {
  isCoord: boolean;
}

export default function NecessaireTab({ isCoord }: Props) {
  const { session } = useAuth();
  const userEmail = session?.user?.email ?? "";
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [grid, setGrid] = useState<Record<string, Record<string, number>>>({});

  // Fetch servidor logado
  const { data: servidorLogado } = useQuery({
    queryKey: ["servidor-logado-nec", userEmail],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome").eq("email", userEmail).maybeSingle();
      return data;
    },
    enabled: !!userEmail,
  });

  // Fetch hakunas (servidores da area Hakuna)
  const { data: hakunas = [] } = useQuery({
    queryKey: ["hakunas-servidores"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome").eq("area_servico", "Hakuna").eq("status", "aprovado").order("nome");
      return data ?? [];
    },
    enabled: isCoord,
  });

  // Fetch estoque geral
  const { data: estoque = [] } = useQuery({
    queryKey: ["hakuna-estoque-med-nec"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_estoque_medicamentos").select("*").order("nome");
      return data ?? [];
    },
  });

  // Fetch all necessaires
  const { data: allNecessaire = [] } = useQuery({
    queryKey: ["hakuna-necessaire-all"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_necessaire").select("*");
      return data ?? [];
    },
  });

  // Init grid when data loads (coord view)
  useEffect(() => {
    if (!isCoord || hakunas.length === 0 || estoque.length === 0) return;
    const g: Record<string, Record<string, number>> = {};
    for (const med of estoque) {
      g[med.id] = {};
      for (const h of hakunas) {
        const existing = allNecessaire.find(n => n.medicamento_id === med.id && n.hakuna_servidor_id === h.id);
        g[med.id][h.id] = existing?.quantidade ?? 0;
      }
    }
    setGrid(g);
  }, [isCoord, hakunas, estoque, allNecessaire]);

  const getDisponivel = (medId: string) => {
    const total = estoque.find(e => e.id === medId)?.quantidade ?? 0;
    const distributed = Object.values(grid[medId] ?? {}).reduce((s, v) => s + v, 0);
    return total - distributed;
  };

  const handleCellChange = (medId: string, hakunaId: string, val: number) => {
    setGrid(prev => {
      const next = { ...prev, [medId]: { ...prev[medId], [hakunaId]: Math.max(0, val) } };
      // Validate
      const totalMed = estoque.find(e => e.id === medId)?.quantidade ?? 0;
      const sum = Object.values(next[medId]).reduce((s, v) => s + v, 0);
      if (sum > totalMed) return prev; // Don't allow over-distribution
      return next;
    });
  };

  const handleSaveDistribution = async () => {
    setSaving(true);
    try {
      for (const medId of Object.keys(grid)) {
        const medNome = estoque.find(e => e.id === medId)?.nome ?? "";
        for (const hakunaId of Object.keys(grid[medId])) {
          const qtd = grid[medId][hakunaId];
          // UPSERT
          const existing = allNecessaire.find(n => n.medicamento_id === medId && n.hakuna_servidor_id === hakunaId);
          if (existing) {
            if (existing.quantidade !== qtd) {
              await supabase.from("hakuna_necessaire").update({ quantidade: qtd }).eq("id", existing.id);
            }
          } else if (qtd > 0) {
            await supabase.from("hakuna_necessaire").insert({
              hakuna_servidor_id: hakunaId,
              medicamento_id: medId,
              medicamento_nome: medNome,
              quantidade: qtd,
            } as any);
          }
        }
      }
      toast({ title: "✅ Distribuição salva!" });
      queryClient.invalidateQueries({ queryKey: ["hakuna-necessaire-all"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // === COORD VIEW ===
  if (isCoord) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Pill className="h-5 w-5" /> Distribuição de Medicamentos</h2>
        {estoque.length === 0 ? (
          <p className="text-muted-foreground">Nenhum medicamento no estoque.</p>
        ) : (
          <>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Medicamento</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    {hakunas.map(h => (
                      <TableHead key={h.id} className="text-center min-w-[80px]">{h.nome.split(" ")[0]}</TableHead>
                    ))}
                    <TableHead className="text-center">Disp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoque.map(med => {
                    const disp = getDisponivel(med.id);
                    return (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium text-sm">{med.nome}</TableCell>
                        <TableCell className="text-center">{med.quantidade}</TableCell>
                        {hakunas.map(h => (
                          <TableCell key={h.id} className="text-center p-1">
                            <Input
                              type="number"
                              min={0}
                              value={grid[med.id]?.[h.id] ?? 0}
                              onChange={e => handleCellChange(med.id, h.id, parseInt(e.target.value) || 0)}
                              className="h-8 w-16 text-center mx-auto"
                              inputMode="numeric"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Badge variant={disp < 0 ? "destructive" : disp === 0 ? "secondary" : "outline"}>
                            {disp}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Button onClick={handleSaveDistribution} disabled={saving} className="w-full h-12">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Distribuição
            </Button>
          </>
        )}
      </div>
    );
  }

  // === HAKUNA VIEW ===
  const minhaNecessaire = allNecessaire.filter(n => n.hakuna_servidor_id === servidorLogado?.id);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Pill className="h-5 w-5" /> Minha Necessaire</h2>
      {minhaNecessaire.length === 0 ? (
        <p className="text-muted-foreground">Nenhum medicamento na sua necessaire.</p>
      ) : (
        <div className="space-y-2">
          {minhaNecessaire.map(n => (
            <Card key={n.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="font-medium">{n.medicamento_nome}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={(n.quantidade ?? 0) < 3 ? "destructive" : "outline"}>
                    {n.quantidade} un
                  </Badge>
                  {(n.quantidade ?? 0) < 3 && (
                    <Badge className="bg-yellow-500 text-white text-xs">Estoque baixo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-base font-semibold mt-6">Estoque Geral (referência)</h3>
      <div className="space-y-1">
        {estoque.map(e => (
          <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
            <span className="text-sm">{e.nome}</span>
            <Badge variant="outline">{e.quantidade} {e.unidade}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
