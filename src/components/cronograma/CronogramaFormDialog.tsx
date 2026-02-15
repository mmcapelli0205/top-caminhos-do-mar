import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Atividade = Tables<"cronograma_atividades">;

const TIPOS = [
  "Trilha", "Prédica", "Instrução", "Atividade", "Dinâmica",
  "Trajeto", "Translado", "Refeição", "Montagem", "Desmontagem",
];

const EQUIPES = [
  "ADM", "Logística", "Eventos", "Segurança", "Mídia", "Voz",
  "Comunicação", "Hakuna", "Intercessão", "Coordenação Geral",
  "Coletiva", "Legendários", "Participantes",
];

const DIAS = ["D1", "D2", "D3", "D4"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividade?: Atividade | null;
  cronogramaTipo: string;
  defaultDia?: string;
}

export default function CronogramaFormDialog({ open, onOpenChange, atividade, cronogramaTipo, defaultDia = "D1" }: Props) {
  const qc = useQueryClient();
  const isEdit = !!atividade;

  const [dia, setDia] = useState(defaultDia);
  const [ordem, setOrdem] = useState(0);
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [tipo, setTipo] = useState("Atividade");
  const [titulo, setTitulo] = useState("");
  const [local, setLocal] = useState("");
  const [localOpen, setLocalOpen] = useState(false);
  const [novoLocal, setNovoLocal] = useState("");
  const [equipeResponsavel, setEquipeResponsavel] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [cenarioRecursos, setCenarioRecursos] = useState("");
  const [reposicaoAgua, setReposicaoAgua] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: locais = [] } = useQuery({
    queryKey: ["cronograma-locais"],
    queryFn: async () => {
      const { data } = await supabase.from("cronograma_locais").select("nome").order("nome");
      return (data ?? []).map(l => l.nome);
    },
  });

  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-nome-list"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  // Next order number
  const { data: maxOrdem = 0 } = useQuery({
    queryKey: ["cronograma-max-ordem", dia, cronogramaTipo],
    queryFn: async () => {
      const { data } = await supabase
        .from("cronograma_atividades")
        .select("ordem")
        .eq("dia", dia)
        .eq("cronograma_tipo", cronogramaTipo)
        .order("ordem", { ascending: false })
        .limit(1);
      return data?.[0]?.ordem ?? 0;
    },
  });

  useEffect(() => {
    if (atividade) {
      setDia(atividade.dia);
      setOrdem(atividade.ordem);
      setHorarioInicio(atividade.horario_inicio ?? "");
      setHorarioFim(atividade.horario_fim ?? "");
      setTipo(atividade.tipo);
      setTitulo(atividade.titulo);
      setLocal(atividade.local ?? "");
      setEquipeResponsavel(atividade.equipe_responsavel ?? "");
      setResponsavelNome(atividade.responsavel_nome ?? "");
      setCenarioRecursos(atividade.cenario_recursos ?? "");
      setReposicaoAgua(atividade.reposicao_agua ?? "");
    } else {
      setDia(defaultDia);
      setOrdem(maxOrdem + 1);
      setHorarioInicio("");
      setHorarioFim("");
      setTipo("Atividade");
      setTitulo("");
      setLocal("");
      setEquipeResponsavel("");
      setResponsavelNome("");
      setCenarioRecursos("");
      setReposicaoAgua("");
    }
  }, [atividade, open, maxOrdem, defaultDia]);

  const tempoPrevisto = useMemo(() => {
    if (!horarioInicio || !horarioFim) return null;
    const [hi, mi] = horarioInicio.split(":").map(Number);
    const [hf, mf] = horarioFim.split(":").map(Number);
    const diff = (hf * 60 + mf) - (hi * 60 + mi);
    return diff > 0 ? diff : null;
  }, [horarioInicio, horarioFim]);

  const handleAddLocal = async () => {
    if (!novoLocal.trim()) return;
    await supabase.from("cronograma_locais").insert({ nome: novoLocal.trim() });
    qc.invalidateQueries({ queryKey: ["cronograma-locais"] });
    setLocal(novoLocal.trim());
    setNovoLocal("");
    toast.success("Local adicionado");
  };

  const handleSave = async () => {
    if (!titulo.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const payload = {
      dia,
      ordem,
      horario_inicio: horarioInicio || null,
      horario_fim: horarioFim || null,
      tempo_previsto_min: tempoPrevisto,
      tipo,
      titulo: titulo.trim(),
      local: local || null,
      equipe_responsavel: equipeResponsavel || null,
      responsavel_nome: responsavelNome || null,
      cenario_recursos: cenarioRecursos || null,
      reposicao_agua: reposicaoAgua || null,
      cronograma_tipo: cronogramaTipo,
    };

    if (isEdit) {
      const { error } = await supabase.from("cronograma_atividades").update(payload).eq("id", atividade!.id);
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return; }
      toast.success("Atividade atualizada");
    } else {
      const { error } = await supabase.from("cronograma_atividades").insert(payload);
      if (error) { toast.error("Erro ao criar"); setSaving(false); return; }
      toast.success("Atividade criada");
    }
    qc.invalidateQueries({ queryKey: ["cronograma-atividades"] });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dia</Label>
              <Select value={dia} onValueChange={setDia}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Horário Início</Label>
              <Input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} />
            </div>
            <div>
              <Label>Horário Fim</Label>
              <Input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} />
            </div>
          </div>

          {tempoPrevisto && (
            <Badge variant="outline" className="text-xs">{tempoPrevisto} min</Badge>
          )}

          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome da atividade" />
          </div>

          {/* Local combobox */}
          <div>
            <Label>Local</Label>
            <Popover open={localOpen} onOpenChange={setLocalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {local || "Selecionar local..."}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar local..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 space-y-2">
                        <p className="text-sm text-muted-foreground">Nenhum local encontrado</p>
                        <div className="flex gap-2">
                          <Input
                            value={novoLocal}
                            onChange={e => setNovoLocal(e.target.value)}
                            placeholder="Novo local"
                            className="h-8"
                          />
                          <Button size="sm" onClick={handleAddLocal}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {locais.map(l => (
                        <CommandItem key={l} value={l} onSelect={() => { setLocal(l); setLocalOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", local === l ? "opacity-100" : "opacity-0")} />
                          {l}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="p-2 border-t flex gap-2">
                  <Input
                    value={novoLocal}
                    onChange={e => setNovoLocal(e.target.value)}
                    placeholder="Adicionar novo local"
                    className="h-8"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddLocal}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Equipe Responsável</Label>
            <Select value={equipeResponsavel} onValueChange={setEquipeResponsavel}>
              <SelectTrigger><SelectValue placeholder="Selecionar equipe" /></SelectTrigger>
              <SelectContent>
                {EQUIPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {responsavelNome || "Selecionar..."}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar servidor..." />
                  <CommandList>
                    <CommandEmpty>Nenhum encontrado</CommandEmpty>
                    <CommandGroup>
                      {servidores.map(s => (
                        <CommandItem key={s.id} value={s.nome} onSelect={() => setResponsavelNome(s.nome)}>
                          {s.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="p-2 border-t">
                  <Input
                    value={responsavelNome}
                    onChange={e => setResponsavelNome(e.target.value)}
                    placeholder="Ou digite o nome"
                    className="h-8"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Cenário / Recursos</Label>
            <Textarea value={cenarioRecursos} onChange={e => setCenarioRecursos(e.target.value)} rows={2} />
          </div>

          <div>
            <Label>Reposição de Água</Label>
            <Select value={reposicaoAgua ? "sim" : "nao"} onValueChange={v => setReposicaoAgua(v === "sim" ? "Sim" : "")}>
              <SelectTrigger><SelectValue placeholder="Não" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
              </SelectContent>
            </Select>
            {reposicaoAgua && (
              <Input className="mt-2" value={reposicaoAgua} onChange={e => setReposicaoAgua(e.target.value)} placeholder="Detalhes" />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
