import { useMemo } from "react";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Pimaco 6080 specs (mm)
const PAGE_W = 210;
const PAGE_H = 297;
const COLS = 3;
const ROWS = 10;
const LABELS_PER_PAGE = COLS * ROWS;
const LABEL_W = 66.7;
const LABEL_H = 25.4;
const MARGIN_LEFT = 4.7;
const MARGIN_TOP = 10.7;
const GAP_H = 3.1;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  families: string[][];
  participantMap: Map<string, { nome: string; familia_id?: number | null }>;
  numFamilias: number;
}

interface LabelEntry {
  nome: string;
  familiaLabel: string;
}

function buildLabels(families: string[][], participantMap: Props["participantMap"]): LabelEntry[] {
  const labels: LabelEntry[] = [];
  families.forEach((members, fi) => {
    const sorted = [...members]
      .map((id) => participantMap.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.nome.localeCompare(b!.nome, "pt-BR"));

    for (const p of sorted) {
      const entry: LabelEntry = { nome: p!.nome, familiaLabel: `Família ${fi + 1}` };
      for (let r = 0; r < 4; r++) labels.push(entry);
    }
  });
  return labels;
}

function generatePDF(labels: LabelEntry[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const maxWidth = LABEL_W - 4; // 2mm padding each side

  labels.forEach((label, i) => {
    if (i > 0 && i % LABELS_PER_PAGE === 0) doc.addPage();
    const idx = i % LABELS_PER_PAGE;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = MARGIN_LEFT + col * (LABEL_W + GAP_H);
    const y = MARGIN_TOP + row * LABEL_H;
    const cx = x + LABEL_W / 2;
    const cy = y + LABEL_H / 2;

    // Name (bold, 10pt)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let nome = label.nome;
    while (doc.getTextWidth(nome) > maxWidth && nome.length > 3) {
      nome = nome.slice(0, -1);
    }
    if (nome !== label.nome) nome += "…";
    doc.text(nome, cx, cy - 2, { align: "center" });

    // Family (regular, 8pt)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.familiaLabel, cx, cy + 4, { align: "center" });
  });

  return doc;
}

export default function EtiquetasPDFDialog({ open, onOpenChange, families, participantMap, numFamilias }: Props) {
  const labels = useMemo(() => buildLabels(families, participantMap), [families, participantMap]);
  const totalParticipants = labels.length / 4;
  const totalLabels = labels.length;
  const totalPages = Math.ceil(totalLabels / LABELS_PER_PAGE);

  // Preview: first page labels
  const firstPageLabels = labels.slice(0, LABELS_PER_PAGE);

  const handleDownload = () => {
    const doc = generatePDF(labels);
    doc.save("etiquetas-familias.pdf");
  };

  const handlePrint = () => {
    const doc = generatePDF(labels);
    doc.autoPrint();
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Etiquetas Pimaco 6080</DialogTitle>
          <DialogDescription>
            {totalParticipants} participantes × 4 etiquetas = {totalLabels} etiquetas total ({totalPages} página{totalPages !== 1 ? "s" : ""})
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="border rounded-md p-2 bg-white">
          <p className="text-xs text-muted-foreground mb-2">Preview da primeira página:</p>
          <div
            className="mx-auto border border-border"
            style={{
              width: "100%",
              aspectRatio: `${PAGE_W} / ${PAGE_H}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {firstPageLabels.map((label, i) => {
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const left = ((MARGIN_LEFT + col * (LABEL_W + GAP_H)) / PAGE_W) * 100;
              const top = ((MARGIN_TOP + row * LABEL_H) / PAGE_H) * 100;
              const w = (LABEL_W / PAGE_W) * 100;
              const h = (LABEL_H / PAGE_H) * 100;
              return (
                <div
                  key={i}
                  className="absolute border border-muted flex flex-col items-center justify-center overflow-hidden"
                  style={{ left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%` }}
                >
                  <span className="font-bold text-[0.45vw] leading-tight truncate max-w-[90%] text-black">
                    {label.nome}
                  </span>
                  <span className="text-[0.35vw] leading-tight text-gray-600">
                    {label.familiaLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
