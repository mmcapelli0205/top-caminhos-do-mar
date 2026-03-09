import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Check, Clock, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Reembolso {
  id: string;
  top_id: string | null;
  pedido_id: string | null;
  nome_pagador: string;
  descricao: string;
  valor: number;
  area: string | null;
  status: string;
  data_pagamento: string | null;
  data_reembolso: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  created_at: string | null;
}

const ReembolsosSection = () => {
  const qc = useQueryClient();
  const isMobile = useIsMobile();

  const { data: reembolsos = [], isLoading } = useQuery({
    queryKey: ["fin-reembolsos"],
    queryFn: async () => {
      const { data } = await supabase.from("reembolsos").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Reembolso[];
    },
  });

  const totalPendente = reembolsos.filter((r) => r.status === "pendente").reduce((s, r) => s + r.valor, 0);
  const totalReembolsado = reembolsos.filter((r) => r.status === "reembolsado").reduce((s, r) => s + r.valor, 0);

  // Mark as reimbursed modal
  const [markModal, setMarkModal] = useState<Reembolso | null>(null);
  const [markDate, setMarkDate] = useState("");
  const [markComprovante, setMarkComprovante] = useState("");

  const markMutation = useMutation({
    mutationFn: async () => {
      if (!markModal) return;
      const { error } = await supabase.from("reembolsos").update({
        status: "reembolsado",
        data_reembolso: markDate || null,
        comprovante_url: markComprovante || null,
      }).eq("id", markModal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-reembolsos"] });
      setMarkModal(null);
      toast({ title: "Reembolso marcado como realizado" });
    },
  });

  // New reembolso modal
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ nome_pagador: "", descricao: "", area: "", valor: 0, data_pagamento: "" });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reembolsos").insert({
        nome_pagador: newForm.nome_pagador,
        descricao: newForm.descricao,
        area: newForm.area || null,
        valor: newForm.valor,
        data_pagamento: newForm.data_pagamento || null,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-reembolsos"] });
      setNewModal(false);
      setNewForm({ nome_pagador: "", descricao: "", area: "", valor: 0, data_pagamento: "" });
      toast({ title: "Reembolso criado" });
    },
  });

  const openMarkModal = (r: Reembolso) => {
    setMarkModal(r);
    setMarkDate(new Date().toISOString().slice(0, 10));
    setMarkComprovante("");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total a Reembolsar</p>
              <p className="text-xl font-bold text-amber-500">{fmt(totalPendente)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Reembolsado</p>
              <p className="text-xl font-bold text-green-500">{fmt(totalReembolsado)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNewModal(true)}>
          <Plus className="h-4 w-4 mr-1" /> Reembolso
        </Button>
      </div>

      {/* Table */}
      {isMobile ? (
        <div className="space-y-2">
          {reembolsos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum reembolso registrado</p>
          ) : reembolsos.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{r.nome_pagador}</span>
                  <Badge variant="outline" className={r.status === "pendente" ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-green-500/20 text-green-500 border-green-500/30"}>
                    {r.status === "pendente" ? "Pendente" : "Reembolsado"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.descricao}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{fmt(r.valor)}</span>
                  {r.status === "pendente" && (
                    <Button size="sm" variant="outline" onClick={() => openMarkModal(r)}>
                      <DollarSign className="h-3 w-3 mr-1" /> Reembolsar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Pagador</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Área</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pgto</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reembolsos.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum reembolso registrado</TableCell></TableRow>
              ) : reembolsos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.nome_pagador}</TableCell>
                  <TableCell>{r.descricao}</TableCell>
                  <TableCell>{r.area ?? "-"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(r.valor)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.status === "pendente" ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-green-500/20 text-green-500 border-green-500/30"}>
                      {r.status === "pendente" ? "Pendente" : "Reembolsado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.data_pagamento ?? "-"}</TableCell>
                  <TableCell>
                    {r.status === "pendente" && (
                      <Button size="sm" variant="outline" onClick={() => openMarkModal(r)}>
                        <DollarSign className="h-3 w-3 mr-1" /> Reembolsar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mark as Reembolsado Dialog */}
      <Dialog open={!!markModal} onOpenChange={(open) => !open && setMarkModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Reembolsado</DialogTitle>
          </DialogHeader>
          {markModal && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {markModal.nome_pagador} — {markModal.descricao} — {fmt(markModal.valor)}
              </p>
              <div className="space-y-2">
                <Label>Data do Reembolso</Label>
                <Input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Comprovante (URL, opcional)</Label>
                <Input value={markComprovante} onChange={(e) => setMarkComprovante(e.target.value)} placeholder="Link do comprovante" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkModal(null)}>Cancelar</Button>
            <Button onClick={() => markMutation.mutate()} disabled={markMutation.isPending}>
              Confirmar Reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Reembolso Dialog */}
      <Dialog open={newModal} onOpenChange={setNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Reembolso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Pagador *</Label>
              <Input value={newForm.nome_pagador} onChange={(e) => setNewForm({ ...newForm, nome_pagador: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={newForm.descricao} onChange={(e) => setNewForm({ ...newForm, descricao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Input value={newForm.area} onChange={(e) => setNewForm({ ...newForm, area: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input type="number" min={0} step={0.01} value={newForm.valor || ""} onChange={(e) => setNewForm({ ...newForm, valor: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={newForm.data_pagamento} onChange={(e) => setNewForm({ ...newForm, data_pagamento: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newForm.nome_pagador || !newForm.descricao || !newForm.valor || createMutation.isPending}
            >
              Criar Reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReembolsosSection;
