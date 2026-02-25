import { useState, useEffect, useCallback } from "react";
import { Settings, Plus, Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAreaServico } from "@/hooks/useAreaServico";
import { getPermissoesMenu } from "@/lib/permissoes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const API_URL = "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users";

const ROLES = ["diretoria", "coordenacao", "coord02", "coord03", "flutuante01", "flutuante02", "flutuante03", "expert", "sombra", "servidor"];
const AREAS = ["Eventos", "Segurança", "Hakunas", "Logística", "Comunicação", "Mídia", "Administração", "Intercessão"];

interface Usuario {
  id: string; nome: string; email: string; telefone: string | null;
  cargo: string | null; area_preferencia: string | null;
  numero_legendario: string | null; status: string | null; role: string;
}

interface FormData {
  email: string; nome: string; senha: string; role: string;
  telefone: string; cargo: string; area_preferencia: string; status: string;
}

const emptyForm: FormData = { email: "", nome: "", senha: "", role: "servidor", telefone: "", cargo: "", area_preferencia: "", status: "aprovado" };

const Configuracoes = () => {
  const { session, role, loading: authLoading } = useAuth();
  const { areaServico } = useAreaServico();
  const area = role === "diretoria" ? "Diretoria" : (areaServico ?? null);
  const perms = getPermissoesMenu(area);
  const isDiretoria = role === "diretoria";
  // DOC can list/create but not edit
  const canList = perms.config_listar === "E" || isDiretoria;
  const canCreate = perms.config_novo === "E" || isDiretoria;
  const canEditUser = perms.config_editar === "E" || isDiretoria;
  const hasAccess = canList || canCreate;
  const isMobile = useIsMobile();

  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const callApi = useCallback(
    async (body: Record<string, unknown>) => {
      const token = session?.access_token;
      if (!token) throw new Error("Não autenticado");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsa256Z3VwbnN3eWV5bndwb3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzEyMzEsImV4cCI6MjA4NjA0NzIzMX0.dEr0MFzKtbkqxXu0m5dvMPDZWlB-uddw2UNsUP3UUKQ",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      return data;
    },
    [session?.access_token]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callApi({ action: "list" });
      setUsers(data.users || []);
    } catch (err: unknown) {
      toast({ title: "Erro ao carregar usuários", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  useEffect(() => {
    if (isDiretoria && session) loadUsers();
  }, [isDiretoria, session, loadUsers]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ email: u.email, nome: u.nome, senha: "", role: u.role, telefone: u.telefone || "", cargo: u.cargo || "", area_preferencia: u.area_preferencia || "", status: u.status || "aprovado" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim() || !form.nome.trim() || !form.role) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return;
    }
    if (!editing && !form.senha) {
      toast({ title: "Senha obrigatória para novo usuário", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await callApi({ action: "update", user_id: editing.id, email: form.email.trim(), nome: form.nome.trim(), senha: form.senha || undefined, role: form.role, telefone: form.telefone || null, cargo: form.cargo || null, area_preferencia: form.area_preferencia || null, status: form.status });
        toast({ title: "Usuário atualizado" });
      } else {
        await callApi({ action: "create", email: form.email.trim(), nome: form.nome.trim(), senha: form.senha, role: form.role, telefone: form.telefone || null, cargo: form.cargo || null, area_preferencia: form.area_preferencia || null });
        toast({ title: "Usuário criado" });
      }
      setDialogOpen(false); loadUsers();
    } catch (err: unknown) {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return (<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);

  if (!hasAccess) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Settings className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Configurações</h1></div>
      <p className="text-muted-foreground">Apenas a diretoria e áreas autorizadas podem acessar as configurações.</p>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3"><Settings className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Configurações</h1></div>
          {canCreate && <Button onClick={openCreate} className={`gap-2 ${isMobile ? "w-full" : ""}`}><Plus className="h-4 w-4" /> Novo Usuário</Button>}
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : isMobile ? (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado</p>
          ) : users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {canEditUser && <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                  <Badge variant={u.status === "aprovado" ? "default" : "outline"} className="capitalize">{u.status || "pendente"}</Badge>
                </div>
                {u.cargo && <p className="text-xs text-muted-foreground">{u.cargo}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{u.role}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{u.cargo || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={u.status === "aprovado" ? "default" : "outline"} className="capitalize">{u.status || "pendente"}</Badge></td>
                  <td className="px-4 py-3">{canEditUser && <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>}</td>
                </tr>
              ))}
              {users.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário cadastrado</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do usuário" /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
            <div className="space-y-2"><Label>{editing ? "Nova senha (deixe vazio para manter)" : "Senha *"}</Label><Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder={editing ? "••••••" : "Defina a senha"} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => (<SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Coordenador de Eventos" /></div>
            {["coordenacao", "coord02", "coord03", "flutuante01", "flutuante02", "flutuante03", "expert", "sombra"].includes(form.role) && (
              <div className="space-y-2">
                <Label>Área de preferência</Label>
                <Select value={form.area_preferencia} onValueChange={(v) => setForm({ ...form, area_preferencia: v })}><SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger><SelectContent>{AREAS.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent></Select>
              </div>
            )}
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="recusado">Recusado</SelectItem></SelectContent></Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
