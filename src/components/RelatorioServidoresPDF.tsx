import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const AREAS = [
  "Hakuna",
  "Segurança",
  "Eventos",
  "Mídia",
  "Comunicação",
  "Logística",
  "Voz",
  "ADM",
  "Intercessão",
  "DOC",
  "Diretoria",
];

const ORDEM_CARGO = [
  "Coord 01",
  "Coord 02",
  "Coord 03",
  "Flutuante 01",
  "Flutuante 02",
  "Flutuante 03",
  "Expert",
];

const CORES_AREAS: Record<string, string> = {
  Hakuna: "#2196F3",
  "Segurança": "#4CAF50",
  Eventos: "#FF9800",
  "Mídia": "#9C27B0",
  "Comunicação": "#F44336",
  "Logística": "#795548",
  Voz: "#00BCD4",
  ADM: "#607D8B",
  "Intercessão": "#E91E63",
  DOC: "#3F51B5",
  Diretoria: "#B8860B",
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function ordenarCargo(cargo: string | null): number {
  const idx = ORDEM_CARGO.indexOf(cargo ?? "");
  return idx === -1 ? 999 : idx;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const RelatorioServidoresPDF = ({ open, onOpenChange }: Props) => {
  const [areaFiltro, setAreaFiltro] = useState("Todas");
  const [gerando, setGerando] = useState(false);

  const gerarPDF = async () => {
    setGerando(true);
    try {
      // 1. Buscar servidores
      let query = supabase
        .from("servidores")
        .select("nome, area_servico, cargo_area, status")
        .order("nome", { ascending: true });

      if (areaFiltro !== "Todas") {
        query = query.eq("area_servico", areaFiltro);
      }

      const { data: servidores, error } = await query;
      if (error) throw error;
      if (!servidores || servidores.length === 0) {
        toast({ title: "Nenhum servidor encontrado.", variant: "destructive" });
        setGerando(false);
        return;
      }

      // 2. Agrupar por área e ordenar
      const grupos: Record<string, typeof servidores> = {};
      for (const s of servidores) {
        const area = s.area_servico || "Sem Área";
        if (!grupos[area]) grupos[area] = [];
        grupos[area].push(s);
      }

      // Ordenar servidores dentro de cada área
      for (const area of Object.keys(grupos)) {
        grupos[area].sort((a, b) => {
          const oa = ordenarCargo(a.cargo_area);
          const ob = ordenarCargo(b.cargo_area);
          if (oa !== ob) return oa - ob;
          return (a.nome || "").localeCompare(b.nome || "");
        });
      }

      // Ordenar as áreas pela ordem canônica
      const areasOrdenadas = Object.keys(grupos).sort((a, b) => {
        const ia = AREAS.indexOf(a);
        const ib = AREAS.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      // 3. Configurar PDF
      const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      const contentW = pageW - margin * 2;
      const now = new Date();
      const dataStr = now.toLocaleDateString("pt-BR");
      const horaStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const filtroLabel = areaFiltro === "Todas" ? "Todas as Áreas" : areaFiltro;
      const totalServidores = servidores.length;
      const totalAreas = areasOrdenadas.length;
      const mediaArea = totalAreas > 0 ? (totalServidores / totalAreas).toFixed(1) : "0";

      // Carregar logo
      const logoBase64 = await loadImageAsBase64(
        "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
      );

      // ── Funções auxiliares ──────────────────────────────────────────────

      const drawHeader = (isFirst: boolean) => {
        // Fundo sutil do cabeçalho
        doc.setFillColor(248, 249, 250);
        doc.rect(0, 0, pageW, 38, "F");

        // Logo
        if (logoBase64) {
          try {
            doc.addImage(logoBase64, "PNG", margin, 4, 28, 28);
          } catch {}
        }

        const textX = margin + 32;

        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(27, 40, 56);
        doc.text("TOP 1575 — Caminhos do Mar", textX, 13);

        // Subtítulo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(75, 85, 99);
        doc.text("Relatório de Servidores", textX, 20);

        // Meta
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Gerado em: ${dataStr} às ${horaStr}`, textX, 27);
        doc.text(`Filtro: ${filtroLabel}`, textX, 33);

        // Linha separadora
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.line(margin, 39, pageW - margin, 39);
      };

      const drawFooter = (pageNum: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text("TOP Manager — top-caminhos-do-mar.lovable.app", margin, pageH - 7);
        doc.text(`Página ${pageNum}`, pageW - margin, pageH - 7, { align: "right" });

        // Linha do rodapé
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
      };

      const drawSummaryCards = (y: number) => {
        const cardW = contentW / 3 - 2;
        const cardH = 18;
        const cards = [
          { label: "Total Geral", value: String(totalServidores) },
          { label: "Áreas Ativas", value: String(totalAreas) },
          { label: "Média por Área", value: mediaArea },
        ];
        cards.forEach((card, i) => {
          const x = margin + i * (cardW + 3);
          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");

          // Label
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(107, 114, 128);
          doc.text(card.label, x + cardW / 2, y + 6, { align: "center" });

          // Value
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(27, 40, 56);
          doc.text(card.value, x + cardW / 2, y + 14, { align: "center" });
        });
        return y + cardH + 5;
      };

      // ── Gerar páginas ───────────────────────────────────────────────────
      let page = 1;
      drawHeader(true);
      drawFooter(page);

      let y = 43;
      // Cards de resumo apenas na primeira página
      y = drawSummaryCards(y);

      const ROW_H = 7.5;
      const SECTION_H = 12; // altura da barra de área
      const AREA_COL = margin + 5;
      const CARGO_COL = pageW - margin - 38;
      const NUM_COL = margin + 3;

      for (const area of areasOrdenadas) {
        const rows = grupos[area];
        const neededH = SECTION_H + rows.length * ROW_H + 4;
        const availableH = pageH - 14 - y; // 14 = rodapé

        if (neededH > availableH && y > 50) {
          doc.addPage();
          page++;
          drawHeader(false);
          drawFooter(page);
          y = 43;
        }

        // Barra colorida da área
        const cor = CORES_AREAS[area] || "#607D8B";
        const [r, g, b] = hexToRgb(cor);
        doc.setFillColor(r, g, b);
        doc.rect(margin, y, contentW, SECTION_H, "F");

        // Nome da área
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(area.toUpperCase(), margin + 4, y + 8);

        // Contagem à direita
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`${rows.length} servidor${rows.length !== 1 ? "es" : ""}`, pageW - margin - 3, y + 8, { align: "right" });

        y += SECTION_H;

        // Linhas de servidores
        rows.forEach((s, idx) => {
          // Verificar quebra de página dentro de uma área
          if (y + ROW_H > pageH - 14) {
            doc.addPage();
            page++;
            drawHeader(false);
            drawFooter(page);
            y = 43;
          }

          // Fundo zebra
          if (idx % 2 === 1) {
            doc.setFillColor(249, 250, 251);
            doc.rect(margin, y, contentW, ROW_H, "F");
          }

          const cargo = s.cargo_area || "Servidor";
          const isCoord = cargo.startsWith("Coord");
          const isFlutuante = cargo.startsWith("Flutuante");
          const isExpert = cargo === "Expert";

          // Número sequencial
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175);
          doc.text(String(idx + 1), NUM_COL, y + 5.2, { align: "right" });

          // Nome
          if (isCoord || isExpert) {
            doc.setFont("helvetica", "bold");
          } else if (isFlutuante) {
            doc.setFont("helvetica", "italic");
          } else {
            doc.setFont("helvetica", "normal");
          }
          doc.setFontSize(9.5);
          doc.setTextColor(27, 40, 56);

          // Truncar nome se muito longo
          const maxNomeW = CARGO_COL - AREA_COL - 2;
          let nome = s.nome || "-";
          // Estimativa: ~2mm por caractere em 9.5pt
          while (nome.length > 2 && doc.getTextWidth(nome) > maxNomeW) {
            nome = nome.slice(0, -4) + "...";
          }
          doc.text(nome, AREA_COL, y + 5.2);

          // Cargo
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(107, 114, 128);
          doc.text(cargo, CARGO_COL, y + 5.2);

          // Linha divisória suave
          doc.setDrawColor(243, 244, 246);
          doc.setLineWidth(0.2);
          doc.line(margin, y + ROW_H, pageW - margin, y + ROW_H);

          y += ROW_H;
        });

        y += 5; // espaço entre áreas
      }

      // Atualizar numeração de páginas com total
      const totalPages = page;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Apagar a área de numeração anterior e redesenhar com total
        doc.setFillColor(255, 255, 255);
        doc.rect(pageW - margin - 40, pageH - 12, 45, 8, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
      }

      // Download
      const hoje = new Date();
      const dd = String(hoje.getDate()).padStart(2, "0");
      const mm = String(hoje.getMonth() + 1).padStart(2, "0");
      const yyyy = hoje.getFullYear();
      const nomeArquivo =
        areaFiltro === "Todas"
          ? `Relatorio_Servidores_TOP1575_${dd}-${mm}-${yyyy}.pdf`
          : `Relatorio_Servidores_${areaFiltro}_TOP1575_${dd}-${mm}-${yyyy}.pdf`;

      doc.save(nomeArquivo);
      toast({ title: "PDF gerado com sucesso!" });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: err.message || "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Relatório de Servidores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Filtrar por Área</Label>
            <Select value={areaFiltro} onValueChange={setAreaFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Áreas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm text-muted-foreground">
            <p>• Servidores ordenados por cargo (Coord → Flutuante → Expert → Servidor) e nome</p>
            <p>• Cada área tem sua barra colorida identificadora</p>
            <p>• Quebra de página automática entre seções</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>
            Cancelar
          </Button>
          <Button onClick={gerarPDF} disabled={gerando} className="gap-2">
            {gerando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {gerando ? "Gerando..." : "Gerar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RelatorioServidoresPDF;
