import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TAMANHOS_FARDA = ["PP", "P", "M", "G", "GG", "XGG"];

const LOGO_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Caminhos%20do%20Mar%20sem%20fundo.png";

export default function PrimeiroAcesso() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Etapa 1
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Etapa 2
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [igreja, setIgreja] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [numeroLegendario, setNumeroLegendario] = useState("");
  const [tamanhoFarda, setTamanhoFarda] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [habilidades, setHabilidades] = useState("");
  const [experiencia, setExperiencia] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/", { replace: true });
        return;
      }
      setUserId(session.user.id);
      // Fetch user name
      supabase
        .from("user_profiles")
        .select("nome, primeiro_acesso")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserName(data.nome || "");
            if (!data.primeiro_acesso) {
              navigate("/dashboard", { replace: true });
            }
          }
        });
    });
  }, [navigate]);

  const handleEtapa1 = async () => {
    if (!novoEmail.trim() || !novoEmail.includes("@")) {
      toast({ title: "Informe um email válido", variant: "destructive" });
      return;
    }
    if (novaSenha.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Call edge function to update credentials without email confirmation
      const res = await fetch(
        "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/manage-users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_credentials",
            user_id: userId,
            new_email: novoEmail.trim(),
            new_password: novaSenha,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao atualizar");

      // Re-authenticate with new credentials
      await supabase.auth.signOut();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: novoEmail.trim(),
        password: novaSenha,
      });

      if (signInError) throw signInError;

      toast({ title: "Credenciais atualizadas!" });
      setEtapa(2);
    } catch (e: any) {
      toast({ title: e.message || "Erro ao atualizar credenciais", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEtapa2 = async () => {
    setLoading(true);
    try {
      // Update servidor record
      const { error: servidorError } = await supabase
        .from("servidores")
        .update({
          cpf: cpf.trim() || null,
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento || null,
          igreja: igreja.trim() || null,
          cidade: cidade.trim() || null,
          estado: estado.trim() || null,
          endereco: endereco.trim() || null,
          cep: cep.trim() || null,
          numero_legendario: numeroLegendario.trim() || null,
          tamanho_farda: tamanhoFarda || null,
          contato_nome: contatoNome.trim() || null,
          contato_telefone: contatoTelefone.trim() || null,
          contato_email: contatoEmail.trim() || null,
          habilidades: habilidades.trim() || null,
          experiencia: experiencia.trim() || null,
          dados_completos: true,
        })
        .eq("nome", userName)
        .eq("origem", "convite")
        .eq("dados_completos", false);

      if (servidorError) console.error("Servidor update error:", servidorError);

      // Update user_profiles
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          primeiro_acesso: false,
          telefone: telefone.trim() || null,
          numero_legendario: numeroLegendario.trim() || null,
        })
        .eq("id", userId!);

      if (profileError) throw profileError;

      toast({ title: "Perfil completo! Bem-vindo ao TOP Manager!" });
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      toast({ title: e.message || "Erro ao salvar perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={LOGO_URL} alt="" className="w-[220px] max-w-[280px] sm:w-[280px] sm:max-w-[350px] object-contain" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          <Badge variant={etapa === 1 ? "default" : "secondary"} className={etapa === 1 ? "bg-orange-600" : ""}>
            1
          </Badge>
          <div className="h-px w-8 bg-border" />
          <Badge variant={etapa === 2 ? "default" : "secondary"} className={etapa === 2 ? "bg-orange-600" : ""}>
            2
          </Badge>
          <span className="ml-2 text-sm text-muted-foreground">Etapa {etapa} de 2</span>
        </div>

        {etapa === 1 ? (
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">👋 Bem-vindo ao TOP Manager!</h1>
              <p className="mt-1 text-muted-foreground">Atualize seus dados de acesso</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Novo Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>Nova Senha * (mínimo 6 caracteres)</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Nova senha"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Confirmar Senha *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button onClick={handleEtapa1} disabled={loading} className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Atualizar Acesso
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">📝 Complete seu perfil</h1>
              <p className="mt-1 text-muted-foreground">Preencha seus dados de servidor</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="mt-1" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="mt-1" />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Igreja</Label>
                <Input value={igreja} onChange={(e) => setIgreja(e.target.value)} placeholder="Nome da igreja" className="mt-1" />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Ex: SP" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="mt-1" />
              </div>
              <div>
                <Label>Número Legendário</Label>
                <Input value={numeroLegendario} onChange={(e) => setNumeroLegendario(e.target.value)} placeholder="Ex: 85402" className="mt-1" />
              </div>
              <div>
                <Label>Tamanho da Farda</Label>
                <Select value={tamanhoFarda} onValueChange={setTamanhoFarda}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {TAMANHOS_FARDA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Contato de Emergência</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label>Habilidades</Label>
                <Input value={habilidades} onChange={(e) => setHabilidades(e.target.value)} placeholder="Ex: Primeiros socorros, liderança..." className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Experiência</Label>
                <Input value={experiencia} onChange={(e) => setExperiencia(e.target.value)} placeholder="Ex: 3 TOPs anteriores" className="mt-1" />
              </div>
            </div>

            <Button onClick={handleEtapa2} disabled={loading} className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar e Entrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
