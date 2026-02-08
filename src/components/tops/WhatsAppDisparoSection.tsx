import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { substituirVariaveis } from "@/lib/whatsappUtils";
import { Send, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function WhatsAppDisparoSection() {
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState("");
  const [destino, setDestino] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [pessoaId, setPessoaId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_templates").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  const { data: familias = [] } = useQuery({
    queryKey: ["familias-list"],
    queryFn: async () => {
      const { data } = await supabase.from("familias").select("id, numero, nome");
      return data || [];
    },
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["participantes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("id, nome, telefone");
      return data || [];
    },
  });

  const { data: destinatarios = [] } = useQuery({
    queryKey: ["disparo-dest", destino, familiaId, pessoaId],
    enabled: !!destino,
    queryFn: async () => {
      if (destino === "todos_participantes") {
        const { data } = await supabase.from("participantes").select("id, nome, telefone");
        return data || [];
      }
      if (destino === "todos_servidores") {
        const { data } = await supabase.from("servidores").select("id, nome, telefone");
        return data || [];
      }
      if (destino === "sem_ergometrico") {
        const { data } = await supabase.from("participantes").select("id, nome, telefone").eq("ergometrico_status", "pendente");
        return data || [];
      }
      if (destino === "familia" && familiaId) {
        const { data } = await supabase.from("participantes").select("id, nome, telefone").eq("familia_id", Number(familiaId));
        return data || [];
      }
      if (destino === "pessoa" && pessoaId) {
        const { data } = await supabase.from("participantes").select("id, nome, telefone").eq("id", pessoaId);
        return data || [];
      }
      return [];
    },
  });

  const selectedTemplate = templates.find(t => t.id === templateId);

  const handleSend = async () => {
    if (!selectedTemplate || destinatarios.length === 0) return;
    const configStr = localStorage.getItem("whatsapp_config");
    if (!configStr) { toast({ title: "Configure o webhook primeiro", variant: "destructive" }); return; }
    const config = JSON.parse(configStr);
    if (!config.webhookUrl) { toast({ title: "URL do webhook não configurada", variant: "destructive" }); return; }

    setSending(true);
    setConfirmOpen(false);
    let count = 0;
    for (const d of destinatarios) {
      const mensagem = substituirVariaveis(selectedTemplate.mensagem, { nome: d.nome, telefone: d.telefone });
      try {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone: d.telefone, mensagem, nome: d.nome, template: selectedTemplate.gatilho, top_id: selectedTemplate.top_id }),
        });
      } catch {}
      await supabase.from("whatsapp_envios").insert({
        template_id: selectedTemplate.id, destinatario_nome: d.nome,
        destinatario_telefone: d.telefone, mensagem_enviada: mensagem,
        status: "pendente", top_id: selectedTemplate.top_id,
      });
      count++;
    }
    setSending(false);
    toast({ title: `Enviando ${count} mensagens...` });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4" /> Disparo Manual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destino</Label>
            <Select value={destino} onValueChange={v => { setDestino(v); setFamiliaId(""); setPessoaId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos_participantes">Todos Participantes</SelectItem>
                <SelectItem value="todos_servidores">Todos Servidores</SelectItem>
                <SelectItem value="sem_ergometrico">Participantes sem Ergométrico</SelectItem>
                <SelectItem value="familia">Família específica</SelectItem>
                <SelectItem value="pessoa">Pessoa específica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {destino === "familia" && (
            <div>
              <Label>Família</Label>
              <Select value={familiaId} onValueChange={setFamiliaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{familias.map(f => <SelectItem key={f.id} value={String(f.id)}>Família {f.numero}{f.nome ? ` - ${f.nome}` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {destino === "pessoa" && (
            <div>
              <Label>Pessoa</Label>
              <Select value={pessoaId} onValueChange={setPessoaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{participantes.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {destino && (
            <p className="text-sm text-muted-foreground">{destinatarios.length} destinatário(s)</p>
          )}
          <Button onClick={() => setConfirmOpen(true)} disabled={!templateId || destinatarios.length === 0 || sending}>
            <Send className="h-4 w-4 mr-2" />{sending ? "Enviando..." : "Enviar"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Confirmar envio</DialogTitle></DialogHeader>
          <p>Enviar <strong>{selectedTemplate?.nome}</strong> para <strong>{destinatarios.length}</strong> pessoa(s)?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
