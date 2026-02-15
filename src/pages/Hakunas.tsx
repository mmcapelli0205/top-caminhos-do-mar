import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EquipeTab from "@/components/hakunas/EquipeTab";
import ErgometricosTab from "@/components/hakunas/ErgometricosTab";
import AutorizacoesTab from "@/components/hakunas/AutorizacoesTab";
import MedicamentosEstoqueTab from "@/components/hakunas/MedicamentosEstoqueTab";
import EquipamentosEstoqueTab from "@/components/hakunas/EquipamentosEstoqueTab";

export default function Hakunas() {
  const navigate = useNavigate();

  const { data: count = 0 } = useQuery({
    queryKey: ["hakunas-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("servidores")
        .select("*", { count: "exact", head: true })
        .eq("area_servico", "Hakuna")
        .eq("status", "aprovado");
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Hakunas — Equipe de Saúde</h1>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
        <Button size="sm" onClick={() => navigate("/servidores/novo?area=Hakuna")}>
          <Plus className="h-4 w-4 mr-1" /> Novo Hakuna
        </Button>
      </div>

      <Tabs defaultValue="equipe">
        <TabsList className="overflow-x-auto w-full justify-start">
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="ergometricos">Ergométricos</TabsTrigger>
          <TabsTrigger value="autorizacoes">Autorizações</TabsTrigger>
          <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="equipe"><EquipeTab /></TabsContent>
        <TabsContent value="ergometricos"><ErgometricosTab /></TabsContent>
        <TabsContent value="autorizacoes"><AutorizacoesTab /></TabsContent>
        <TabsContent value="medicamentos"><MedicamentosEstoqueTab /></TabsContent>
        <TabsContent value="equipamentos"><EquipamentosEstoqueTab /></TabsContent>
      </Tabs>
    </div>
  );
}
