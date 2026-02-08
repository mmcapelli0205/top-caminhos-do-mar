import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { VARIAVEIS_DISPONIVEIS } from "@/lib/whatsappUtils";

interface TemplateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: { id: string; nome: string; mensagem: string } | null;
}

export default function TemplateEditDialog({ open, onOpenChange, template }: TemplateEditDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (template) setMsg(template.mensagem); }, [template, open]);

  const handleSave = async () => {
    if (!template) return;
    setLoading(true);
    const { error } = await supabase.from("whatsapp_templates").update({ mensagem: msg, updated_at: new Date().toISOString() }).eq("id", template.id);
    setLoading(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Template atualizado" });
    qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar: {template?.nome}</DialogTitle></DialogHeader>
        <Textarea value={msg} onChange={e => setMsg(e.target.value)} rows={8} className="font-mono text-sm" />
        <div>
          <p className="text-xs text-muted-foreground mb-2">Variáveis disponíveis:</p>
          <div className="flex flex-wrap gap-1">
            {VARIAVEIS_DISPONIVEIS.map(v => (
              <Badge key={v} variant="outline" className="cursor-pointer text-xs font-mono" onClick={() => setMsg(m => m + `{{${v}}}`)}>
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
