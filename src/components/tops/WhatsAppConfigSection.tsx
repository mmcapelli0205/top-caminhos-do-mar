import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Wifi } from "lucide-react";

interface WhatsAppConfig {
  url: string;
  apiKey: string;
  instancia: string;
  webhookUrl: string;
}

const STORAGE_KEY = "whatsapp_config";

export default function WhatsAppConfigSection() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhatsAppConfig>({ url: "", apiKey: "", instancia: "", webhookUrl: "" });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const save = (c: WhatsAppConfig) => {
    setConfig(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const testConnection = async () => {
    if (!config.url || !config.instancia || !config.apiKey) {
      toast({ title: "Preencha URL, Instância e API Key", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(`${config.url}/instance/connectionState/${config.instancia}`, {
        headers: { apikey: config.apiKey },
      });
      const data = await res.json();
      toast({ title: res.ok ? "Conexão OK" : "Erro na conexão", description: JSON.stringify(data).slice(0, 200) });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" /> Configuração da API</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div><Label>URL da Evolution API</Label><Input placeholder="https://evolution.seudominio.com" value={config.url} onChange={e => save({ ...config, url: e.target.value })} /></div>
        <div><Label>API Key</Label><Input type="password" value={config.apiKey} onChange={e => save({ ...config, apiKey: e.target.value })} /></div>
        <div><Label>Nome da Instância</Label><Input value={config.instancia} onChange={e => save({ ...config, instancia: e.target.value })} /></div>
        <div><Label>URL do Webhook N8N</Label><Input placeholder="https://n8n.seudominio.com/webhook/..." value={config.webhookUrl} onChange={e => save({ ...config, webhookUrl: e.target.value })} /></div>
        <Button variant="outline" onClick={testConnection} disabled={testing} className="w-fit">
          <Wifi className="h-4 w-4 mr-2" />{testing ? "Testando..." : "Testar Conexão"}
        </Button>
      </CardContent>
    </Card>
  );
}
