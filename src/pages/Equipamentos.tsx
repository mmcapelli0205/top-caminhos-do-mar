import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Plus, Search, Eye, Pencil, ArrowRightLeft, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipamentoFormDialog } from "@/components/equipamentos/EquipamentoFormDialog";
import { EmprestarDialog } from "@/components/equipamentos/EmprestarDialog";
import { DevolverDialog } from "@/components/equipamentos/DevolverDialog";
import { EquipamentoDetalhesDialog } from "@/components/equipamentos/EquipamentoDetalhesDialog";

const CATEGORIAS = ["Som/Áudio", "Vídeo/Projeção", "Iluminação", "Cozinha", "Veículos", "Comunicação", "Outros"];
const ORIGENS_FILTER = [
  { value: "todos", label: "Todas origens" },
  { value: "proprio", label: "Próprio" },
  { value: "emprestado", label: "Emprestado" },
  { value: "alugado", label: "Alugado" },
];
const ESTADOS_FILTER = [
  { value: "todos", label: "Todos estados" },
  { value: "Bom", label: "Bom" },
  { value: "Regular", label: "Regular" },
  { value: "Danificado", label: "Danificado" },
  { value: "Perdido", label: "Perdido" },
];

type Equipamento = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  origem?: string | null;
  proprietario?: string | null;
  quantidade?: number | null;
  estado?: string | null;
  foto_url?: string | null;
  valor_estimado?: number | null;
  observacoes?: string | null;
  created_at?: string | null;
};

type EmprestimoAtivo = {
  id: string;
  equipamento_id: string | null;
  responsavel_nome: string | null;
  data_retirada: string | null;
  estado_saida: string | null;
  foto_saida_url: string | null;
};

const Equipamentos = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipamento | null>(null);
  const [emprestarOpen, setEmprestarOpen] = useState(false);
  const [emprestarEquip, setEmprestarEquip] = useState<{ id: string; nome: string } | null>(null);
  const [devolverOpen, setDevolverOpen] = useState(false);
  const [devolverData, setDevolverData] = useState<{ emprestimo: EmprestimoAtivo; nome: string } | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesEquip, setDetalhesEquip] = useState<Equipamento | null>(null);

  const { data: equipamentos = [] } = useQuery({
    queryKey: ["equipamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos").select("*").order("nome");
      if (error) throw error;
      return data as Equipamento[];
    },
  });

  const { data: emprestimosAtivos = [] } = useQuery({
    queryKey: ["emprestimos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamento_emprestimos")
        .select("id, equipamento_id, responsavel_nome, data_retirada, estado_saida, foto_saida_url")
        .eq("devolvido", false);
      if (error) throw error;
      return data as EmprestimoAtivo[];
    },
  });

  const emprestimosMap = useMemo(() => {
    const map = new Map<string, EmprestimoAtivo>();
    emprestimosAtivos.forEach((e) => { if (e.equipamento_id) map.set(e.equipamento_id, e); });
    return map;
  }, [emprestimosAtivos]);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
    queryClient.invalidateQueries({ queryKey: ["emprestimos-ativos"] });
  };

  const filtered = useMemo(() => {
    return equipamentos.filter((e) => {
      if (busca && !e.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroCategoria !== "todos" && e.categoria !== filtroCategoria) return false;
      if (filtroOrigem !== "todos" && e.origem !== filtroOrigem) return false;
      if (filtroEstado !== "todos" && e.estado !== filtroEstado) return false;
      return true;
    });
  }, [equipamentos, busca, filtroCategoria, filtroOrigem, filtroEstado]);

  // Category cards
  const catCards = useMemo(() => {
    return CATEGORIAS.map((cat) => {
      const items = equipamentos.filter((e) => e.categoria === cat);
      const total = items.length;
      const valor = items.reduce((s, e) => s + (e.valor_estimado || 0), 0);
      return { cat, total, valor };
    }).filter((c) => c.total > 0);
  }, [equipamentos]);

  const origemLabel: Record<string, string> = { proprio: "Próprio", emprestado: "Emprestado", alugado: "Alugado" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
          <Badge variant="secondary">{equipamentos.length}</Badge>
        </div>
        <Button onClick={() => { setEditEquip(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Equipamento
        </Button>
      </div>

      {/* Category Cards */}
      {catCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {catCards.map((c) => (
            <Card key={c.cat} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroCategoria(filtroCategoria === c.cat ? "todos" : c.cat)}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.cat}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{c.total}</p>
                <p className="text-xs text-muted-foreground">R$ {c.valor.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="pl-9" />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas categorias</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORIGENS_FILTER.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ESTADOS_FILTER.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Foto</TableHead>
              <TableHead className="sticky left-0 bg-background">Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Qtd</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Empréstimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum equipamento encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((eq) => {
                const emprestimo = emprestimosMap.get(eq.id);
                return (
                  <TableRow key={eq.id}>
                    <TableCell>
                      {eq.foto_url ? (
                        <img src={eq.foto_url} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="sticky left-0 bg-background font-medium">{eq.nome}</TableCell>
                    <TableCell><Badge variant="outline">{eq.categoria}</Badge></TableCell>
                    <TableCell className="text-center">{eq.quantidade}</TableCell>
                    <TableCell>{origemLabel[eq.origem || "proprio"]}</TableCell>
                    <TableCell>{eq.proprietario || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={eq.estado === "Bom" ? "secondary" : eq.estado === "Danificado" ? "destructive" : "outline"}>
                        {eq.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emprestimo ? (
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600">Em uso por {emprestimo.responsavel_nome}</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white hover:bg-green-700">Disponível</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => { setDetalhesEquip(eq); setDetalhesOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditEquip(eq); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!emprestimo ? (
                          <Button variant="ghost" size="icon" title="Emprestar" onClick={() => { setEmprestarEquip({ id: eq.id, nome: eq.nome }); setEmprestarOpen(true); }}>
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Devolver" onClick={() => { setDevolverData({ emprestimo, nome: eq.nome }); setDevolverOpen(true); }}>
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <EquipamentoFormDialog open={formOpen} onOpenChange={setFormOpen} equipamento={editEquip} onSuccess={refetch} />

      {emprestarEquip && (
        <EmprestarDialog open={emprestarOpen} onOpenChange={setEmprestarOpen} equipamentoId={emprestarEquip.id} equipamentoNome={emprestarEquip.nome} onSuccess={refetch} />
      )}

      {devolverData && (
        <DevolverDialog open={devolverOpen} onOpenChange={setDevolverOpen} emprestimo={devolverData.emprestimo} equipamentoNome={devolverData.nome} onSuccess={refetch} />
      )}

      {detalhesEquip && (
        <EquipamentoDetalhesDialog open={detalhesOpen} onOpenChange={setDetalhesOpen} equipamento={detalhesEquip} />
      )}
    </div>
  );
};

export default Equipamentos;
