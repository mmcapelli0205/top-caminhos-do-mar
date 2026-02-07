import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BG_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Caminhos%20do%20Mar%20-%20foto.png";
const LOGO_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Captura%20de%20tela%202026-02-06%20235131.png";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = "Informe o usuário";
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
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, papel, area_servico, senha_hash, ativo")
        .eq("username", username.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ title: "Usuário não encontrado", variant: "destructive" });
        setErrors({ username: "Usuário não encontrado" });
        return;
      }

      if (!data.ativo) {
        toast({
          title: "Usuário desativado",
          description: "Contate a Diretoria.",
          variant: "destructive",
        });
        return;
      }

      if (data.senha_hash !== password) {
        toast({ title: "Senha incorreta", variant: "destructive" });
        setErrors({ password: "Senha incorreta" });
        return;
      }

      localStorage.setItem(
        "top_user",
        JSON.stringify({
          id: data.id,
          nome: data.nome,
          papel: data.papel,
          area_servico: data.area_servico,
        })
      );

      navigate("/dashboard");
    } catch {
      toast({ title: "Erro ao conectar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src={BG_URL}
        alt="Caminhos do Mar"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <div className="animate-fade-in relative z-10 w-[90%] max-w-[480px] rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl sm:max-w-[420px] sm:p-8 lg:max-w-[480px]">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <img
            src={LOGO_URL}
            alt="Logo TOP"
            className="w-[120px] sm:w-[180px]"
          />
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-white sm:text-3xl">
          TOP Manager
        </h1>
        <p className="mb-6 text-center text-sm text-gray-300">
          Track Caminhos do Mar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username */}
          <div>
            <div
              className={`flex items-center gap-2 rounded-lg border bg-white/5 px-3 ${
                errors.username ? "border-red-500" : "border-white/10"
              }`}
            >
              <User className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-h-[48px] w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Password */}
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
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#E8731A] font-semibold text-white transition-colors hover:bg-[#c96115] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">
          Acesso restrito à equipe autorizada
        </p>
      </div>
    </div>
  );
};

export default Login;
