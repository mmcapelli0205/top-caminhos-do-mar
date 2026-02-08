import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GATILHO_COLORS } from "@/lib/whatsappUtils";
import { FileText, Pencil } from "lucide-react";
import TemplateEditDialog from "./TemplateEditDialog";

export default function WhatsAppTemplatesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: string; nome: string; mensagem: string } | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_templates").select("*").order("created_at");
      return data || [];
    },
  });

  const toggleAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase.from("whatsapp_templates").update({ ativo }).eq("id", id);
    if (error) toast({ title: "Erro", variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
  };

  const highlightVars = (msg: string) =>
    msg.split(/(\{\{\w+\}\})/).map((part, i) =>
      /\{\{\w+\}\}/.test(part) ? <span key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 font-mono text-xs">{part}</span> : part
    );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Templates de Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {templates.map(t => {
            const gc = GATILHO_COLORS[t.gatilho] || GATILHO_COLORS["geral"];
            return (
              <div key={t.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{t.nome}</span>
                    <Badge className={gc + " text-xs"}>{t.gatilho}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={!!t.ativo} onCheckedChange={v => toggleAtivo(t.id, v)} />
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ id: t.id, nome: t.nome, mensagem: t.mensagem })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{highlightVars(t.mensagem)}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <TemplateEditDialog open={!!editing} onOpenChange={o => !o && setEditing(null)} template={editing} />
    </>
  );
}
