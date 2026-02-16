import { useState } from "react";
import { Loader2, CheckCircle, Copy, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EQUIPES = [
  "ADM", "Eventos", "Segurança", "Logística", "Hakuna", "Voz",
  "Comunicação", "Mídia", "Intercessão", "DOC", "Louvor", "Diretoria",
];

const CARGOS_DIRETORIA = ["Diretor", "Sub-Diretor", "Diretor Espiritual"];
const CARGOS_EQUIPE = [
  "Coordenador 01", "Coordenador 02", "Coordenador 03",
  "Sombra 01", "Sombra 02", "Sombra 03",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credenciais {
  nome: string;
  email: string;
  senha: string;
}

export default function CadastroRapidoDialog({ open, onOpenChange }: Props) {
  const [estado, setEstado] = useState<"form" | "sucesso">("form");
  const [nome, setNome] = useState("");
  const [equipe, setEquipe] = useState("");
  const [cargo, setCargo] = useState("");
  const [loading, setLoading] = useState(false);
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null);

  const cargosDisponiveis = equipe === "Diretoria" ? CARGOS_DIRETORIA : CARGOS_EQUIPE;

  const resetForm = () => {
    setNome("");
    setEquipe("");
    setCargo("");
    setEstado("form");
    setCredenciais(null);
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !equipe || !cargo) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "create_temp_user",
            nome: nome.trim(),
            equipe,
            cargo_area: cargo,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao cadastrar");

      setCredenciais({ nome: nome.trim(), email: result.email, senha: result.senha });
      setEstado("sucesso");
    } catch (e: any) {
      toast({ title: e.message || "Erro ao cadastrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    if (!credenciais) return;
    const text = `Login: ${credenciais.email}\nSenha: ${credenciais.senha}`;
    await navigator.clipboard.writeText(text);
    toast({ title: "Credenciais copiadas!" });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        {estado === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                Cadastro Rápido de Liderança
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Equipe *</Label>
                <Select value={equipe} onValueChange={(v) => { setEquipe(v); setCargo(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {EQUIPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {equipe && (
                <div>
                  <Label>Cargo *</Label>
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {cargosDisponiveis.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleCadastrar} disabled={loading} className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Cadastrar
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                Servidor cadastrado com sucesso!
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Envie essas credenciais para <strong>{credenciais?.nome}</strong>:
            </p>

            <div className="rounded-lg border-2 border-orange-500 bg-orange-500/10 p-4 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Login:</span>
                <p className="font-mono text-sm font-semibold">{credenciais?.email}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Senha:</span>
                <p className="font-mono text-sm font-semibold">{credenciais?.senha}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleCopiar} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" /> Copiar Credenciais
              </Button>
              <Button onClick={resetForm} variant="outline" className="gap-2">
                <Star className="h-4 w-4" /> Cadastrar Outro
              </Button>
              <Button onClick={handleClose} variant="ghost">
                Fechar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
