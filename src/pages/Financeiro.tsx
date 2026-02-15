import { DollarSign, Lock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ResumoSection from "@/components/financeiro/ResumoSection";
import ReceitaSection from "@/components/financeiro/ReceitaSection";
import DespesasSection from "@/components/financeiro/DespesasSection";
import MreSection from "@/components/financeiro/MreSection";
import CeiaSection from "@/components/financeiro/CeiaSection";
import BebidasSection from "@/components/financeiro/BebidasSection";

const Financeiro = () => {
  const { profile, role, loading: authLoading } = useAuth();

  const { data: servidor, isLoading: loadingServidor } = useQuery({
    queryKey: ["fin-check-servidor", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico")
        .eq("email", profile!.email)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  const loading = authLoading || loadingServidor;

  const temAcesso =
    role === "diretoria" ||
    servidor?.area_servico === "ADM" ||
    profile?.acesso_financeiro === true;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!temAcesso) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Acesso restrito à Diretoria e equipe ADM. Solicite acesso ao seu coordenador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="receita">Receita</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="mre">MRE</TabsTrigger>
          <TabsTrigger value="ceia">Ceia do Rei</TabsTrigger>
          <TabsTrigger value="bebidas">Bebidas</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo"><ResumoSection /></TabsContent>
        <TabsContent value="receita"><ReceitaSection /></TabsContent>
        <TabsContent value="despesas"><DespesasSection /></TabsContent>
        <TabsContent value="mre"><MreSection /></TabsContent>
        <TabsContent value="ceia"><CeiaSection /></TabsContent>
        <TabsContent value="bebidas"><BebidasSection /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;
