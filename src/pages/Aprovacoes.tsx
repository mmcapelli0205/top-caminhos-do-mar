import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Check, X, Search, Pencil, Loader2, Save, Key, Eye, EyeOff, Star, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CadastroRapidoDialog from "@/components/CadastroRapidoDialog";
import RelatorioServidoresPDF from "@/components/RelatorioServidoresPDF";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

const formatPhone = (phone: string | null) => {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
};

const CARGOS = [
  { value: "servidor", label: "Servidor" },
  { value: "coordenacao", label: "Coordenador 01" },
  { value: "coord02", label: "Coordenador 02" },
  { value: "coord03", label: "Coordenador 03" },
  { value: "flutuante01", label: "Flutuante 01" },
  { value: "flutuante02", label: "Flutuante 02" },
  { value: "flutuante03", label: "Flutuante 03" },
  { value: "expert", label: "Expert" },
  { value: "diretoria", label: "Diretoria" },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aprovado: "bg-green-100 text-green-800",
  recusado: "bg-red-100 text-red-800",
};

const Aprovacoes = () => {
  const { session, profile, role } = useAuth();
  const [showCadastroRapido, setShowCadastroRapido] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (profile && !profile.pode_aprovar) navigate("/dashboard", { replace: true });
  }, [profile, navigate]);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [aprovarDialog, setAprovarDialog] = useState<{ id: string; nome: string } | null>(null);
  const [cargoSelecionado, setCargoSelecionado] = useState("servidor");
  const [aprovando, setAprovando] = useState(false);
  const [recusarDialog, setRecusarDialog] = useState<{ id: string; nome: string } | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [recusando, setRecusando] = useState(false);
  const [editarCargoDialog, setEditarCargoDialog] = useState<{ id: string; nome: string; cargo: string } | null>(null);
  const [novoCargoEdit, setNovoCargoEdit] = useState("");
  const [editandoCargo, setEditandoCargo] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [editarPerfilDialog, setEditarPerfilDialog] = useState<{
    id: string; nome: string; telefone: string; numero_legendario: string; area_preferencia: string; email: string;
  } | null>(null);
  const [perfilForm, setPerfilForm] = useState({ nome: "", telefone: "", numero_legendario: "", area_preferencia: "", email: "" });
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [showKeyword, setShowKeyword] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_profiles").select("*").neq("status", "recusado").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: configData } = useQuery({
    queryKey: ["system-config-keyword"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_config").select("valor").eq("chave", "palavra_chave_cadastro").single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (configData?.valor && !keyword) setKeyword(configData.valor);
  }, [configData?.valor]);

  const filtered = profiles.filter((p) => {
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const counts = {
    pendentes: profiles.filter((p) => p.status === "pendente").length,
    aprovados: profiles.filter((p) => p.status === "aprovado").length,
    total: profiles.length,
  };

  const handleAprovar = async () => {
    if (!aprovarDialog) return;
    setAprovando(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "approve",
            user_id: aprovarDialog.id,
            cargo: cargoSelecionado,
            aprovado_por: session?.user?.id,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao aprovar");
      }

      toast({ title: `${aprovarDialog.nome} aprovado como ${CARGOS.find(c => c.value === cargoSelecionado)?.label}!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setAprovarDialog(null);
    } catch (e: any) {
      toast({ title: e.message || "Erro ao aprovar", variant: "destructive" });
    } finally {
      setAprovando(false);
    }
  };

  const handleRecusar = async () => {
    if (!recusarDialog || !motivoRecusa.trim()) { toast({ title: "Informe o motivo da recusa", variant: "destructive" }); return; }
    setRecusando(true);
    try {
      const { error } = await supabase.from("user_profiles").update({ status: "recusado", motivo_recusa: motivoRecusa.trim() }).eq("id", recusarDialog.id);
      if (error) throw error;
      toast({ title: `${recusarDialog.nome} recusado.` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setRecusarDialog(null); setMotivoRecusa("");
    } catch { toast({ title: "Erro ao recusar", variant: "destructive" }); }
    finally { setRecusando(false); }
  };

  const handleEditarCargo = async () => {
    if (!editarCargoDialog) return;
    setEditandoCargo(true);
    try {
      const { error: profileError } = await supabase.from("user_profiles").update({ cargo: novoCargoEdit }).eq("id", editarCargoDialog.id);
      if (profileError) throw profileError;
      await supabase.from("user_roles").delete().eq("user_id", editarCargoDialog.id);
      await supabase.from("user_roles").insert({ user_id: editarCargoDialog.id, role: novoCargoEdit as any });
      toast({ title: `Cargo de ${editarCargoDialog.nome} alterado!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setEditarCargoDialog(null);
    } catch { toast({ title: "Erro ao alterar cargo", variant: "destructive" }); }
    finally { setEditandoCargo(false); }
  };

  const handleRevogar = async (id: string, nome: string) => {
    try {
      const { error } = await supabase.from("user_profiles").update({ status: "recusado", motivo_recusa: "Acesso revogado pela diretoria" }).eq("id", id);
      if (error) throw error;
      await supabase.from("user_roles").delete().eq("user_id", id);
      toast({ title: `Acesso de ${nome} revogado.` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    } catch { toast({ title: "Erro ao revogar", variant: "destructive" }); }
  };

  const handleTogglePodeAprovar = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase.from("user_profiles").update({ pode_aprovar: !currentValue }).eq("id", userId);
      if (error) throw error;
      toast({ title: `Permissão de aprovação ${!currentValue ? "concedida" : "removida"}!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    } catch { toast({ title: "Erro ao alterar permissão", variant: "destructive" }); }
  };

  const handleToggleAcessoFinanceiro = async (userId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase.from("user_profiles").update({ acesso_financeiro: !currentValue }).eq("id", userId);
      if (error) throw error;
      toast({ title: `Acesso financeiro ${!currentValue ? "concedido" : "removido"}!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
    } catch { toast({ title: "Erro ao alterar acesso financeiro", variant: "destructive" }); }
  };

  const handleSaveKeyword = async () => {
    if (!keyword.trim()) return;
    setKeywordLoading(true);
    try {
      const { error } = await supabase.from("system_config").update({ valor: keyword.trim() }).eq("chave", "palavra_chave_cadastro");
      if (error) throw error;
      toast({ title: "Palavra-chave atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["system-config-keyword"] });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setKeywordLoading(false); }
  };

  const openEditarPerfil = (p: any) => {
    setEditarPerfilDialog({ id: p.id, nome: p.nome, telefone: p.telefone || "", numero_legendario: p.numero_legendario || "", area_preferencia: p.area_preferencia || "", email: p.email });
    setPerfilForm({ nome: p.nome, telefone: p.telefone || "", numero_legendario: p.numero_legendario || "", area_preferencia: p.area_preferencia || "", email: p.email });
  };

  const handleSalvarPerfil = async () => {
    if (!editarPerfilDialog) return;
    setSalvandoPerfil(true);
    try {
      const { error } = await supabase.from("user_profiles").update({
        nome: perfilForm.nome.trim(),
        telefone: perfilForm.telefone.trim() || null,
        numero_legendario: perfilForm.numero_legendario.trim() || null,
        area_preferencia: perfilForm.area_preferencia.trim() || null,
      }).eq("id", editarPerfilDialog.id);
      if (error) throw error;
      toast({ title: `Perfil de ${perfilForm.nome} atualizado!` });
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      setEditarPerfilDialog(null);
    } catch { toast({ title: "Erro ao salvar perfil", variant: "destructive" }); }
    finally { setSalvandoPerfil(false); }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Aprovações de Acesso</h1>
          {counts.pendentes > 0 && <Badge className="bg-amber-500 text-white">{counts.pendentes} pendente{counts.pendentes > 1 ? "s" : ""}</Badge>}
        </div>
        {role === "diretoria" && (
          <div className="flex gap-2">
            <Button onClick={() => setShowRelatorio(true)} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" /> Relatório PDF
            </Button>
            <Button onClick={() => setShowCadastroRapido(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
              <Star className="h-4 w-4" /> Cadastro Rápido Liderança
            </Button>
          </div>
        )}
      </div>

      <CadastroRapidoDialog open={showCadastroRapido} onOpenChange={setShowCadastroRapido} />
      <RelatorioServidoresPDF open={showRelatorio} onOpenChange={setShowRelatorio} />

      <div className="grid gap-4 grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-500">{counts.pendentes}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aprovados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-500">{counts.aprovados}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-foreground">{counts.total}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cadastro encontrado</p>
          ) : filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                  </div>
                  <Badge className={STATUS_COLORS[p.status || "pendente"] || ""}>{p.status || "pendente"}</Badge>
                </div>
                {p.telefone && <p className="text-xs text-muted-foreground">{formatPhone(p.telefone)}</p>}
                {p.created_at && <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yy")}</p>}
                <div className="flex gap-1 flex-wrap">
                  {p.status === "pendente" && (
                    <>
                      <Button size="sm" variant="ghost" className="text-green-600 flex-1" onClick={() => { setAprovarDialog({ id: p.id, nome: p.nome }); setCargoSelecionado("servidor"); }}>
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 flex-1" onClick={() => { setRecusarDialog({ id: p.id, nome: p.nome }); setMotivoRecusa(""); }}>
                        <X className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </>
                  )}
                  {p.status === "aprovado" && (
                    <>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEditarPerfil(p)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setEditarCargoDialog({ id: p.id, nome: p.nome, cargo: p.cargo || "servidor" }); setNovoCargoEdit(p.cargo || "servidor"); }}>
                        <Key className="h-4 w-4 mr-1" /> Cargo
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 flex-1" onClick={() => handleRevogar(p.id, p.nome)}>
                        <X className="h-4 w-4 mr-1" /> Revogar
                      </Button>
                      <div className="flex items-center gap-2 w-full mt-1">
                        <span className="text-xs text-muted-foreground">Pode aprovar:</span>
                        <Switch checked={!!p.pode_aprovar} onCheckedChange={() => handleTogglePodeAprovar(p.id, !!p.pode_aprovar)} />
                      </div>
                      <div className="flex items-center gap-2 w-full mt-1">
                        <span className="text-xs text-muted-foreground">Financeiro:</span>
                        <Switch checked={!!p.acesso_financeiro} onCheckedChange={() => handleToggleAcessoFinanceiro(p.id, !!p.acesso_financeiro)} />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
                     <TableHead className="hidden md:table-cell">Aprovador</TableHead>
                    <TableHead className="hidden md:table-cell">Financeiro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum cadastro encontrado</TableCell></TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-sm">{p.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{formatPhone(p.telefone)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.numero_legendario || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.area_preferencia || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.created_at ? format(new Date(p.created_at), "dd/MM/yy") : "-"}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[p.status || "pendente"] || ""}>{p.status || "pendente"}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.status === "aprovado" && <Switch checked={!!p.pode_aprovar} onCheckedChange={() => handleTogglePodeAprovar(p.id, !!p.pode_aprovar)} />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.status === "aprovado" && <Switch checked={!!p.acesso_financeiro} onCheckedChange={() => handleToggleAcessoFinanceiro(p.id, !!p.acesso_financeiro)} />}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "pendente" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => { setAprovarDialog({ id: p.id, nome: p.nome }); setCargoSelecionado("servidor"); }}><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => { setRecusarDialog({ id: p.id, nome: p.nome }); setMotivoRecusa(""); }}><X className="h-4 w-4" /></Button>
                            </>
                          )}
                          {p.status === "aprovado" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEditarPerfil(p)} title="Editar perfil"><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditarCargoDialog({ id: p.id, nome: p.nome, cargo: p.cargo || "servidor" }); setNovoCargoEdit(p.cargo || "servidor"); }} title="Alterar cargo"><Key className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleRevogar(p.id, p.nome)} title="Revogar acesso"><X className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyword Config */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Key className="h-5 w-5" /> Configurações</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <Label>Palavra-chave de acesso ao cadastro</Label>
              <div className="relative mt-1">
                <Input type={showKeyword ? "text" : "password"} value={keyword || configData?.valor || ""} onChange={(e) => setKeyword(e.target.value)} className="pr-10" placeholder="Palavra-chave" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowKeyword(v => !v)}>
                  {showKeyword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleSaveKeyword} disabled={keywordLoading} className={`gap-2 ${isMobile ? "w-full" : ""}`}>
              {keywordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={!!aprovarDialog} onOpenChange={() => setAprovarDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aprovar acesso de {aprovarDialog?.nome}?</DialogTitle></DialogHeader>
          <div><Label>Cargo</Label><Select value={cargoSelecionado} onValueChange={setCargoSelecionado}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CARGOS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
          <DialogFooter><Button variant="outline" onClick={() => setAprovarDialog(null)}>Cancelar</Button><Button onClick={handleAprovar} disabled={aprovando} className="gap-2">{aprovando && <Loader2 className="h-4 w-4 animate-spin" />} Aprovar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recusarDialog} onOpenChange={() => setRecusarDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recusar acesso de {recusarDialog?.nome}?</DialogTitle></DialogHeader>
          <div><Label>Motivo da recusa *</Label><Textarea value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} className="mt-1" placeholder="Informe o motivo..." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setRecusarDialog(null)}>Cancelar</Button><Button variant="destructive" onClick={handleRecusar} disabled={recusando} className="gap-2">{recusando && <Loader2 className="h-4 w-4 animate-spin" />} Recusar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editarCargoDialog} onOpenChange={() => setEditarCargoDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar cargo de {editarCargoDialog?.nome}</DialogTitle></DialogHeader>
          <div><Label>Novo cargo</Label><Select value={novoCargoEdit} onValueChange={setNovoCargoEdit}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CARGOS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditarCargoDialog(null)}>Cancelar</Button><Button onClick={handleEditarCargo} disabled={editandoCargo} className="gap-2">{editandoCargo && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editarPerfilDialog} onOpenChange={() => setEditarPerfilDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar perfil de {editarPerfilDialog?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={perfilForm.nome} onChange={(e) => setPerfilForm(f => ({ ...f, nome: e.target.value }))} className="mt-1" /></div>
            <div><Label>Telefone</Label><Input value={perfilForm.telefone} onChange={(e) => setPerfilForm(f => ({ ...f, telefone: e.target.value }))} className="mt-1" placeholder="(XX) XXXXX-XXXX" /></div>
            <div><Label>Nº Legendário</Label><Input value={perfilForm.numero_legendario} onChange={(e) => setPerfilForm(f => ({ ...f, numero_legendario: e.target.value }))} className="mt-1" placeholder="Ex: 85402" /></div>
            <div><Label>Área de preferência</Label><Input value={perfilForm.area_preferencia} onChange={(e) => setPerfilForm(f => ({ ...f, area_preferencia: e.target.value }))} className="mt-1" placeholder="Ex: Administração" /></div>
            <div><Label>Email</Label><Input value={perfilForm.email} disabled className="mt-1 opacity-60" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditarPerfilDialog(null)}>Cancelar</Button><Button onClick={handleSalvarPerfil} disabled={salvandoPerfil} className="gap-2">{salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Aprovacoes;
