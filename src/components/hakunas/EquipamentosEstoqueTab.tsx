import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Equip = Tables<"hakuna_estoque_equipamentos">;

const ESTADOS = ["novo", "bom", "regular", "ruim"] as const;
const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-green-600 hover:bg-green-700" },
  bom: { label: "Bom", className: "bg-blue-600 hover:bg-blue-700" },
  regular: { label: "Regular", className: "bg-yellow-600 hover:bg-yellow-700" },
  ruim: { label: "Ruim", className: "bg-destructive hover:bg-destructive/90" },
};

export default function EquipamentosEstoqueTab() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equip | null>(null);

  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [estado, setEstado] = useState("bom");
  const [observacao, setObservacao] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["hk-estoque-equipamentos"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_estoque_equipamentos").select("*").order("nome");
      return (data ?? []) as Equip[];
    },
  });

  const resetForm = () => { setNome(""); setQuantidade(1); setEstado("bom"); setObservacao(""); setEditing(null); };

  const openNew = () => { resetForm(); setFormOpen(true); };
  const openEdit = (item: Equip) => {
    setEditing(item);
    setNome(item.nome);
    setQuantidade(item.quantidade);
    setEstado(item.estado ?? "bom");
    setObservacao(item.observacao ?? "");
    setFormOpen(true);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = { nome, quantidade, estado, observacao: observacao || null };
      if (editing) {
        const { error } = await supabase.from("hakuna_estoque_equipamentos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hakuna_estoque_equipamentos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hk-estoque-equipamentos"] });
      setFormOpen(false); resetForm();
      toast({ title: editing ? "Equipamento atualizado" : "Equipamento adicionado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const estadoBadge = (e: string) => {
    const cfg = ESTADO_BADGE[e] || ESTADO_BADGE.bom;
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Equipamento</Button>

      {isMobile ? (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</p>}
          {items.map((item) => (
            <Card key={item.id} className="cursor-pointer" onClick={() => openEdit(item)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{item.nome}</span>
                  {estadoBadge(item.estado ?? "bom")}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Qtd: {item.quantidade}</span>
                  <Pencil className="h-3 w-3" />
                </div>
                {item.observacao && <p className="text-xs text-muted-foreground">{item.observacao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-center">{item.quantidade}</TableCell>
                  <TableCell>{estadoBadge(item.estado ?? "bom")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{item.observacao || "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={!!editing} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantidade</Label><Input type="number" min={0} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)} /></div>
              <div><Label>Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_BADGE[e].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observação</Label><Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} /></div>
            <Button className="w-full" disabled={!nome || salvar.isPending} onClick={() => salvar.mutate()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
