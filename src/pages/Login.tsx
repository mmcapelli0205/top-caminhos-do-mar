import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BG_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Caminhos%20do%20Mar%20-%20foto.png";
const LOGO_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Logo%20Legendarios.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Keyword dialog
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Informe o email";
    if (!password) e.password = "Informe a senha";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast({ title: "Email ou senha incorretos", variant: "destructive" });
          setErrors({ password: "Email ou senha incorretos" });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email não confirmado",
            description: "Verifique sua caixa de entrada para confirmar o email.",
            variant: "destructive",
          });
        } else {
          toast({ title: error.message, variant: "destructive" });
        }
        return;
      }

      navigate("/dashboard");
    } catch {
      toast({ title: "Erro ao conectar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordValidation = async () => {
    if (!keyword.trim()) {
      toast({ title: "Digite a palavra-chave", variant: "destructive" });
      return;
    }

    setKeywordLoading(true);
    try {
      const res = await fetch(
        "https://ilknzgupnswyeynwpovj.supabase.co/functions/v1/validate-keyword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: keyword.trim() }),
        }
      );

      const result = await res.json();

      if (result.valid) {
        setShowKeywordDialog(false);
        setKeyword("");
        navigate("/cadastro");
      } else {
        toast({
          title: "Palavra-chave incorreta",
          description: "Procure a coordenação para obter a palavra-chave correta.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erro ao validar", variant: "destructive" });
    } finally {
      setKeywordLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={BG_URL}
        alt="Caminhos do Mar"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="animate-fade-in relative z-10 w-[90%] max-w-[480px] rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl sm:max-w-[420px] sm:p-8 lg:max-w-[480px]">
        <div className="mb-4 flex justify-center">
          <img
            src={LOGO_URL}
            alt="Logo TOP"
            className="w-[140px] sm:w-[200px]"
          />
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-white sm:text-3xl">
          TOP Manager
        </h1>
        <p className="mb-6 text-center text-sm text-gray-300">
          Track Caminhos do Mar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div
              className={`flex items-center gap-2 rounded-lg border bg-white/5 px-3 ${
                errors.email ? "border-red-500" : "border-white/10"
              }`}
            >
              <Mail className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <div
              className={`flex items-center gap-2 rounded-lg border bg-white/5 px-3 ${
                errors.password ? "border-red-500" : "border-white/10"
              }`}
            >
              <Lock className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#E8731A] font-semibold text-white transition-colors hover:bg-[#c96115] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowKeywordDialog(true)}
            className="text-sm text-[#E8731A] hover:text-[#c96115] hover:underline transition-colors"
          >
            Criar conta
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          Acesso restrito à equipe autorizada
        </p>
      </div>

      {/* Keyword Dialog */}
      <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Palavra-chave de acesso</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Para criar uma conta, digite a palavra-chave fornecida pela coordenação.
          </p>
          <Input
            placeholder="Digite a palavra-chave"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeywordValidation()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeywordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleKeywordValidation} disabled={keywordLoading}>
              {keywordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
