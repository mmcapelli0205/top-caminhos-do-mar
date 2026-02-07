import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Doacao = Tables<"doacoes">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ReceitaSection = () => {
  const qc = useQueryClient();

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

  const totalDoacoes = (doacoes ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);

  // Editing state for doacoes
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState({ doador: "", valor: 0, data: "", observacoes: "" });
  const [newRow, setNewRow] = useState<{ doador: string; valor: number; data: string; observacoes: string } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (row: { id?: string; doador: string; valor: number; data: string; observacoes: string }) => {
      if (row.id) {
        const { error } = await supabase.from("doacoes").update({ doador: row.doador, valor: row.valor, data: row.data || null, observacoes: row.observacoes || null }).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doacoes").insert({ doador: row.doador, valor: row.valor, data: row.data || null, observacoes: row.observacoes || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-doacoes-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-doacoes"] });
      setEditId(null);
      setNewRow(null);
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
    setEditRow({ doador: d.doador, valor: d.valor, data: d.data ?? "", observacoes: d.observacoes ?? "" });
  };

  return (
    <div className="space-y-8">
      {/* Inscrições Participantes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Inscrições de Participantes</h3>
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
              {ativos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell className="text-right">{fmt(p.valor_pago ?? 0)}</TableCell>
                  <TableCell>{p.forma_pagamento ?? "-"}</TableCell>
                  <TableCell>{p.cupom_desconto ?? "-"}</TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Inscrições de Servidores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Inscrições de Servidores</h3>
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
              {servAtivos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum servidor com inscrição</TableCell>
                </TableRow>
              ) : (
                servAtivos.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nome}</TableCell>
                    <TableCell className="text-right">{fmt(s.valor_pago ?? 0)}</TableCell>
                    <TableCell>{s.forma_pagamento ?? "-"}</TableCell>
                    <TableCell>{s.cupom_desconto ?? "-"}</TableCell>
                    <TableCell>{s.status ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-right font-bold">Total Servidores: {fmt(totalServidores)}</p>
      </div>

      {/* Doações */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Doações</h3>
          <Button size="sm" onClick={() => setNewRow({ doador: "", valor: 0, data: new Date().toISOString().slice(0, 10), observacoes: "" })}>
            <Plus className="h-4 w-4 mr-1" /> Nova Doação
          </Button>
        </div>

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
                  <TableCell><Input value={newRow.doador} onChange={(e) => setNewRow({ ...newRow, doador: e.target.value })} placeholder="Doador" /></TableCell>
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
              {(doacoes ?? []).map((d) =>
                editId === d.id ? (
                  <TableRow key={d.id}>
                    <TableCell><Input value={editRow.doador} onChange={(e) => setEditRow({ ...editRow, doador: e.target.value })} /></TableCell>
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
                    <TableCell>{d.doador}</TableCell>
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
        <p className="text-right font-bold">Total Doações: {fmt(totalDoacoes)}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-lg font-bold">RECEITA TOTAL: {fmt(totalArrecadado + totalServidores + totalDoacoes)}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceitaSection;
