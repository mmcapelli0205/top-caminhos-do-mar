import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Wand2, UserMinus, UserPlus, Eye, Pencil } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ServidorSheet from "@/components/ServidorSheet";
import type { Tables } from "@/integrations/supabase/types";

type Servidor = Tables<"servidores">;
type HakunaPart = Tables<"hakuna_participante">;
type Participante = Tables<"participantes">;

const PROFISSOES = [
  "Médico", "Enfermeiro(a)", "Fisioterapeuta", "Massagista", "Dentista",
  "Nutricionista", "Psicólogo(a)", "Farmacêutico(a)", "Técnico(a) de Enfermagem", "Outro",
];

const ESPECIALIDADES = [
  "Cardiologista", "Ortopedista", "Clínico Geral", "Pediatra", "Dermatologista",
  "Neurologista", "Ginecologista", "Urologista", "Psiquiatra", "Anestesista", "Cirurgião", "Outro",
];

const MAX_PER_HAKUNA = 15;

const COMORBIDADE_MAP: [RegExp, string[]][] = [
  [/cardio|coração|hipertens|arritmia|marca-passo/i, ["Cardiologista", "Clínico Geral"]],
  [/diabetes|insulina|glicemia/i, ["Clínico Geral"]],
  [/ortop|fratura|coluna|hérnia|artrose|artrite/i, ["Ortopedista", "Fisioterapeuta"]],
  [/respirat|asma|pneumo/i, ["Clínico Geral"]],
  [/depress|ansiedade|psic|pânico/i, ["Psicólogo(a)", "Psiquiatra"]],
  [/dental|dente/i, ["Dentista"]],
];

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

function getDisplayProfissao(s: Servidor): string {
  const prof = s.profissao || s.especialidade_medica;
  if (!prof) return "⚠️ Pendente";
  if (prof === "Médico" && s.especialidade_medica) return `Médico - ${s.especialidade_medica}`;
  return prof;
}

function findCompatibleEspecialidades(doenca: string): string[] {
  for (const [regex, esps] of COMORBIDADE_MAP) {
    if (regex.test(doenca)) return esps;
  }
  return ["Clínico Geral"];
}

