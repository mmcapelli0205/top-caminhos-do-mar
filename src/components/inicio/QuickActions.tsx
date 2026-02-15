import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Package, CalendarDays, Lock, ChevronRight } from "lucide-react";

interface Props {
  userEmail: string | null;
}

export default function QuickActions({ userEmail }: Props) {
  const navigate = useNavigate();

  const { data: servidor } = useQuery({
    queryKey: ["quick-action-area", userEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico")
        .eq("email", userEmail!)
        .maybeSingle();
      return data;
    },
    enabled: !!userEmail,
  });

  const areaSlug = servidor?.area_servico
    ? encodeURIComponent(servidor.area_servico)
    : null;

  const actions = [
    {
      icon: ClipboardList,
      title: "Minha Área",
      onClick: () => areaSlug && navigate(`/areas/${areaSlug}`),
      disabled: !areaSlug,
    },
    {
      icon: Package,
      title: "Meus Pedidos",
      onClick: () => areaSlug && navigate(`/areas/${areaSlug}?tab=pedidos`),
      disabled: !areaSlug,
    },
    {
      icon: CalendarDays,
      title: "Calendário",
      onClick: () =>
        document.getElementById("calendario-section")?.scrollIntoView({ behavior: "smooth" }),
      disabled: false,
    },
    {
      icon: Lock,
      title: "Acompanhar TOP",
      onClick: () => {},
      disabled: true,
      badge: "Em breve",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Card
          key={a.title}
          className={`cursor-pointer transition-colors hover:border-primary/50 ${
            a.disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={a.disabled ? undefined : a.onClick}
        >
          <CardContent className="flex items-center gap-3 p-4 relative">
            <a.icon className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">{a.title}</span>
            {a.badge ? (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {a.badge}
              </Badge>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
