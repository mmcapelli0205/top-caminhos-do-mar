import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart, Shield, PartyPopper, Camera, MessageSquare, Truck, Music,
  Briefcase, LifeBuoy, Crown, Clock, FileText, Puzzle, Users, UserCheck, Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AreaPedidos from "@/components/area/AreaPedidos";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Area = Tables<"areas">;
type Servidor = Tables<"servidores">;

const AREA_ICONS: Record<string, LucideIcon> = {
  "Hakuna": Heart,
  "Segurança": Shield,
  "Eventos": PartyPopper,
  "Mídia": Camera,
  "Comunicação": MessageSquare,
  "Logística": Truck,
  "Voz": Music,
  "ADM": Briefcase,
  "Resgate": LifeBuoy,
  "Intercessão": Heart,
  "Alimentação": Briefcase,
  "Tempo e Execução": Clock,
  "Louvor": FileText,
  "Diretoria": Crown,
};

const COLOR_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

interface Props {
  area: Area;
  canEdit: boolean;
  servidoresCount: number;
  designacoesCount: number;
  showPedidoButton?: boolean;
  canEditPedido?: boolean;
}

export default function AreaHeader({ area, canEdit, servidoresCount, designacoesCount, showPedidoButton, canEditPedido }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [descricao, setDescricao] = useState(area.descricao ?? "");
  const [cor, setCor] = useState(area.cor ?? "#6366f1");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pedidoSheetOpen, setPedidoSheetOpen] = useState(false);

  // Leadership selects
  const [coordOpen, setCoordOpen] = useState(false);

  const { data: servidoresDaArea = [] } = useQuery({
    queryKey: ["servidores-area", area.nome],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome, numero_legendario")
        .eq("area_servico", area.nome)
        .order("nome");
      return (data ?? []) as Pick<Servidor, "id" | "nome" | "numero_legendario">[];
    },
  });

  const Icon = AREA_ICONS[area.nome] ?? Puzzle;

  async function handleLogoUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `areas/${area.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
    await supabase.from("areas").update({ logo_url: urlData.publicUrl }).eq("id", area.id);
    queryClient.invalidateQueries({ queryKey: ["area", area.nome] });
    toast.success("Logo atualizado!");
    setUploading(false);
  }

  async function handleSaveEdit() {
    setSaving(true);
    const { error } = await supabase.from("areas").update({ descricao, cor }).eq("id", area.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    queryClient.invalidateQueries({ queryKey: ["area", area.nome] });
    toast.success("Área atualizada!");
    setEditOpen(false);
  }

  async function handleSetLeader(field: "coordenador_id" | "coordenador_02_id" | "coordenador_03_id" | "flutuante_01_id" | "flutuante_02_id" | "flutuante_03_id" | "expert_id", value: string) {
    const update: Record<string, string | null> = {};
    update[field] = value === "none" ? null : value;
    await supabase.from("areas").update(update).eq("id", area.id);
    queryClient.invalidateQueries({ queryKey: ["area", area.nome] });
  }

  function getLeaderName(id: string | null) {
    if (!id) return "Não definido";
    return servidoresDaArea.find(s => s.id === id)?.nome ?? "—";
  }

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center gap-4 flex-wrap">
        {(() => {
          const LOGOS_EQUIPES: Record<string, string> = {
            "ADM": "adm.png",
            "Eventos": "eventos.png",
            "Hakuna": "hakunas.png",
            "Intercessão": "intercessao.png",
            "Louvor": "intercessao.png",
            "Logística": "logistica.png",
            "Mídia": "midia.png",
            "Comunicação": "midia.png",
            "Segurança": "seguranca.png",
            "Voz": "voz.png",
            "Diretoria": "Logo%20Legendarios.png",
          };
          const logoFile = LOGOS_EQUIPES[area.nome];
          const ASSET_BASE = "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";
          if (area.logo_url) {
            return <img src={area.logo_url} alt={area.nome} className="h-12 w-12 rounded-lg object-cover" />;
          }
          if (logoFile) {
            return <img src={`${ASSET_BASE}${logoFile}`} alt={area.nome} className="h-12 w-12 object-contain rounded-lg" />;
          }
          return (
            <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: area.cor ?? "#6366f1" }}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          );
        })()}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: area.cor ?? undefined }}>{area.nome}</h1>
          {area.descricao && <p className="text-sm text-muted-foreground">{area.descricao}</p>}
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => { setDescricao(area.descricao ?? ""); setCor(area.cor ?? "#6366f1"); setEditOpen(true); }}>
            <Settings2 className="h-4 w-4 mr-1" /> Editar Área
          </Button>
        )}
        {showPedidoButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg"
                  onClick={() => setPedidoSheetOpen(true)}
                >
                  📦 Pedido
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Solicitar equipamentos, alimentação, medicamentos, etc para a ADM</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Stats + Leadership */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Servidores</p>
              <p className="text-lg font-bold">{servidoresCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Participantes</p>
              <p className="text-lg font-bold">{designacoesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {([
          { field: "coordenador_id" as const, label: "Coordenador" },
          { field: "coordenador_02_id" as const, label: "Coord. 02" },
          { field: "coordenador_03_id" as const, label: "Coord. 03" },
          { field: "flutuante_01_id" as const, label: "Flut. 01" },
          { field: "flutuante_02_id" as const, label: "Flut. 02" },
          { field: "flutuante_03_id" as const, label: "Flut. 03" },
          { field: "expert_id" as const, label: "Expert" },
        ]).map(({ field, label }) => {
          const value = (area as any)[field] as string | null;
          return (
            <Card key={field}>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {label}
                </p>
                {canEdit ? (
                  <Select value={value ?? "none"} onValueChange={v => handleSetLeader(field as any, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      {servidoresDaArea.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}{s.numero_legendario ? ` - ${s.numero_legendario}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{getLeaderName(value)}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Logo</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                }}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Cor Tema</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${cor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pedido Sheet */}
      <Sheet open={pedidoSheetOpen} onOpenChange={setPedidoSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>📦 Pedidos — {area.nome}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AreaPedidos
              areaNome={area.nome}
              canEdit={canEditPedido}
              canDelete={canEditPedido}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