export default function EquipeTab() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null);
  const [searchPart, setSearchPart] = useState("");
  const [linkingFor, setLinkingFor] = useState<string | null>(null);

  // Edit profissao dialog
  const [editServId, setEditServId] = useState<string | null>(null);
  const [editProfissao, setEditProfissao] = useState("");
  const [editEspecialidade, setEditEspecialidade] = useState("");
  const [editCrm, setEditCrm] = useState("");

  // Match confirm
  const [matchConfirmOpen, setMatchConfirmOpen] = useState(false);

  // Main query: servidores da área Hakuna
  const { data: servidores = [], isLoading: loadS } = useQuery({
    queryKey: ["hk-servidores"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("*").eq("area_servico", "Hakuna").eq("status", "aprovado").order("nome");
      return (data ?? []) as Servidor[];
    },
  });

  const { data: vinculos = [] } = useQuery({
    queryKey: ["hk-vinculos"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_participante").select("*");
      return (data ?? []) as HakunaPart[];
    },
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["hk-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("*").order("nome");
      return (data ?? []) as Participante[];
    },
  });

  // Map vinculos by servidor_id (new) or hakuna_id (legacy)
  const vinculosByServidor = useMemo(() => {
    const m = new Map<string, HakunaPart[]>();
    vinculos.forEach((v) => {
      const key = v.servidor_id || v.hakuna_id;
      if (!key) return;
      const arr = m.get(key) ?? [];
      arr.push(v);
      m.set(key, arr);
    });
    return m;
  }, [vinculos]);

  const partMap = useMemo(() => {
    const m = new Map<string, Participante>();
    participantes.forEach((p) => m.set(p.id, p));
    return m;
  }, [participantes]);

  const especCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    servidores.forEach((s) => {
      const prof = s.profissao || s.especialidade_medica || "Não definida";
      counts[prof] = (counts[prof] || 0) + 1;
    });
    return counts;
  }, [servidores]);

  // Match logic using servidores directly
  const matchMutation = useMutation({
    mutationFn: async () => {
      // Delete existing vinculos
      if (vinculos.length > 0) {
        const { error: delErr } = await supabase.from("hakuna_participante").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (delErr) throw delErr;
      }

      // Group servidores: medicos by especialidade, others general
      const medicosByEsp = new Map<string, string[]>();
      const generalPool: string[] = [];

      servidores.forEach((s) => {
        const prof = s.profissao || s.especialidade_medica || "";
        if (prof === "Médico") {
          const esp = s.especialidade_medica || "Clínico Geral";
          const arr = medicosByEsp.get(esp) ?? [];
          arr.push(s.id);
          medicosByEsp.set(esp, arr);
        } else if (["Psicólogo(a)", "Psiquiatra", "Dentista"].includes(prof)) {
          const arr = medicosByEsp.get(prof) ?? [];
          arr.push(s.id);
          medicosByEsp.set(prof, arr);
        } else {
          generalPool.push(s.id);
        }
      });

      const assignCount = new Map<string, number>();
      const inserts: any[] = [];

      function assignToPool(pool: string[], partId: string, motivo: string): boolean {
        if (pool.length === 0) return false;
        const sorted = [...pool].sort((a, b) => (assignCount.get(a) ?? 0) - (assignCount.get(b) ?? 0));
        const target = sorted[0];
        if ((assignCount.get(target) ?? 0) >= MAX_PER_HAKUNA) return false;
        assignCount.set(target, (assignCount.get(target) ?? 0) + 1);
        inserts.push({ servidor_id: target, participante_id: partId, motivo, prioridade: 1 });
        return true;
      }

      const withComorbidade: Participante[] = [];
      const withoutComorbidade: Participante[] = [];
      participantes.forEach((p) => {
        if (p.doenca && p.doenca.trim().length > 0) withComorbidade.push(p);
        else withoutComorbidade.push(p);
      });

      for (const p of withComorbidade) {
        const targetEsps = findCompatibleEspecialidades(p.doenca!);
        let assigned = false;
        for (const esp of targetEsps) {
          const pool = medicosByEsp.get(esp);
          if (pool && pool.length > 0) {
            assigned = assignToPool(pool, p.id, `Comorbidade: ${p.doenca?.substring(0, 40)} → ${esp}`);
            if (assigned) break;
          }
        }
        if (!assigned) {
          const cgPool = medicosByEsp.get("Clínico Geral") ?? [];
          assigned = assignToPool(cgPool, p.id, `Comorbidade fallback: ${p.doenca?.substring(0, 40)}`);
        }
        if (!assigned) {
          assignToPool(generalPool, p.id, `Distribuição geral (comorbidade sem especialista)`);
        }
      }

      for (const p of withoutComorbidade) {
        assignToPool(generalPool.length > 0 ? generalPool : servidores.map((s) => s.id), p.id, "Distribuição geral");
      }

      if (inserts.length === 0) throw new Error("Nenhum vínculo a criar");

      const batchSize = 500;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase.from("hakuna_participante").insert(batch);
        if (error) throw error;
      }

      return { total: inserts.length, hakunas: new Set(inserts.map((i) => i.servidor_id)).size };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["hk-vinculos"] });
      toast({ title: `Match gerado! ${result.total} participantes vinculados a ${result.hakunas} Hakunas` });
    },
    onError: (e: any) => toast({ title: "Erro no Match", description: e.message, variant: "destructive" }),
  });

  function handleMatchClick() {
    if (vinculos.length > 0) {
      setMatchConfirmOpen(true);
    } else {
      matchMutation.mutate();
    }
  }

  // Edit profissao/especialidade/crm directly on servidores
  const editProfMutation = useMutation({
    mutationFn: async () => {
      if (!editServId) return;
      await supabase.from("servidores").update({
        profissao: editProfissao,
        especialidade_medica: editProfissao === "Médico" ? editEspecialidade : null,
        crm: editCrm || null,
      }).eq("id", editServId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hk-servidores"] });
      setEditServId(null);
      toast({ title: "Profissão atualizada" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("hakuna_participante").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hk-vinculos"] }); toast({ title: "Desvinculado" }); },
  });

  const linkMutation = useMutation({
    mutationFn: async ({ servidorId, partId }: { servidorId: string; partId: string }) => {
      const { error } = await supabase.from("hakuna_participante").insert({ servidor_id: servidorId, participante_id: partId, motivo: "Manual" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hk-vinculos"] }); setLinkingFor(null); setSearchPart(""); toast({ title: "Vinculado" }); },
  });

  const filteredParts = searchPart.length >= 2
    ? participantes.filter((p) => p.nome.toLowerCase().includes(searchPart.toLowerCase())).slice(0, 8)
    : [];

  function openEditProfissao(s: Servidor) {
    setEditServId(s.id);
    setEditProfissao(s.profissao || "");
    setEditEspecialidade(s.especialidade_medica || "");
    setEditCrm(s.crm || "");
  }

  return (
    <div className="space-y-4">
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total na Equipe</p><span className="text-2xl font-bold text-foreground">{servidores.length}</span></CardContent></Card>
        {Object.entries(especCounts).map(([esp, c]) => (
          <Card key={esp}><CardContent className="p-3"><p className="text-xs text-muted-foreground truncate">{esp}</p><span className="text-lg font-bold text-foreground">{c}</span></CardContent></Card>
        ))}
      </div>

      <Button variant="outline" className={isMobile ? "w-full" : ""} onClick={handleMatchClick} disabled={matchMutation.isPending}>
        <Wand2 className="h-4 w-4 mr-1" /> Gerar Match Automático
      </Button>

      {/* Table / Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {loadS ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : servidores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum servidor Hakuna ativo.</p>
          ) : servidores.map((s) => {
            const vList = vinculosByServidor.get(s.id) ?? [];
            const isExp = expandedId === s.id;
            return (
              <Card key={s.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.nome}</p>
                      <p className="text-sm text-muted-foreground">{getDisplayProfissao(s)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary">{vList.length}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProfissao(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedServidor(s)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(isExp ? null : s.id)}>
                        {isExp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {s.telefone && <p className="text-xs text-muted-foreground">{s.telefone}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Nome</TableHead>
                <TableHead>Profissão/Especialidade</TableHead>
                <TableHead className="hidden md:table-cell">CRM/Registro</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="text-center">Vinculados</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadS ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : servidores.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum servidor Hakuna ativo.</TableCell></TableRow>
              ) : servidores.map((s) => {
                const vList = vinculosByServidor.get(s.id) ?? [];
                const isExp = expandedId === s.id;
                return (
                  <TableRow key={s.id} className="group">
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(isExp ? null : s.id)}>
                        {isExp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>{getDisplayProfissao(s)}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.crm || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.telefone ?? "—"}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{vList.length}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProfissao(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedServidor(s)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Expanded section */}
      {expandedId && (() => {
        const vList = vinculosByServidor.get(expandedId) ?? [];
        return (
          <div className="border border-border rounded-md p-3 md:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Participantes vinculados</h3>
              <Button variant="outline" size="sm" onClick={() => setLinkingFor(linkingFor === expandedId ? null : expandedId)}>
                <UserPlus className="h-4 w-4 mr-1" /> Vincular
              </Button>
            </div>
            {linkingFor === expandedId && (
              <div className="space-y-2">
                <Input placeholder="Buscar participante..." value={searchPart} onChange={(e) => setSearchPart(e.target.value)} />
                {filteredParts.map((p) => (
                  <Button key={p.id} variant="ghost" size="sm" className="w-full justify-start" onClick={() => linkMutation.mutate({ servidorId: expandedId, partId: p.id })}>
                    {p.nome} {p.doenca ? `(${p.doenca.substring(0, 30)})` : ""}
                  </Button>
                ))}
              </div>
            )}
            {vList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum participante vinculado</p>
            ) : isMobile ? (
              <div className="space-y-2">
                {vList.map((v) => {
                  const p = partMap.get(v.participante_id ?? "");
                  if (!p) return null;
                  return (
                    <Card key={v.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">Idade: {calcAge(p.data_nascimento) ?? "—"}</p>
                            {p.doenca && <p className="text-xs text-muted-foreground truncate">{p.doenca}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant={v.prioridade === 3 ? "destructive" : v.prioridade === 2 ? "default" : "secondary"}>
                              {v.prioridade === 3 ? "Alta" : v.prioridade === 2 ? "Média" : "Baixa"}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => unlinkMutation.mutate(v.id)}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Doença/Condição</TableHead>
                    <TableHead className="hidden md:table-cell">Medicamentos</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vList.map((v) => {
                    const p = partMap.get(v.participante_id ?? "");
                    if (!p) return null;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{calcAge(p.data_nascimento) ?? "—"}</TableCell>
                        <TableCell>{p.doenca ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{p.medicamentos ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={v.prioridade === 3 ? "destructive" : v.prioridade === 2 ? "default" : "secondary"}>
                            {v.prioridade === 3 ? "Alta" : v.prioridade === 2 ? "Média" : "Baixa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => unlinkMutation.mutate(v.id)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        );
      })()}

      {/* Edit Profissao Dialog */}
      <Dialog open={!!editServId} onOpenChange={(o) => { if (!o) setEditServId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Profissão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profissão *</Label>
              <Select value={editProfissao} onValueChange={(v) => { setEditProfissao(v); if (v !== "Médico") setEditEspecialidade(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PROFISSOES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editProfissao === "Médico" && (
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={editEspecialidade} onValueChange={setEditEspecialidade}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>CRM / Registro Profissional</Label>
              <Input value={editCrm} onChange={(e) => setEditCrm(e.target.value)} placeholder="Ex: CRM 12345" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditServId(null)}>Cancelar</Button>
            <Button onClick={() => editProfMutation.mutate()} disabled={!editProfissao || editProfMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Confirm Dialog */}
      <AlertDialog open={matchConfirmOpen} onOpenChange={setMatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refazer Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Já existem {vinculos.length} vínculos. Deseja refazer? Os vínculos anteriores serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setMatchConfirmOpen(false); matchMutation.mutate(); }}>
              Refazer Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ServidorSheet servidor={selectedServidor} open={!!selectedServidor} onOpenChange={(o) => { if (!o) setSelectedServidor(null); }} />
    </div>
  );
}
