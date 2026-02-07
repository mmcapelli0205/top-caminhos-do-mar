import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onDone: () => void;
}

export default function BatchEditDialog({ open, onOpenChange, selectedIds, onDone }: BatchEditDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("__skip__");
  const [contratoAssinado, setContratoAssinado] = useState<boolean | null>(null);
  const [ergoStatus, setErgoStatus] = useState<string>("__skip__");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const updates: Record<string, unknown> = {};
    if (status !== "__skip__") updates.status = status;
    if (contratoAssinado !== null) updates.contrato_assinado = contratoAssinado;
    if (ergoStatus !== "__skip__") updates.ergometrico_status = ergoStatus;

    if (Object.keys(updates).length === 0) {
      toast.info("Nenhum campo alterado.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("participantes")
      .update(updates)
      .in("id", selectedIds);

    setSaving(false);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return;
    }

    toast.success(`${selectedIds.length} participante(s) atualizado(s).`);
    queryClient.invalidateQueries({ queryKey: ["participantes"] });
    onDone();
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStatus("__skip__");
    setContratoAssinado(null);
    setErgoStatus("__skip__");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar em Lote</DialogTitle>
          <DialogDescription>
            Aplicar alterações a {selectedIds.length} participante(s). Campos com "Não alterar" serão ignorados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__skip__">— Não alterar —</SelectItem>
                <SelectItem value="inscrito">Inscrito</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contrato Assinado</Label>
            <div className="flex items-center gap-3">
              <Select
                value={contratoAssinado === null ? "__skip__" : contratoAssinado ? "sim" : "nao"}
                onValueChange={(v) => {
                  if (v === "__skip__") setContratoAssinado(null);
                  else setContratoAssinado(v === "sim");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">— Não alterar —</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ergométrico</Label>
            <Select value={ergoStatus} onValueChange={setErgoStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__skip__">— Não alterar —</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="dispensado">Dispensado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
            {saving ? "Salvando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
