import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Doacao = Tables<"doacoes">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ReceitaSection = () => {
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const [openParticipantes, setOpenParticipantes] = useState(false);
  const [openServidores, setOpenServidores] = useState(false);
  const [openDoacoesFinanceiras, setOpenDoacoesFinanceiras] = useState(false);
  const [openDoacoesMateriais, setOpenDoacoesMateriais] = useState(false);
  const [filtroDoadorMaterial, setFiltroDoadorMaterial] = useState("Todos");

  // Participantes (read-only)
  const { data: participantes } = useQuery({
    queryKey: ["fin-participantes-receita"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("id, nome, valor_pago, forma_pagamento, cupom_desconto, status").order("nome");
      return data ?? [];
    },
  });

  const ativos = (participantes ?? []).filter((p) => p.status !== "cancelado");
  const totalArrecadado = ativos.reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const pix = ativos.filter((p) => p.forma_pagamento === "PIX");
  const cartao = ativos.filter((p) => p.forma_pagamento === "Cartão");
  const multiplos = ativos.filter((p) => p.forma_pagamento === "Múltiplos Cartões");
  const comCupom = ativos.filter((p) => p.cupom_desconto);

  // Servidores (read-only)
  const { data: servidores } = useQuery({
    queryKey: ["fin-servidores-receita"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome, valor_pago, forma_pagamento, cupom_desconto, status").order("nome");
      return data ?? [];
    },
  });

  const servAtivos = (servidores ?? []).filter((s: any) => s.status !== "cancelado");
  const totalServidores = servAtivos.reduce((s, p: any) => s + (p.valor_pago ?? 0), 0);
  const servPix = servAtivos.filter((s: any) => s.forma_pagamento === "PIX");
  const servCartao = servAtivos.filter((s: any) => s.forma_pagamento === "Cartão");

  // Doações
  const { data: doacoes } = useQuery({
    queryKey: ["fin-doacoes-lista"],
    queryFn: async () => {
      const { data } = await supabase.from("doacoes").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Doacao[];
    },
  });

  const doacoesFinanceiras = (doacoes ?? []).filter((d) => d.tipo === "financeira");
  const doacoesMateriais = (doacoes ?? []).filter((d) => d.tipo === "material");
  const totalDoacoesFinanceiras = doacoesFinanceiras.reduce((s, d) => s + (d.valor ?? 0), 0);
  const totalDoacoesMateriais = doacoesMateriais.reduce((s, d) => s + (d.valor ?? 0), 0);

  // Editing state for doacoes financeiras
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState({ doador: "", valor: 0, data: "", observacoes: "", anonimo: false });
  const [newRow, setNewRow] = useState<{ doador: string; valor: number; data: string; observacoes: string; anonimo: boolean } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (row: { id?: string; doador: string; valor: number; data: string; observacoes: string; anonimo: boolean }) => {
      if (row.id) {
        const { error } = await supabase.from("doacoes").update({
          doador: row.doador, valor: row.valor, data: row.data || null,
          observacoes: row.observacoes || null, anonimo: row.anonimo,
        }).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doacoes").insert({
          doador: row.doador, valor: row.valor, data: row.data || null,
          observacoes: row.observacoes || null, anonimo: row.anonimo, tipo: "financeira",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-doacoes-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-doacoes"] });
      setEditId(null); setNewRow(null);
      toast({ title: "Doação salva" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-doacoes-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-doacoes"] });
      toast({ title: "Doação excluída" });
    },
  });

  const startEdit = (d: Doacao) => {
    setEditId(d.id);
    setEditRow({ doador: d.doador, valor: d.valor, data: d.data ?? "", observacoes: d.observacoes ?? "", anonimo: d.anonimo ?? false });
  };

  const displayDoador = (d: Doacao) => d.anonimo ? "Anônimo" : d.doador;

  const renderPeopleList = (items: any[], label: string) => {
    if (isMobile) {
      return (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum {label}</p>
          ) : items.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium truncate">{p.nome}</span>
                  <span className="font-bold">{fmt(p.valor_pago ?? 0)}</span>
                </div>
                <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                  <span>{p.forma_pagamento ?? "-"}</span>
                  {p.cupom_desconto && <span>Cupom: {p.cupom_desconto}</span>}
                  <span>{p.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Valor Pago</TableHead>
              <TableHead>Forma Pgto</TableHead>
              <TableHead>Cupom</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum {label}</TableCell></TableRow>
            ) : items.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>{p.nome}</TableCell>
                <TableCell className="text-right">{fmt(p.valor_pago ?? 0)}</TableCell>
                <TableCell>{p.forma_pagamento ?? "-"}</TableCell>
                <TableCell>{p.cupom_desconto ?? "-"}</TableCell>
                <TableCell>{p.status ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const AnonCheckbox = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} id="anonimo-check" />
      <label htmlFor="anonimo-check" className="text-sm cursor-pointer">Anônimo</label>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Inscrições Participantes */}
      <Collapsible open={openParticipantes} onOpenChange={setOpenParticipantes}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Inscrições de Participantes</h3>
              <span className="text-sm text-muted-foreground">({ativos.length} participantes)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">{fmt(totalArrecadado)}</span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openParticipantes ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Arrecadado", value: fmt(totalArrecadado), count: ativos.length },
              { label: "PIX", value: fmt(pix.reduce((s, p) => s + (p.valor_pago ?? 0), 0)), count: pix.length },
              { label: "Cartão", value: fmt(cartao.reduce((s, p) => s + (p.valor_pago ?? 0), 0)), count: cartao.length },
              { label: "Múltiplos Cartões", value: fmt(multiplos.reduce((s, p) => s + (p.valor_pago ?? 0), 0)), count: multiplos.length },
              { label: "Com Cupom", value: fmt(comCupom.reduce((s, p) => s + (p.valor_pago ?? 0), 0)), count: comCupom.length },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.count} participantes</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {renderPeopleList(ativos, "participante")}
        </CollapsibleContent>
      </Collapsible>

      {/* Inscrições de Servidores */}
      <Collapsible open={openServidores} onOpenChange={setOpenServidores}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Inscrições de Servidores</h3>
              <span className="text-sm text-muted-foreground">({servAtivos.length} servidores)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">{fmt(totalServidores)}</span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openServidores ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Total Arrecadado", value: fmt(totalServidores), count: servAtivos.length, sub: "servidores" },
              { label: "PIX", value: fmt(servPix.reduce((s, p: any) => s + (p.valor_pago ?? 0), 0)), count: servPix.length, sub: "servidores" },
              { label: "Cartão", value: fmt(servCartao.reduce((s, p: any) => s + (p.valor_pago ?? 0), 0)), count: servCartao.length, sub: "servidores" },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.count} {c.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {renderPeopleList(servAtivos, "servidor")}
        </CollapsibleContent>
      </Collapsible>

      {/* Doações Financeiras */}
      <Collapsible open={openDoacoesFinanceiras} onOpenChange={setOpenDoacoesFinanceiras}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Doações Financeiras</h3>
              <span className="text-sm text-muted-foreground">({doacoesFinanceiras.length} doações)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">{fmt(totalDoacoesFinanceiras)}</span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openDoacoesFinanceiras ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Doações Financeiras</p>
              <p className="text-lg font-bold text-green-500">{fmt(totalDoacoesFinanceiras)}</p>
              <p className="text-xs text-muted-foreground">Entra no cálculo do Fluxo de Caixa como Receita</p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setNewRow({ doador: "", valor: 0, data: new Date().toISOString().slice(0, 10), observacoes: "", anonimo: false })}>
              <Plus className="h-4 w-4 mr-1" /> Nova Doação
            </Button>
          </div>

          {isMobile ? (
            <div className="space-y-2">
              {newRow && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <Input value={newRow.doador} onChange={(e) => setNewRow({ ...newRow, doador: e.target.value })} placeholder="Doador" />
                    <Input type="number" value={newRow.valor || ""} onChange={(e) => setNewRow({ ...newRow, valor: parseFloat(e.target.value) || 0 })} placeholder="Valor" />
                    <Input type="date" value={newRow.data} onChange={(e) => setNewRow({ ...newRow, data: e.target.value })} />
                    <Input value={newRow.observacoes} onChange={(e) => setNewRow({ ...newRow, observacoes: e.target.value })} placeholder="Observações" />
                    <AnonCheckbox checked={newRow.anonimo} onChange={(v) => setNewRow({ ...newRow, anonimo: v })} />
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm" onClick={() => saveMutation.mutate(newRow)}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
                      <Button variant="outline" size="sm" onClick={() => setNewRow(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {doacoesFinanceiras.map((d) =>
                editId === d.id ? (
                  <Card key={d.id}>
                    <CardContent className="p-3 space-y-2">
                      <Input value={editRow.doador} onChange={(e) => setEditRow({ ...editRow, doador: e.target.value })} />
                      <Input type="number" value={editRow.valor || ""} onChange={(e) => setEditRow({ ...editRow, valor: parseFloat(e.target.value) || 0 })} />
                      <Input type="date" value={editRow.data} onChange={(e) => setEditRow({ ...editRow, data: e.target.value })} />
                      <Input value={editRow.observacoes} onChange={(e) => setEditRow({ ...editRow, observacoes: e.target.value })} placeholder="Observações" />
                      <AnonCheckbox checked={editRow.anonimo} onChange={(v) => setEditRow({ ...editRow, anonimo: v })} />
                      <div className="flex gap-2">
                        <Button className="flex-1" size="sm" onClick={() => saveMutation.mutate({ id: d.id, ...editRow })}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card key={d.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{displayDoador(d)}</span>
                        <span className="font-bold">{fmt(d.valor)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">{d.data ?? "-"}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(d)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newRow && (
                    <TableRow>
                      <TableCell>
                        <div className="space-y-1">
                          <Input value={newRow.doador} onChange={(e) => setNewRow({ ...newRow, doador: e.target.value })} placeholder="Doador" />
                          <AnonCheckbox checked={newRow.anonimo} onChange={(v) => setNewRow({ ...newRow, anonimo: v })} />
                        </div>
                      </TableCell>
                      <TableCell><Input type="number" value={newRow.valor || ""} onChange={(e) => setNewRow({ ...newRow, valor: parseFloat(e.target.value) || 0 })} className="text-right" /></TableCell>
                      <TableCell><Input type="date" value={newRow.data} onChange={(e) => setNewRow({ ...newRow, data: e.target.value })} /></TableCell>
                      <TableCell><Input value={newRow.observacoes} onChange={(e) => setNewRow({ ...newRow, observacoes: e.target.value })} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveMutation.mutate(newRow)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setNewRow(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {doacoesFinanceiras.map((d) =>
                    editId === d.id ? (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Input value={editRow.doador} onChange={(e) => setEditRow({ ...editRow, doador: e.target.value })} />
                            <AnonCheckbox checked={editRow.anonimo} onChange={(v) => setEditRow({ ...editRow, anonimo: v })} />
                          </div>
                        </TableCell>
                        <TableCell><Input type="number" value={editRow.valor || ""} onChange={(e) => setEditRow({ ...editRow, valor: parseFloat(e.target.value) || 0 })} className="text-right" /></TableCell>
                        <TableCell><Input type="date" value={editRow.data} onChange={(e) => setEditRow({ ...editRow, data: e.target.value })} /></TableCell>
                        <TableCell><Input value={editRow.observacoes} onChange={(e) => setEditRow({ ...editRow, observacoes: e.target.value })} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => saveMutation.mutate({ id: d.id, ...editRow })}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={d.id}>
                        <TableCell>{displayDoador(d)}</TableCell>
                        <TableCell className="text-right">{fmt(d.valor)}</TableCell>
                        <TableCell>{d.data ?? "-"}</TableCell>
                        <TableCell>{d.observacoes ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Itens Abençoados — Doações Materiais */}
      <Collapsible open={openDoacoesMateriais} onOpenChange={setOpenDoacoesMateriais}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Itens Abençoados — Doações Materiais</h3>
              <span className="text-sm text-muted-foreground">({doacoesMateriais.length} itens)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">{fmt(totalDoacoesMateriais)}</span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openDoacoesMateriais ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Itens Abençoados (valor estimado)</p>
              <p className="text-lg font-bold text-blue-500">{fmt(totalDoacoesMateriais)}</p>
              <p className="text-xs text-muted-foreground">NÃO entra no cálculo do Fluxo de Caixa</p>
            </CardContent>
          </Card>

          {isMobile ? (
            <div className="space-y-2">
              {doacoesMateriais.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum item doado</p>
              ) : doacoesMateriais.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{displayDoador(d)}</span>
                      <span className="font-bold">{fmt(d.valor)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{d.item_descricao ?? "-"}</p>
                    {d.quantidade && <p className="text-xs text-muted-foreground">Qtd: {d.quantidade}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doador</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Valor Estimado</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Pedido de Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doacoesMateriais.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum item doado</TableCell></TableRow>
                  ) : doacoesMateriais.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{displayDoador(d)}</TableCell>
                      <TableCell>{d.item_descricao ?? "-"}</TableCell>
                      <TableCell className="text-right">{fmt(d.valor)}</TableCell>
                      <TableCell className="text-right">{d.quantidade ?? "-"}</TableCell>
                      <TableCell>{d.pedido_id ? "Sim" : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardContent className="p-4">
          <p className="text-lg font-bold">RECEITA TOTAL: {fmt(totalArrecadado + totalServidores + totalDoacoesFinanceiras)}</p>
          <p className="text-xs text-muted-foreground">Doações materiais ({fmt(totalDoacoesMateriais)}) não incluídas no total</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceitaSection;
