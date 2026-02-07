import { useState, useEffect, useCallback } from "react";
import { Settings, Plus, Pencil, Loader2, UserCheck, UserX } from "lucide-react";
import { getUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users";

const PAPEIS = ["diretoria", "coordenacao", "servidor", "participante"];
const AREAS = [
  "Eventos",
  "Segurança",
  "Hakunas",
  "Logística",
  "Comunicação",
  "Mídia",
  "Administração",
  "Intercessão",
];

interface Usuario {
  id: string;
  username: string;
  nome: string;
  papel: string;
  area_servico: string | null;
  ativo: boolean;
}

interface FormData {
  username: string;
  nome: string;
  senha: string;
  papel: string;
  area_servico: string;
  ativo: boolean;
}

const emptyForm: FormData = {
  username: "",
  nome: "",
  senha: "",
  papel: "servidor",
  area_servico: "",
  ativo: true,
};

const Configuracoes = () => {
  const currentUser = getUser();
  const isDiretoria = currentUser?.papel === "diretoria";

  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const callApi = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, caller_id: currentUser?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      return data;
    },
    [currentUser?.id]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callApi({ action: "list" });
      setUsers(data.users || []);
    } catch (err: unknown) {
      toast({
        title: "Erro ao carregar usuários",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  useEffect(() => {
    if (isDiretoria) loadUsers();
  }, [isDiretoria, loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({
      username: u.username,
      nome: u.nome,
      senha: "",
      papel: u.papel,
      area_servico: u.area_servico || "",
      ativo: u.ativo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.nome.trim() || !form.papel) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!editing && !form.senha) {
      toast({ title: "Senha obrigatória para novo usuário", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await callApi({
          action: "update",
          user_id: editing.id,
          username: form.username.trim(),
          nome: form.nome.trim(),
          senha: form.senha || undefined,
          papel: form.papel,
          area_servico: form.area_servico || null,
          ativo: form.ativo,
        });
        toast({ title: "Usuário atualizado" });
      } else {
        await callApi({
          action: "create",
          username: form.username.trim(),
          nome: form.nome.trim(),
          senha: form.senha,
          papel: form.papel,
          area_servico: form.area_servico || null,
        });
        toast({ title: "Usuário criado" });
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isDiretoria) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Apenas a diretoria pode acessar as configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {u.papel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.area_servico || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <UserCheck className="h-4 w-4" /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <UserX className="h-4 w-4" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Login de acesso"
              />
            </div>

            <div className="space-y-2">
              <Label>{editing ? "Nova senha (deixe vazio para manter)" : "Senha *"}</Label>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder={editing ? "••••••" : "Defina a senha"}
              />
            </div>

            <div className="space-y-2">
              <Label>Papel *</Label>
              <Select
                value={form.papel}
                onValueChange={(v) => setForm({ ...form, papel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.papel === "coordenacao" && (
              <div className="space-y-2">
                <Label>Área de serviço</Label>
                <Select
                  value={form.area_servico}
                  onValueChange={(v) => setForm({ ...form, area_servico: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editing && (
              <div className="flex items-center gap-3">
                <Label>Ativo</Label>
                <Button
                  type="button"
                  variant={form.ativo ? "default" : "destructive"}
                  size="sm"
                  onClick={() => setForm({ ...form, ativo: !form.ativo })}
                >
                  {form.ativo ? "Sim" : "Não"}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
