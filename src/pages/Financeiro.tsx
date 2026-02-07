import { DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumoSection from "@/components/financeiro/ResumoSection";
import ReceitaSection from "@/components/financeiro/ReceitaSection";
import DespesasSection from "@/components/financeiro/DespesasSection";
import MreSection from "@/components/financeiro/MreSection";
import CeiaSection from "@/components/financeiro/CeiaSection";

const Financeiro = () => (
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
      </TabsList>
      <TabsContent value="resumo"><ResumoSection /></TabsContent>
      <TabsContent value="receita"><ReceitaSection /></TabsContent>
      <TabsContent value="despesas"><DespesasSection /></TabsContent>
      <TabsContent value="mre"><MreSection /></TabsContent>
      <TabsContent value="ceia"><CeiaSection /></TabsContent>
    </Tabs>
  </div>
);

export default Financeiro;
