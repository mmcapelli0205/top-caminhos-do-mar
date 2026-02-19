import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableHeader, TableRow, TableHead, TableCell, TableBody,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Download, Plus, Ban, Loader2, Smartphone, SkipForward, ArrowLeft } from "lucide-react";

export function PulseirasTab() {
  const queryClient = useQueryClient();
  const [quantidade, setQuantidade] = useState(150);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [zipping, setZipping] = useState(false);

  // NFC state
  const [nfcOpen, setNfcOpen] = useState(false);
  const [nfcIndex, setNfcIndex] = useState(0);
  const [nfcGravadas, setNfcGravadas] = useState(0);
  const [nfcWriting, setNfcWriting] = useState(false);

  const { data: pulseiras = [], isLoading } = useQuery({
    queryKey: ["pulseiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pulseiras")
        .select("*, participantes(nome)")
        .order("codigo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const disponiveis = pulseiras.filter(p => p.status === "disponivel").length;
  const vinculadas = pulseiras.filter(p => p.status === "vinculada").length;
  const total = pulseiras.length;

  const filtered = filtroStatus === "todas"
    ? pulseiras
    : pulseiras.filter(p => p.status === filtroStatus);

  const nfcList = pulseiras.filter(p => p.status === "disponivel");
  const nfcCurrent = nfcList[nfcIndex] ?? null;
  const nfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

  const gerarMutation = useMutation({
    mutationFn: async () => {
      const { data: top } = await supabase
        .from("tops")
        .select("id, nome")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!top) throw new Error("Nenhum TOP ativo encontrado");
      const topNumero = top.nome.replace(/\D/g, "") || "0";
      const { data: lastPulseira } = await supabase
        .from("pulseiras")
        .select("codigo")
        .like("codigo", `TOP-${topNumero}-%`)
        .order("codigo", { ascending: false })
        .limit(1)
        .maybeSingle();
      let startSeq = 1;
      if (lastPulseira) {
        const parts = lastPulseira.codigo.split("-");
        startSeq = parseInt(parts[2], 10) + 1;
      }
      const batch: { codigo: string; status: string; top_id: string }[] = [];
      for (let i = 0; i < quantidade; i++) {
        const seq = (startSeq + i).toString().padStart(4, "0");
        batch.push({ codigo: `TOP-${topNumero}-${seq}`, status: "disponivel", top_id: top.id });
      }
      for (let i = 0; i < batch.length; i += 100) {
        const chunk = batch.slice(i, i + 100);
        const { error } = await supabase.from("pulseiras").insert(chunk);
        if (error) throw error;
      }
      return quantidade;
    },
    onSuccess: (count) => {
      toast({ title: `${count} pulseiras geradas com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ["pulseiras"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao gerar pulseiras", description: e.message, variant: "destructive" });
    },
  });

  const danificarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pulseiras").update({ status: "danificada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pulseira marcada como danificada" });
      queryClient.invalidateQueries({ queryKey: ["pulseiras"] });
    },
  });

  const handleDownloadZip = async () => {
    const disponiveisArr = pulseiras.filter(p => p.status === "disponivel");
    if (disponiveisArr.length === 0) { toast({ title: "Nenhuma pulseira disponível" }); return; }
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const p of disponiveisArr) {
        const canvas = document.createElement("canvas");
        canvas.width = 200; canvas.height = 230;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 200, 230);
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, p.codigo, { width: 180, margin: 1 });
        ctx.drawImage(qrCanvas, 10, 5);
        ctx.fillStyle = "#000000"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
        ctx.fillText(p.codigo, 100, 220);
        const base64 = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`${p.codigo}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "pulseiras-qrcodes.zip"; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Erro ao gerar ZIP", description: e.message, variant: "destructive" });
    } finally { setZipping(false); }
  };

  const handleNfcWrite = async () => {
    if (!nfcCurrent || !nfcSupported) return;
    setNfcWriting(true);
    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.write({ records: [{ recordType: "text", data: nfcCurrent.codigo }] });
      toast({ title: `✅ Tag gravada: ${nfcCurrent.codigo}` });
      setNfcGravadas(prev => prev + 1);
      setNfcIndex(prev => Math.min(prev + 1, nfcList.length - 1));
    } catch (e: any) {
      toast({ title: "Erro NFC", description: e.message, variant: "destructive" });
    } finally { setNfcWriting(false); }
  };

  const handleNfcSkip = async () => {
    if (!nfcCurrent) return;
    await danificarMutation.mutateAsync(nfcCurrent.id);
    setNfcIndex(prev => Math.min(prev + 1, nfcList.length));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-sm">{disponiveis} disponíveis</Badge>
        <Badge className="text-sm">{vinculadas} vinculadas</Badge>
        <Badge variant="secondary" className="text-sm">{total} total</Badge>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold">Gerar Novas Pulseiras</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Quantidade</label>
              <Input type="number" min={1} max={500} value={quantidade}
                onChange={e => setQuantidade(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <Button onClick={() => gerarMutation.mutate()} disabled={gerarMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
              {gerarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Gerar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={handleDownloadZip} disabled={zipping}>
          <Download className="h-4 w-4" /> {zipping ? "Gerando ZIP..." : "Baixar QR Codes (ZIP)"}
        </Button>
        <Button onClick={() => { setNfcIndex(0); setNfcGravadas(0); setNfcOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Smartphone className="h-4 w-4" /> Gravar NFC
        </Button>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="disponivel">Disponíveis</SelectItem>
            <SelectItem value="vinculada">Vinculadas</SelectItem>
            <SelectItem value="danificada">Danificadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NFC Dialog */}
      <Dialog open={nfcOpen} onOpenChange={setNfcOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Gravar Tags NFC</DialogTitle>
          </DialogHeader>
          {!nfcSupported ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-muted-foreground">NFC não disponível neste navegador.</p>
              <p className="text-sm text-muted-foreground">Use Chrome no Android sobre HTTPS.</p>
              <p className="text-sm">Alternativa: use "Baixar QR Codes (ZIP)" para imprimir.</p>
            </div>
          ) : nfcList.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma pulseira disponível para gravar.</p>
          ) : nfcIndex >= nfcList.length ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xl font-bold text-green-400">✅ Todas as tags foram processadas!</p>
              <p>{nfcGravadas} tags gravadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Próxima tag:</p>
                <p className="text-2xl font-mono font-bold">{nfcCurrent?.codigo}</p>
              </div>
              <Progress value={nfcList.length > 0 ? (nfcGravadas / nfcList.length) * 100 : 0} />
              <p className="text-center text-sm text-muted-foreground">{nfcGravadas} de {nfcList.length} tags gravadas</p>
              <Button onClick={handleNfcWrite} disabled={nfcWriting} className="w-full h-16 text-lg bg-purple-600 hover:bg-purple-700">
                {nfcWriting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Smartphone className="h-5 w-5 mr-2" />}
                Gravar na Tag
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setNfcIndex(prev => Math.max(0, prev - 1))} disabled={nfcIndex === 0} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button variant="outline" onClick={handleNfcSkip} className="flex-1">
                  <SkipForward className="h-4 w-4 mr-1" /> Pular (danificar)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>Vinculada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "disponivel" ? "outline" : p.status === "vinculada" ? "default" : "destructive"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(p as any).participantes?.nome ?? "—"}</TableCell>
                  <TableCell className="text-sm">{p.vinculada_em ? new Date(p.vinculada_em).toLocaleString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    {p.status === "disponivel" && (
                      <Button size="sm" variant="ghost" onClick={() => danificarMutation.mutate(p.id)} disabled={danificarMutation.isPending}>
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 100 && (
            <p className="text-sm text-muted-foreground text-center py-2">Mostrando 100 de {filtered.length} pulseiras</p>
          )}
        </div>
      )}
    </div>
  );
}
