import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Home, DollarSign, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_COLORS } from "@/lib/whatsappUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TopActiveCardProps {
  top: {
    id: string;
    nome: string;
    local: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    status: string | null;
  };
}

export default function TopActiveCard({ top }: TopActiveCardProps) {
  const { data: counts } = useQuery({
    queryKey: ["top-counts", top.id],
    queryFn: async () => {
      const [partRes, servRes, famRes, receitaRes] = await Promise.all([
        supabase.from("participantes").select("id", { count: "exact", head: true }).eq("top_id", top.id),
        supabase.from("servidores").select("id", { count: "exact", head: true }).eq("top_id", top.id),
        supabase.from("familias").select("id", { count: "exact", head: true }).eq("familia_top_id", top.id),
        supabase.from("participantes").select("valor_pago").eq("top_id", top.id),
      ]);
      const receita = (receitaRes.data || []).reduce((sum, p) => sum + (Number(p.valor_pago) || 0), 0);
      return {
        participantes: partRes.count || 0,
        servidores: servRes.count || 0,
        familias: famRes.count || 0,
        receita,
      };
    },
  });

  const statusClass = STATUS_COLORS[top.status || "Planejamento"] || STATUS_COLORS["Planejamento"];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-xl">{top.nome}</CardTitle>
          <Badge className={statusClass}>{top.status || "Planejamento"}</Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {top.local && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{top.local}</span>
          )}
          {top.data_inicio && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(top.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
              {top.data_fim && ` — ${format(new Date(top.data_fim), "dd/MM/yyyy", { locale: ptBR })}`}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Participantes" value={counts?.participantes ?? "—"} />
          <StatCard icon={UserCheck} label="Servidores" value={counts?.servidores ?? "—"} />
          <StatCard icon={Home} label="Famílias" value={counts?.familias ?? "—"} />
          <StatCard icon={DollarSign} label="Receita" value={counts ? `R$ ${counts.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
