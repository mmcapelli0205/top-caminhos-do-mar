import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  participantes: {
    status: string | null;
    contrato_assinado: boolean | null;
    checkin_realizado: boolean | null;
    ergometrico_status: string | null;
    data_nascimento: string | null;
    familia_id: number | null;
    valor_pago: number | null;
  }[];
  despesas: { valor: number }[];
  familiasCount: number;
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function useDashboardData() {
  const participantesQuery = useQuery({
    queryKey: ["dashboard-participantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participantes")
        .select("status, contrato_assinado, checkin_realizado, ergometrico_status, data_nascimento, familia_id, valor_pago");
      if (error) throw error;
      return data ?? [];
    },
  });

  const despesasQuery = useQuery({
    queryKey: ["dashboard-despesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("valor");
      if (error) throw error;
      return data ?? [];
    },
  });

  const familiasQuery = useQuery({
    queryKey: ["dashboard-familias"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("familias")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isLoading = participantesQuery.isLoading || despesasQuery.isLoading || familiasQuery.isLoading;

  const participantes = participantesQuery.data ?? [];
  const despesas = despesasQuery.data ?? [];
  const familiasCount = familiasQuery.data ?? 0;

  // KPI computations
  const ativos = participantes.filter((p) => p.status !== "cancelado");
  const totalInscritos = ativos.length;
  const contratosAssinados = ativos.filter((p) => p.contrato_assinado).length;
  const checkinsRealizados = ativos.filter((p) => p.checkin_realizado).length;
  const ergometricosPendentes = ativos.filter(
    (p) => p.ergometrico_status === "pendente" && p.data_nascimento && calcAge(p.data_nascimento) >= 40
  ).length;

  // Familias
  const familiaIds = new Set(participantes.filter((p) => p.familia_id != null).map((p) => p.familia_id));
  const familiasFormadas = familiaIds.size;
  const participantesAlocados = participantes.filter((p) => p.familia_id != null).length;

  // Financeiro
  const receita = participantes.reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (d.valor ?? 0), 0);
  const balanco = receita - totalDespesas;

  // Age distribution
  const ageBuckets = { "18-30": 0, "31-40": 0, "41-50": 0, "51-60": 0, "60+": 0 };
  ativos.forEach((p) => {
    if (!p.data_nascimento) return;
    const age = calcAge(p.data_nascimento);
    if (age <= 30) ageBuckets["18-30"]++;
    else if (age <= 40) ageBuckets["31-40"]++;
    else if (age <= 50) ageBuckets["41-50"]++;
    else if (age <= 60) ageBuckets["51-60"]++;
    else ageBuckets["60+"]++;
  });
  const ageData = Object.entries(ageBuckets).map(([faixa, total]) => ({ faixa, total }));

  // Status distribution
  const statusMap: Record<string, number> = {};
  participantes.forEach((p) => {
    const s = p.status ?? "inscrito";
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  return {
    isLoading,
    totalInscritos,
    contratosAssinados,
    checkinsRealizados,
    ergometricosPendentes,
    familiasFormadas,
    familiasCount,
    participantesAlocados,
    receita,
    totalDespesas,
    balanco,
    ageData,
    statusData,
  };
}
