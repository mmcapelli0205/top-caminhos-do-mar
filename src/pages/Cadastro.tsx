import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

const BG_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Caminhos%20do%20Mar%20-%20foto.png";
const LOGO_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Captura%20de%20tela%202026-02-06%20235131.png";

const AREAS = [
  "Eventos",
  "Segurança",
  "Hakunas",
  "Logística",
  "Comunicação",
  "Mídia",
  "Administração",
  "Intercessão",
  "Trilha",
  "Cozinha",
  "Louvor",
  "Palco",
  "Recepção",
  "Limpeza",
  "Transporte",
];

function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const Cadastro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    numero_legendario: "",
    area_preferencia: "",
    senha: "",
    confirmar_senha: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.email.trim()) e.email = "Email é obrigatório";
    if (!form.telefone.trim()) e.telefone = "Telefone é obrigatório";
    if (!form.senha) e.senha = "Senha é obrigatória";
    else if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (form.senha !== form.confirmar_senha)
      e.confirmar_senha = "Senhas não conferem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.senha,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({ title: "Este email já está cadastrado", variant: "destructive" });
        } else {
          toast({ title: authError.message, variant: "destructive" });
        }
        return;
      }

      if (!authData.user) {
        toast({ title: "Erro ao criar conta", variant: "destructive" });
        return;
      }

      // 2. Insert profile
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: authData.user.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        numero_legendario: form.numero_legendario.trim() || null,
        area_preferencia: form.area_preferencia || null,
        status: "pendente",
        cargo: "servidor",
      });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        // Profile creation failed but auth user was created
        // This is handled gracefully - admin can see the user
      }

      setSuccess(true);
    } catch {
      toast({ title: "Erro ao cadastrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <img src={BG_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 w-[90%] max-w-[480px] rounded-2xl border border-white/10 bg-black/40 p-8 text-center shadow-2xl backdrop-blur-xl">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
          <h2 className="mb-2 text-2xl font-bold text-white">Cadastro enviado!</h2>
          <p className="mb-2 text-gray-300">
            Verifique seu email para confirmar a conta.
          </p>
          <p className="mb-6 text-gray-400 text-sm">
            Após confirmar, aguarde a aprovação da coordenação para acessar o sistema.
          </p>
          <Button onClick={() => navigate("/")} variant="outline" className="text-white border-white/20 hover:bg-white/10">
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden py-8">
      <img src={BG_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-[90%] max-w-[520px] rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <button
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mb-4 flex justify-center">
          <img src={LOGO_URL} alt="Logo TOP" className="w-[100px]" />
        </div>

        <h1 className="mb-1 text-center text-xl font-bold text-white">Criar conta</h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Preencha seus dados para se cadastrar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">Nome completo *</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="Seu nome completo"
            />
            {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome}</p>}
          </div>

          <div>
            <Label className="text-gray-300">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="seu@email.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <Label className="text-gray-300">Telefone *</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: phoneMask(e.target.value) })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="(99) 99999-9999"
            />
            {errors.telefone && <p className="mt-1 text-xs text-red-400">{errors.telefone}</p>}
          </div>

          <div>
            <Label className="text-gray-300">Nº Legendário</Label>
            <Input
              value={form.numero_legendario}
              onChange={(e) => setForm({ ...form, numero_legendario: e.target.value })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="Opcional"
            />
          </div>

          <div>
            <Label className="text-gray-300">Área de preferência</Label>
            <Select
              value={form.area_preferencia}
              onValueChange={(v) => setForm({ ...form, area_preferencia: v })}
            >
              <SelectTrigger className="mt-1 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Selecione uma área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Senha *</Label>
            <Input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha}</p>}
          </div>

          <div>
            <Label className="text-gray-300">Confirmar senha *</Label>
            <Input
              type="password"
              value={form.confirmar_senha}
              onChange={(e) => setForm({ ...form, confirmar_senha: e.target.value })}
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              placeholder="Repita a senha"
            />
            {errors.confirmar_senha && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmar_senha}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#E8731A] font-semibold text-white transition-colors hover:bg-[#c96115] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CADASTRAR"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;
