import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Minus, PackagePlus, ChevronDown, Package, AlertTriangle, History, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type EstoqueMed = Tables<"hakuna_estoque_medicamentos">;
type Movimentacao = Tables<"hakuna_estoque_movimentacoes">;

const UNIDADES = ["un", "cx", "fr", "amp", "cp"];

export default function MedicamentosEstoqueTab() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [novoOpen, setNovoOpen] = useState(false);
  const [baixaOpen, setBaixaOpen] = useState(false);
  const [addEstoqueOpen, setAddEstoqueOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueMed | null>(null);
  const [histOpen, setHistOpen] = useState(false);

  // Form states - Novo
  const [novoNome, setNovoNome] = useState("");
  const [novoQtd, setNovoQtd] = useState(1);
  const [novoUnidade, setNovoUnidade] = useState("un");
  const [novoEstoqueMin, setNovoEstoqueMin] = useState(5);
  const [novoOrigem, setNovoOrigem] = useState("manual");
  const [novoDoador, setNovoDoador] = useState("");

  // Form states - Dar Baixa
  const [baixaQtd, setBaixaQtd] = useState(1);
  const [baixaTipo, setBaixaTipo] = useState("participante");
  const [baixaPacienteId, setBaixaPacienteId] = useState("");
  const [baixaHakunaId, setBaixaHakunaId] = useState("");
  const [baixaObs, setBaixaObs] = useState("");

  // Form states - Adicionar Estoque
  const [addQtd, setAddQtd] = useState(1);
  const [addOrigem, setAddOrigem] = useState("manual");
  const [addDoador, setAddDoador] = useState("");

  const { data: estoque = [] } = useQuery({
    queryKey: ["hk-estoque-medicamentos"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_estoque_medicamentos").select("*").order("nome");
      return (data ?? []) as EstoqueMed[];
    },
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["hk-estoque-movimentacoes"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_estoque_movimentacoes").select("*").order("data_movimentacao", { ascending: false });
      return (data ?? []) as Movimentacao[];
    },
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["hk-participantes-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("id, nome, familia_id").order("nome");
      return data ?? [];
    },
  });

  const { data: servidores = [] } = useQuery({
    queryKey: ["hk-servidores-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome, area_servico").order("nome");
      return data ?? [];
    },
  });

  const { data: hakunas = [] } = useQuery({
    queryKey: ["hk-hakunas-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome").eq("area_servico", "Hakuna").eq("status", "aprovado").order("nome");
      return data ?? [];
    },
  });

  // Stats
  const totalItens = estoque.length;
  const totalUnidades = estoque.reduce((s, i) => s + i.quantidade, 0);
  const alertas = estoque.filter((i) => i.quantidade <= (i.estoque_minimo ?? 5));

  // Medicamento names map for history
  const medNomes = useMemo(() => {
    const map: Record<string, string> = {};
    estoque.forEach((m) => { map[m.id] = m.nome; });
    return map;
  }, [estoque]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["hk-estoque-medicamentos"] });
    qc.invalidateQueries({ queryKey: ["hk-estoque-movimentacoes"] });
  };

  const resetNovoForm = () => {
    setNovoNome(""); setNovoQtd(1); setNovoUnidade("un"); setNovoEstoqueMin(5); setNovoOrigem("manual"); setNovoDoador("");
  };

  const criarMedicamento = useMutation({
    mutationFn: async () => {
      const { data: inserted, error: e1 } = await supabase.from("hakuna_estoque_medicamentos").insert({
        nome: novoNome, quantidade: novoQtd, unidade: novoUnidade, estoque_minimo: novoEstoqueMin,
        origem: novoOrigem === "doacao" ? "doacao" : "manual",
        doador_nome: novoOrigem === "doacao" ? novoDoador : null,
      }).select("id").single();
      if (e1) throw e1;
      await supabase.from("hakuna_estoque_movimentacoes").insert({
        medicamento_id: inserted.id, tipo: "entrada", quantidade: novoQtd,
        origem_entrada: novoOrigem === "doacao" ? "doacao" : "manual",
        doador_nome: novoOrigem === "doacao" ? novoDoador : null,
      });
    },
    onSuccess: () => { invalidateAll(); setNovoOpen(false); resetNovoForm(); toast({ title: "Medicamento adicionado ao estoque" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const darBaixa = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      if (baixaQtd > selectedItem.quantidade) throw new Error("Quantidade maior que o estoque disponível");

      const paciente = baixaTipo === "participante"
        ? participantes.find((p) => p.id === baixaPacienteId)
        : servidores.find((s) => s.id === baixaPacienteId);
      const hakuna = hakunas.find((h) => h.id === baixaHakunaId);

      await supabase.from("hakuna_estoque_movimentacoes").insert({
        medicamento_id: selectedItem.id, tipo: "saida", quantidade: baixaQtd,
        paciente_tipo: baixaTipo, paciente_nome: paciente?.nome ?? null,
        paciente_familia: baixaTipo === "participante" ? String((paciente as any)?.familia_id ?? "") : null,
        paciente_equipe: baixaTipo === "servidor" ? (paciente as any)?.area_servico ?? null : null,
        hakuna_responsavel_id: baixaHakunaId || null,
        hakuna_responsavel_nome: hakuna?.nome ?? null,
        observacao: baixaObs || null,
      });

      await supabase.from("hakuna_estoque_medicamentos")
        .update({ quantidade: selectedItem.quantidade - baixaQtd })
        .eq("id", selectedItem.id);
    },
    onSuccess: () => {
      invalidateAll(); setBaixaOpen(false); setSelectedItem(null);
      setBaixaQtd(1); setBaixaTipo("participante"); setBaixaPacienteId(""); setBaixaHakunaId(""); setBaixaObs("");
      toast({ title: "Baixa registrada" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const adicionarEstoque = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      await supabase.from("hakuna_estoque_movimentacoes").insert({
        medicamento_id: selectedItem.id, tipo: "entrada", quantidade: addQtd,
        origem_entrada: addOrigem === "doacao" ? "doacao" : "manual",
        doador_nome: addOrigem === "doacao" ? addDoador : null,
      });
      await supabase.from("hakuna_estoque_medicamentos")
        .update({ quantidade: selectedItem.quantidade + addQtd })
        .eq("id", selectedItem.id);
    },
    onSuccess: () => {
      invalidateAll(); setAddEstoqueOpen(false); setSelectedItem(null);
      setAddQtd(1); setAddOrigem("manual"); setAddDoador("");
      toast({ title: "Estoque atualizado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const excluirItem = useMutation({
    mutationFn: async (item: EstoqueMed) => {
      // Delete related movements first, then the item
      await supabase.from("hakuna_estoque_movimentacoes").delete().eq("medicamento_id", item.id);
      const { error } = await supabase.from("hakuna_estoque_medicamentos").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Medicamento excluído do estoque" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const openBaixa = (item: EstoqueMed) => { setSelectedItem(item); setBaixaQtd(1); setBaixaOpen(true); };
  const openAddEstoque = (item: EstoqueMed) => { setSelectedItem(item); setAddQtd(1); setAddEstoqueOpen(true); };

  const pacienteList = baixaTipo === "participante" ? participantes : servidores;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{totalItens}</p>
          <p className="text-xs text-muted-foreground">Tipos em Estoque</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalUnidades}</p>
          <p className="text-xs text-muted-foreground">Total de Unidades</p>
        </CardContent></Card>
        <Card className={alertas.length > 0 ? "border-destructive animate-pulse col-span-2 md:col-span-1" : "col-span-2 md:col-span-1"}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${alertas.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className={`text-2xl font-bold ${alertas.length > 0 ? "text-destructive" : ""}`}>{alertas.length}</p>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          </CardContent>
        </Card>
      </div>

      {/* Action button */}
      <Button variant="outline" onClick={() => setNovoOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Medicamento</Button>

      {/* Inventory */}
      {isMobile ? (
        <div className="space-y-3">
          {estoque.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum medicamento no estoque</p>}
          {estoque.map((item) => {
            const isLow = item.quantidade <= (item.estoque_minimo ?? 5);
            return (
              <Card key={item.id} className={isLow ? "border-destructive" : ""}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{item.nome}</span>
                      <p className="text-xs text-muted-foreground">{item.origem} · {item.unidade}</p>
                    </div>
                    <Badge variant={isLow ? "destructive" : "default"}>{item.quantidade} {item.unidade}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Mín: {item.estoque_minimo}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="destructive" onClick={() => openBaixa(item)}><Minus className="h-3 w-3 mr-1" /> Baixa</Button>
                    <Button size="sm" variant="secondary" onClick={() => openAddEstoque(item)}><PackagePlus className="h-3 w-3 mr-1" /> Adicionar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir "${item.nome}" e todo o histórico?`)) excluirItem.mutate(item); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-center">Estoque Mín.</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estoque.map((item) => {
                const isLow = item.quantidade <= (item.estoque_minimo ?? 5);
                return (
                  <TableRow key={item.id} className={isLow ? "bg-destructive/10" : ""}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={isLow ? "destructive" : "default"}>{item.quantidade}</Badge>
                    </TableCell>
                    <TableCell>{item.unidade}</TableCell>
                    <TableCell className="text-center">{item.estoque_minimo}</TableCell>
                    <TableCell className="capitalize">{item.origem}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => openBaixa(item)}><Minus className="h-3 w-3 mr-1" /> Baixa</Button>
                        <Button size="sm" variant="secondary" onClick={() => openAddEstoque(item)}><PackagePlus className="h-3 w-3 mr-1" /> Adicionar</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir "${item.nome}" e todo o histórico?`)) excluirItem.mutate(item); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {estoque.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum medicamento no estoque</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* History */}
      <Collapsible open={histOpen} onOpenChange={setHistOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2"><History className="h-4 w-4" /> Histórico de Movimentações</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${histOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="overflow-x-auto mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Paciente/Doador</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{m.data_movimentacao ? format(new Date(m.data_movimentacao), "dd/MM/yy HH:mm") : "-"}</TableCell>
                    <TableCell>{m.medicamento_id ? medNomes[m.medicamento_id] ?? "—" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.tipo === "entrada" ? "default" : "destructive"} className={m.tipo === "entrada" ? "bg-green-600 hover:bg-green-700" : ""}>
                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{m.quantidade}</TableCell>
                    <TableCell>{m.tipo === "entrada" ? (m.doador_nome || m.origem_entrada || "—") : (m.paciente_nome || "—")}</TableCell>
                    <TableCell>{m.hakuna_responsavel_nome || "—"}</TableCell>
                  </TableRow>
                ))}
                {movimentacoes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhuma movimentação registrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Modal: Novo Medicamento */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Medicamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={novoQtd} onChange={(e) => setNovoQtd(parseInt(e.target.value) || 1)} /></div>
              <div><Label>Unidade</Label>
                <Select value={novoUnidade} onValueChange={setNovoUnidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Estoque Mínimo</Label><Input type="number" min={0} value={novoEstoqueMin} onChange={(e) => setNovoEstoqueMin(parseInt(e.target.value) || 0)} /></div>
            <div><Label>Origem</Label>
              <Select value={novoOrigem} onValueChange={setNovoOrigem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="doacao">Doação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {novoOrigem === "doacao" && <div><Label>Nome do Doador</Label><Input value={novoDoador} onChange={(e) => setNovoDoador(e.target.value)} /></div>}
            <Button className="w-full" disabled={!novoNome || criarMedicamento.isPending} onClick={() => criarMedicamento.mutate()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Dar Baixa */}
      <Dialog open={baixaOpen} onOpenChange={setBaixaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dar Baixa — {selectedItem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantidade Utilizada</Label><Input type="number" min={1} max={selectedItem?.quantidade ?? 1} value={baixaQtd} onChange={(e) => setBaixaQtd(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Tipo de Paciente</Label>
              <Select value={baixaTipo} onValueChange={(v) => { setBaixaTipo(v); setBaixaPacienteId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="participante">Participante</SelectItem>
                  <SelectItem value="servidor">Servidor / Legendário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nome</Label>
              <Select value={baixaPacienteId} onValueChange={setBaixaPacienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {pacienteList.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {baixaTipo === "participante" && baixaPacienteId && (
              <div className="text-sm text-muted-foreground">
                Família: {participantes.find((p) => p.id === baixaPacienteId)?.familia_id ?? "—"}
              </div>
            )}
            {baixaTipo === "servidor" && baixaPacienteId && (
              <div className="text-sm text-muted-foreground">
                Equipe: {servidores.find((s) => s.id === baixaPacienteId)?.area_servico ?? "—"}
              </div>
            )}
            <div><Label>Hakuna Responsável</Label>
              <Select value={baixaHakunaId} onValueChange={setBaixaHakunaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {hakunas.map((h) => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea value={baixaObs} onChange={(e) => setBaixaObs(e.target.value)} rows={2} /></div>
            <Button className="w-full" variant="destructive" disabled={darBaixa.isPending} onClick={() => darBaixa.mutate()}>Registrar Baixa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar Estoque */}
      <Dialog open={addEstoqueOpen} onOpenChange={setAddEstoqueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Estoque — {selectedItem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantidade a Adicionar</Label><Input type="number" min={1} value={addQtd} onChange={(e) => setAddQtd(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Origem</Label>
              <Select value={addOrigem} onValueChange={setAddOrigem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="doacao">Doação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addOrigem === "doacao" && <div><Label>Nome do Doador</Label><Input value={addDoador} onChange={(e) => setAddDoador(e.target.value)} /></div>}
            <Button className="w-full" disabled={adicionarEstoque.isPending} onClick={() => adicionarEstoque.mutate()}>Adicionar ao Estoque</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
