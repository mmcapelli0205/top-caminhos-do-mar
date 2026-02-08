import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, RotateCcw } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-orange-100 text-orange-800",
  enviado: "bg-green-100 text-green-800",
  falha: "bg-red-100 text-red-800",
};

export default function WhatsAppLogSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [templateFilter, setTemplateFilter] = useState("todos");

  const { data: envios = [] } = useQuery({
    queryKey: ["whatsapp-envios", statusFilter, templateFilter],
    queryFn: async () => {
      let q = supabase.from("whatsapp_envios").select("*, whatsapp_templates(nome)").order("created_at", { ascending: false }).limit(200);
      if (statusFilter !== "todos") q = q.eq("status", statusFilter);
      if (templateFilter !== "todos") q = q.eq("template_id", templateFilter);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_templates").select("id, nome").order("nome");
      return data || [];
    },
  });

  const reenviar = async (envio: any) => {
    const configStr = localStorage.getItem("whatsapp_config");
    if (!configStr) { toast({ title: "Configure o webhook primeiro", variant: "destructive" }); return; }
    const config = JSON.parse(configStr);
    try {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: envio.destinatario_telefone, mensagem: envio.mensagem_enviada, nome: envio.destinatario_nome }),
      });
      await supabase.from("whatsapp_envios").update({ status: "pendente", erro: null }).eq("id", envio.id);
      toast({ title: "Reenviado" });
      qc.invalidateQueries({ queryKey: ["whatsapp-envios"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" /> Log de Envios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="falha">Falha</SelectItem>
            </SelectContent>
          </Select>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos templates</SelectItem>
              {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {envios.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum envio registrado</TableCell></TableRow>
              )}
              {envios.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs whitespace-nowrap">{e.created_at ? format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}</TableCell>
                  <TableCell className="text-sm">{e.destinatario_nome || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{e.destinatario_telefone || "—"}</TableCell>
                  <TableCell className="text-xs">{e.whatsapp_templates?.nome || "—"}</TableCell>
                  <TableCell><Badge className={STATUS_BADGE[e.status || "pendente"] + " text-xs"}>{e.status}</Badge></TableCell>
                  <TableCell className="text-xs text-destructive max-w-[150px] truncate">{e.erro || "—"}</TableCell>
                  <TableCell>
                    {e.status === "falha" && (
                      <Button variant="ghost" size="sm" onClick={() => reenviar(e)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
