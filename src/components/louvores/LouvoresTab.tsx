import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Music } from "lucide-react";
import { toast } from "sonner";

const INSTRUMENTOS_OPTIONS = [
  "Violão", "Teclado", "Bateria", "Guitarra", "Baixo", "Cajon", "Flauta",
];

const DIA_COLORS: Record<string, string> = {
  D1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  D2: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  D3: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  D4: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface LouvoresTabProps {
  canEdit: boolean;
}

type Louvor = {
  id: string;
  predica_id: string | null;
  nome_louvor: string;
  artista: string | null;
  instrumentos: string[] | null;
  tom: string | null;
  observacoes: string | null;
  ordem: number | null;
  top_id: string | null;
  created_at: string | null;
};

type Predica = {
  id: string;
  codigo: string;
  dia: string;
  titulo: string;
};

const emptyForm = {
  predica_id: "",
  nome_louvor: "",
  artista: "",
  instrumentos: [] as string[],
  tom: "",
  observacoes: "",
};

export default function LouvoresTab({ canEdit }: LouvoresTabProps) {
  const qc = useQueryClient();
  const [filterDia, setFilterDia] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: predicas = [] } = useQuery<Predica[]>({
    queryKey: ["predicas-louvores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("predicas")
        .select("id, codigo, dia, titulo")
        .order("dia", { ascending: true })
        .order("codigo", { ascending: true });
      return (data ?? []) as Predica[];
    },
  });

  const { data: louvores = [], isLoading } = useQuery<Louvor[]>({
    queryKey: ["louvores-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("louvores")
        .select("*")
        .order("ordem", { ascending: true });
      return (data ?? []) as Louvor[];
    },
  });

  const predicaMap = Object.fromEntries(predicas.map((p) => [p.id, p]));

  const filtered = filterDia === "todos"
    ? louvores
    : louvores.filter((l) => {
        const p = l.predica_id ? predicaMap[l.predica_id] : null;
        return p?.dia === filterDia;
      });

  // Stats
  const predicasComLouvor = new Set(louvores.filter((l) => l.predica_id).map((l) => l.predica_id));
  const predicasSemLouvor = predicas.filter((p) => !predicasComLouvor.has(p.id));

  const saveMutation = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      const payload = {
        predica_id: vals.predica_id || null,
        nome_louvor: vals.nome_louvor,
        artista: vals.artista || null,
        instrumentos: vals.instrumentos.length ? vals.instrumentos : null,
        tom: vals.tom || null,
        observacoes: vals.observacoes || null,
        ordem: 0,
      };
      if (vals.id) {
        const { error } = await supabase.from("louvores").update(payload).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("louvores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["louvores-list"] });
      toast.success(editId ? "Louvor atualizado!" : "Louvor criado!");
      closeForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("louvores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["louvores-list"] });
      toast.success("Louvor excluído!");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (l: Louvor) => {
    setEditId(l.id);
    setForm({
      predica_id: l.predica_id ?? "",
      nome_louvor: l.nome_louvor,
      artista: l.artista ?? "",
      instrumentos: l.instrumentos ?? [],
      tom: l.tom ?? "",
      observacoes: l.observacoes ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = () => {
    if (!form.nome_louvor.trim()) {
      toast.error("Nome do louvor é obrigatório");
      return;
    }
    saveMutation.mutate({ ...form, id: editId ?? undefined });
  };

  const toggleInstrumento = (inst: string) => {
    setForm((prev) => ({
      ...prev,
      instrumentos: prev.instrumentos.includes(inst)
        ? prev.instrumentos.filter((i) => i !== inst)
        : [...prev.instrumentos, inst],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total de Louvores</p>
            <p className="text-2xl font-bold">{louvores.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Prédicas com Louvor</p>
            <p className="text-2xl font-bold text-green-600">{predicasComLouvor.size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Prédicas sem Louvor</p>
            <p className="text-2xl font-bold text-red-500">{predicasSemLouvor.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && (
          <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-1" /> Novo Louvor
          </Button>
        )}
        <Select value={filterDia} onValueChange={setFilterDia}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="D1">D1</SelectItem>
            <SelectItem value="D2">D2</SelectItem>
            <SelectItem value="D3">D3</SelectItem>
            <SelectItem value="D4">D4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prédica</TableHead>
              <TableHead>Louvor</TableHead>
              <TableHead>Artista</TableHead>
              <TableHead>Tom</TableHead>
              <TableHead>Instrumentos</TableHead>
              {canEdit && <TableHead className="w-[80px]">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum louvor cadastrado</TableCell></TableRow>
            ) : (
              filtered.map((l) => {
                const pred = l.predica_id ? predicaMap[l.predica_id] : null;
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      {pred ? (
                        <span className="flex items-center gap-1">
                          <Badge className={DIA_COLORS[pred.dia] ?? ""}>{pred.dia}</Badge>
                          <span className="text-xs">{pred.codigo} - {pred.titulo}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3 text-muted-foreground" />
                        {l.nome_louvor}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{l.artista ?? "—"}</TableCell>
                    <TableCell>
                      {l.tom ? <Badge variant="outline">{l.tom}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {l.instrumentos?.map((inst) => (
                          <Badge key={inst} variant="secondary" className="text-[10px]">{inst}</Badge>
                        )) ?? "—"}
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(l.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Louvor" : "Novo Louvor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Prédica</Label>
              <Select value={form.predica_id} onValueChange={(v) => setForm((p) => ({ ...p, predica_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar prédica..." /></SelectTrigger>
                <SelectContent>
                  {predicas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.dia} — {p.codigo} - {p.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Louvor *</Label>
              <Input value={form.nome_louvor} onChange={(e) => setForm((p) => ({ ...p, nome_louvor: e.target.value }))} placeholder="Nome do louvor/música" />
            </div>
            <div>
              <Label>Artista</Label>
              <Input value={form.artista} onChange={(e) => setForm((p) => ({ ...p, artista: e.target.value }))} placeholder="Artista/banda" />
            </div>
            <div>
              <Label>Tom</Label>
              <Input value={form.tom} onChange={(e) => setForm((p) => ({ ...p, tom: e.target.value }))} placeholder="Ex: C, Dm, G" />
            </div>
            <div>
              <Label>Instrumentos</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {INSTRUMENTOS_OPTIONS.map((inst) => (
                  <Badge
                    key={inst}
                    variant={form.instrumentos.includes(inst) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleInstrumento(inst)}
                  >
                    {inst}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} placeholder="Notas adicionais" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir louvor?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
