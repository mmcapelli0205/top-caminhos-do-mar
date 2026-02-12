import { useState, useMemo } from "react";
import { Radio } from "lucide-react";
import { useTopLegendarios, TopLegendario } from "@/hooks/useRadarLegendarios";
import { TopLegendarioCard } from "@/components/radar/TopLegendarioCard";
import { RadarFilters } from "@/components/radar/RadarFilters";
import { RastrearTopsButton } from "@/components/radar/RastrearTopsButton";
import { AjudeEncontrarModal } from "@/components/radar/AjudeEncontrarModal";
import { BasesInstagramSection } from "@/components/radar/BasesInstagramSection";
import { RadarNoticiasSection } from "@/components/radar/RadarNoticiasSection";
import { CompartilharWhatsApp } from "@/components/radar/CompartilharWhatsApp";
import { Skeleton } from "@/components/ui/skeleton";

export default function AreaRadar() {
  const { data: tops, isLoading } = useTopLegendarios();
  const [estado, setEstado] = useState("Todos");
  const [statusServidor, setStatusServidor] = useState("todos");
  const [ajudeTop, setAjudeTop] = useState<TopLegendario | null>(null);

  const filtered = useMemo(() => {
    if (!tops) return [];
    return tops.filter((t) => {
      if (estado !== "Todos" && t.estado !== estado) return false;
      if (statusServidor === "com_link" && !t.link_servidor) return false;
      if (statusServidor === "sem_link" && t.link_servidor) return false;
      return true;
    });
  }, [tops, estado, statusServidor]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-[#c9a84c]" />
          <div>
            <h2 className="text-lg font-bold text-white">Radar Legendários</h2>
            <p className="text-sm text-gray-400">TOPs com inscrições abertas</p>
          </div>
        </div>
        <RastrearTopsButton />
      </div>

      <RadarFilters
        estado={estado}
        setEstado={setEstado}
        statusServidor={statusServidor}
        setStatusServidor={setStatusServidor}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 bg-[#2d2d2d]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Radio className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum TOP encontrado</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Rastrear TOPs" para buscar novos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((top) => (
            <div key={top.id} className="relative">
              <TopLegendarioCard top={top} onAjudeEncontrar={setAjudeTop} />
              <div className="absolute top-3 right-12">
                <CompartilharWhatsApp top={top} />
              </div>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="text-lg font-bold text-[#c9a84c] mb-3">Bases Legendários</h3>
        <p className="text-gray-400 text-sm mb-3">Instagram de cada base regional</p>
        <BasesInstagramSection />
      </section>

      <section>
        <h3 className="text-lg font-bold text-[#c9a84c] mb-3">Notícias do Radar</h3>
        <RadarNoticiasSection />
      </section>

      <AjudeEncontrarModal
        open={!!ajudeTop}
        onOpenChange={(open) => !open && setAjudeTop(null)}
        top={ajudeTop}
      />
    </div>
  );
}
