import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Predica = {
  id: string;
  codigo: string;
  dia: string;
  titulo: string;
  local: string | null;
  horario_previsto: string | null;
  duracao_estimada_min: number | null;
  pregador_nome: string | null;
  pregador_id: string | null;
  passagens_biblicas: string | null;
  publico: string | null;
  recursos_necessarios: string | null;
  status: string | null;
  observacoes: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  predica: Predica | null;
}

export default function PredicaFormDialog({ open, onOpenChange, predica }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!predica?.id;

  const [form, setForm] = useState({
    codigo: "",
    dia: "D1",
    titulo: "",
    local: "",
    horario_previsto: "",
    duracao_estimada_min: "",
    pregador_nome: "",
    pregador_id: null as string | null,
    passagens_biblicas: "",
    publico: "Todas",
    recursos_necessarios: "",
    status: "pendente",
    observacoes: "",
  });

  const [localOpen, setLocalOpen] = useState(false);
  const [pregadorOpen, setPregadorOpen] = useState(false);
  const [novoLocal, setNovoLocal] = useState("");

  useEffect(() => {
    if (open) {
      if (predica) {
        setForm({
          codigo: predica.codigo,
          dia: predica.dia,
          titulo: predica.titulo,
          local: predica.local ?? "",
          horario_previsto: predica.horario_previsto ? predica.horario_previsto.substring(0, 5) : "",
          duracao_estimada_min: predica.duracao_estimada_min?.toString() ?? "",
          pregador_nome: predica.pregador_nome ?? "",
          pregador_id: predica.pregador_id,
          passagens_biblicas: predica.passagens_biblicas ?? "",
          publico: predica.publico ?? "Todas",
          recursos_necessarios: predica.recursos_necessarios ?? "",
          status: predica.status ?? "pendente",
          observacoes: predica.observacoes ?? "",
        });
      } else {
        setForm({
          codigo: "", dia: "D1", titulo: "", local: "", horario_previsto: "",
          duracao_estimada_min: "", pregador_nome: "", pregador_id: null,
          passagens_biblicas: "", publico: "Todas", recursos_necessarios: "",
          status: "pendente", observacoes: "",
        });
      }
    }
  }, [open, predica]);

  const { data: locais = [] } = useQuery({
    queryKey: ["cronograma-locais"],
    queryFn: async () => {
      const { data } = await supabase.from("cronograma_locais").select("nome").order("nome");
      return (data ?? []).map((l) => l.nome);
    },
    enabled: open,
  });

  const { data: pregadores = [] } = useQuery({
    queryKey: ["pregadores-predicas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome")
        .in("area_servico", ["Intercessão", "DOC", "Voz"])
        .order("nome");
      return data ?? [];
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        codigo: form.codigo,
        dia: form.dia,
        titulo: form.titulo,
        local: form.local || null,
        horario_previsto: form.horario_previsto ? form.horario_previsto + ":00" : null,
        duracao_estimada_min: form.duracao_estimada_min ? parseInt(form.duracao_estimada_min) : null,
        pregador_nome: form.pregador_nome || null,
        pregador_id: form.pregador_id,
        passagens_biblicas: form.passagens_biblicas || null,
        publico: form.publico,
        recursos_necessarios: form.recursos_necessarios || null,
        status: form.status,
        observacoes: form.observacoes || null,
      };
      if (isEditing) {
        const { error } = await supabase.from("predicas").update(payload).eq("id", predica!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("predicas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predicas"] });
      toast.success(isEditing ? "Prédica atualizada!" : "Prédica criada!");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const addLocalMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from("cronograma_locais").insert({ nome });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma-locais"] });
      setForm((f) => ({ ...f, local: novoLocal }));
      setNovoLocal("");
      setLocalOpen(false);
    },
  });

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Prédica" : "Nova Prédica"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Código */}
          <div className="space-y-1">
            <Label>Código</Label>
            <Input
              value={form.codigo}
              onChange={(e) => set("codigo", e.target.value)}
              placeholder="Ex: D1.1"
              readOnly={isEditing}
              className={isEditing ? "opacity-60" : ""}
            />
          </div>

          {/* Dia */}
          <div className="space-y-1">
            <Label>Dia</Label>
            <Select value={form.dia} onValueChange={(v) => set("dia", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="D1">D1</SelectItem>
                <SelectItem value="D2">D2</SelectItem>
                <SelectItem value="D3">D3</SelectItem>
                <SelectItem value="D4">D4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-1 sm:col-span-2">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título da prédica" />
          </div>

          {/* Local Combobox */}
          <div className="space-y-1">
            <Label>Local</Label>
            <Popover open={localOpen} onOpenChange={setLocalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {form.local || "Selecionar local..."}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar local..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 space-y-2">
                        <p className="text-sm text-muted-foreground">Nenhum local encontrado</p>
                        <div className="flex gap-1">
                          <Input
                            value={novoLocal}
                            onChange={(e) => setNovoLocal(e.target.value)}
                            placeholder="Novo local"
                            className="h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            disabled={!novoLocal.trim()}
                            onClick={() => addLocalMutation.mutate(novoLocal.trim())}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {locais.map((l) => (
                        <CommandItem
                          key={l}
                          value={l}
                          onSelect={() => { set("local", l); setLocalOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.local === l ? "opacity-100" : "opacity-0")} />
                          {l}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Horário */}
          <div className="space-y-1">
            <Label>Horário Previsto</Label>
            <Input type="time" value={form.horario_previsto} onChange={(e) => set("horario_previsto", e.target.value)} />
          </div>

          {/* Duração */}
          <div className="space-y-1">
            <Label>Duração (min)</Label>
            <Input
              type="number"
              value={form.duracao_estimada_min}
              onChange={(e) => set("duracao_estimada_min", e.target.value)}
              placeholder="Ex: 30"
            />
          </div>

          {/* Pregador Combobox */}
          <div className="space-y-1">
            <Label>Pregador</Label>
            <Popover open={pregadorOpen} onOpenChange={setPregadorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {form.pregador_nome || "Selecionar pregador..."}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar ou digitar nome..."
                    onValueChange={(v) => {
                      // Allow free text
                      set("pregador_nome", v);
                      set("pregador_id", null);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <p className="p-2 text-sm text-muted-foreground">
                        Nome digitado será usado: <strong>{form.pregador_nome}</strong>
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setPregadorOpen(false)}
                      >
                        Usar este nome
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {pregadores.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.nome}
                          onSelect={() => {
                            set("pregador_nome", s.nome);
                            set("pregador_id", s.id);
                            setPregadorOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.pregador_id === s.id ? "opacity-100" : "opacity-0")} />
                          {s.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Passagens */}
          <div className="space-y-1 sm:col-span-2">
            <Label>Passagens Bíblicas</Label>
            <Textarea
              value={form.passagens_biblicas}
              onChange={(e) => set("passagens_biblicas", e.target.value)}
              placeholder="Ex: João 3:16, Salmo 23"
              rows={2}
            />
          </div>

          {/* Público */}
          <div className="space-y-1">
            <Label>Público</Label>
            <Select value={form.publico} onValueChange={(v) => set("publico", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i + 1} value={`${i + 1} Família${i > 0 ? "s" : ""}`}>
                    {i + 1} Família{i > 0 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="ajustada">Ajustada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recursos */}
          <div className="space-y-1 sm:col-span-2">
            <Label>Recursos Necessários</Label>
            <Textarea
              value={form.recursos_necessarios}
              onChange={(e) => set("recursos_necessarios", e.target.value)}
              placeholder="Ex: Projetor, microfone"
              rows={2}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.codigo.trim() || !form.titulo.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
