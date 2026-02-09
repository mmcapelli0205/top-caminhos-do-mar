import { useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableCell, TableBody,
} from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Participante } from "@/hooks/useParticipantes";
import { QrThumbnail } from "./QrThumbnail";

interface Props {
  participantes: Participante[];
  familiaMap: Map<number, number>;
}

export function QrCodeTab({ participantes, familiaMap }: Props) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [generating, setGenerating] = useState(false);
  const [zipping, setZipping] = useState(false);

  const handleGenerateAll = async () => {
    const missing = participantes.filter((p) => !p.qr_code);
    if (missing.length === 0) {
      toast({ title: "Todos já possuem QR Code" });
      return;
    }
    setGenerating(true);
    try {
      for (const p of missing) {
        const code = crypto.randomUUID();
        const { error } = await supabase
          .from("participantes")
          .update({ qr_code: code })
          .eq("id", p.id);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["participantes"] });
      toast({ title: `QR Codes gerados para ${missing.length} participantes` });
    } catch (e: any) {
      toast({ title: "Erro ao gerar QR Codes", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const sanitize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

  const handleDownloadZip = async () => {
    const withQr = participantes.filter((p) => p.qr_code);
    if (withQr.length === 0) {
      toast({ title: "Nenhum QR Code para baixar" });
      return;
    }
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const p of withQr) {
        const dataUrl = await QRCode.toDataURL(p.qr_code!, { width: 400, margin: 2 });
        const base64 = dataUrl.split(",")[1];
        const famNum = p.familia_id ? familiaMap.get(p.familia_id) ?? "?" : "?";
        const filename = `QR_${sanitize(p.nome)}_Familia${famNum}.png`;
        zip.file(filename, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcodes-participantes.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Erro ao gerar ZIP", description: e.message, variant: "destructive" });
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="w-full sm:w-auto" onClick={handleGenerateAll} disabled={generating}>
          <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Gerando..." : "Gerar Todos QR Codes"}
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" onClick={handleDownloadZip} disabled={zipping}>
          <Download className="h-4 w-4" />
          {zipping ? "Empacotando..." : "Baixar QR Codes (ZIP)"}
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {participantes.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium truncate">{p.nome}</span>
                  <Badge variant={p.checkin_realizado ? "default" : "secondary"}>
                    {p.checkin_realizado ? "Check-in ✓" : "Pendente"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Família: {p.familia_id ? familiaMap.get(p.familia_id) ?? "-" : "-"}</span>
                  {p.qr_code ? (
                    <QrThumbnail value={p.qr_code} size={48} />
                  ) : (
                    <span className="text-xs">Sem QR</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>{p.familia_id ? familiaMap.get(p.familia_id) ?? "-" : "-"}</TableCell>
                  <TableCell>
                    {p.qr_code ? (
                      <QrThumbnail value={p.qr_code} size={48} />
                    ) : (
                      <span className="text-muted-foreground text-xs">Sem QR</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.checkin_realizado ? "default" : "secondary"}>
                      {p.checkin_realizado ? "Check-in ✓" : "Pendente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
