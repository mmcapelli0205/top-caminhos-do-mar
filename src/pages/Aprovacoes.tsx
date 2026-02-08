import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Check,
  X,
  Search,
  Pencil,
  Loader2,
  Save,
  Key,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";

const CARGOS = [
  { value: "servidor", label: "Servidor" },
  { value: "coordenacao", label: "Coordenador" },
  { value: "coord02", label: "Coord 02" },
  { value: "coord03", label: "Coord 03" },
  { value: "sombra", label: "Sombra" },
  { value: "diretoria", label: "Diretoria" },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aprovado: "bg-green-100 text-green-800",
  recusado: "bg-red-100 text-red-800",
};

const Aprovacoes = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  // Approve dialog
  const [aprovarDialog, setAprovarDialog] = useState<{ id: string; nome: string } | null>(null);
  const [cargoSelecionado, setCargoSelecionado] = useState("servidor");
  const [aprovando, setAprovando] = useState(false);

  // Reject dialog
  const [recusarDialog, setRecusarDialog] = useState<{ id: string; nome: string } | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [recusando, setRecusando] = useState(false);

  // Edit cargo dialog
  const [editarCargoDialog, setEditarCargoDialog] = useState<{ id: string; nome: string; cargo: string } | null>(null);
  const [novoCargoEdit, setNovoCargoEdit] = useState("");
  const [editandoCargo, setEditandoCargo] = useState(false);

  // Keyword config
  const [keyword, setKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);

  // Fetch profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch keyword
  const { data: configData } = useQuery({
    queryKey: ["system-config-keyword"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_config")
        .select("valor")
        .eq("chave", "palavra_chave_cadastro")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Set keyword value when loaded
  if (configData?.valor && !keyword) {
    setKeyword(configData.valor);
  }

  const filtered = profiles.filter((p) => {
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const counts = {
    pendentes: profiles.filter((p) => p.status === "pendente").length,
    aprovados: profiles.filter((p) => p.status === "aprovado").length,
    recusados: profiles.filter((p) => p.status === "recusado").length,
    total: profiles.length,
  };

  const handleAprovar = async () => {
    if (!aprovarDialog) return;
    setAprovando(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          status: "aprovado",
          cargo: cargoSelecionado,
          aprovado_por: session?.user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", aprovarDialog.id);

      if (profileError) throw profileError;

      // Insert role
      const roleValue = cargoSelecionado as "diretoria" | "coordenacao" | "coord02" | "coord03" | "sombra" | "servidor";
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: aprovarDialog.id,
          role: roleValue,
        }, { onConflict: "user_id,role" });

      if (roleError) console.error("Role insert error:", roleError);

      toast({ title: `${aprovarDialog.nome} aprovado como ${CARGOS.find(c => c.value === cargoSelecionado)?.label}!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setAprovarDialog(null);
    } catch (err) {
      toast({ title: "Erro ao aprovar", variant: "destructive" });
    } finally {
      setAprovando(false);
    }
  };

  const handleRecusar = async () => {
    if (!recusarDialog || !motivoRecusa.trim()) {
      toast({ title: "Informe o motivo da recusa", variant: "destructive" });
      return;
    }
    setRecusando(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          status: "recusado",
          motivo_recusa: motivoRecusa.trim(),
        })
        .eq("id", recusarDialog.id);

      if (error) throw error;

      toast({ title: `${recusarDialog.nome} recusado.` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setRecusarDialog(null);
      setMotivoRecusa("");
    } catch {
      toast({ title: "Erro ao recusar", variant: "destructive" });
    } finally {
      setRecusando(false);
    }
  };

  const handleEditarCargo = async () => {
    if (!editarCargoDialog) return;
    setEditandoCargo(true);
    try {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ cargo: novoCargoEdit })
        .eq("id", editarCargoDialog.id);

      if (profileError) throw profileError;

      // Update role
      // First delete old roles, then insert new
      await supabase.from("user_roles").delete().eq("user_id", editarCargoDialog.id);
      await supabase.from("user_roles").insert({
        user_id: editarCargoDialog.id,
        role: novoCargoEdit as "diretoria" | "coordenacao" | "coord02" | "coord03" | "sombra" | "servidor",
      });

      toast({ title: `Cargo de ${editarCargoDialog.nome} alterado!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setEditarCargoDialog(null);
    } catch {
      toast({ title: "Erro ao alterar cargo", variant: "destructive" });
    } finally {
      setEditandoCargo(false);
    }
  };

  const handleRevogar = async (id: string, nome: string) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ status: "recusado", motivo_recusa: "Acesso revogado pela diretoria" })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("user_roles").delete().eq("user_id", id);

      toast({ title: `Acesso de ${nome} revogado.` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    } catch {
      toast({ title: "Erro ao revogar", variant: "destructive" });
    }
  };

  const handleSaveKeyword = async () => {
    if (!keyword.trim()) return;
    setKeywordLoading(true);
    try {
      const { error } = await supabase
        .from("system_config")
        .update({ valor: keyword.trim() })
        .eq("chave", "palavra_chave_cadastro");

      if (error) throw error;
      toast({ title: "Palavra-chave atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["system-config-keyword"] });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setKeywordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Aprovações de Acesso</h1>
        {counts.pendentes > 0 && (
          <Badge className="bg-amber-500 text-white">{counts.pendentes} pendente{counts.pendentes > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">{counts.pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{counts.aprovados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recusados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{counts.recusados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{counts.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="recusado">Recusados</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Nº Leg.</TableHead>
                  <TableHead className="hidden lg:table-cell">Área</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum cadastro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-sm">{p.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.telefone || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.numero_legendario || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.area_preferencia || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {p.created_at ? format(new Date(p.created_at), "dd/MM/yy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[p.status || "pendente"] || ""}>
                          {p.status || "pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "pendente" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setAprovarDialog({ id: p.id, nome: p.nome });
                                  setCargoSelecionado("servidor");
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setRecusarDialog({ id: p.id, nome: p.nome });
                                  setMotivoRecusa("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {p.status === "aprovado" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditarCargoDialog({ id: p.id, nome: p.nome, cargo: p.cargo || "servidor" });
                                  setNovoCargoEdit(p.cargo || "servidor");
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleRevogar(p.id, p.nome)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Palavra-chave de acesso ao cadastro</Label>
              <Input
                value={keyword || configData?.valor || ""}
                onChange={(e) => setKeyword(e.target.value)}
                className="mt-1"
                placeholder="Palavra-chave"
              />
            </div>
            <Button onClick={handleSaveKeyword} disabled={keywordLoading} className="gap-2">
              {keywordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!aprovarDialog} onOpenChange={() => setAprovarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar acesso de {aprovarDialog?.nome}?</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Cargo</Label>
            <Select value={cargoSelecionado} onValueChange={setCargoSelecionado}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovarDialog(null)}>Cancelar</Button>
            <Button onClick={handleAprovar} disabled={aprovando} className="gap-2">
              {aprovando && <Loader2 className="h-4 w-4 animate-spin" />}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!recusarDialog} onOpenChange={() => setRecusarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar acesso de {recusarDialog?.nome}?</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo da recusa *</Label>
            <Textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              className="mt-1"
              placeholder="Informe o motivo..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusarDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRecusar} disabled={recusando} className="gap-2">
              {recusando && <Loader2 className="h-4 w-4 animate-spin" />}
              Recusar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cargo Dialog */}
      <Dialog open={!!editarCargoDialog} onOpenChange={() => setEditarCargoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar cargo de {editarCargoDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Novo cargo</Label>
            <Select value={novoCargoEdit} onValueChange={setNovoCargoEdit}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarCargoDialog(null)}>Cancelar</Button>
            <Button onClick={handleEditarCargo} disabled={editandoCargo} className="gap-2">
              {editandoCargo && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Aprovacoes;
