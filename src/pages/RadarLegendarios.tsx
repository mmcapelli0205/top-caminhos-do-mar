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

export default function RadarLegendarios() {
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
    <div className="min-h-screen bg-[#1a1a1a] p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Radio className="h-7 w-7 text-[#c9a84c]" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Radar Legendários
            </h1>
            <p className="text-sm text-gray-400">
              TOPs com inscrições abertas pelo Brasil e mundo
            </p>
          </div>
        </div>
        <RastrearTopsButton />
      </div>

      {/* Filters */}
      <RadarFilters
        estado={estado}
        setEstado={setEstado}
        statusServidor={statusServidor}
        setStatusServidor={setStatusServidor}
      />

      {/* TOPs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 bg-[#2d2d2d]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Radio className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            Nenhum TOP encontrado com os filtros atuais
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Clique em "Rastrear TOPs" para buscar novos eventos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((top) => (
            <div key={top.id} className="relative">
              <TopLegendarioCard
                top={top}
                onAjudeEncontrar={setAjudeTop}
              />
              <div className="absolute top-3 right-12">
                <CompartilharWhatsApp top={top} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bases Instagram */}
      <section>
        <h2 className="text-xl font-bold text-[#c9a84c] mb-4">
          Bases Legendários
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Acesse diretamente o Instagram de cada base regional
        </p>
        <BasesInstagramSection />
      </section>

      {/* Notícias */}
      <section>
        <h2 className="text-xl font-bold text-[#c9a84c] mb-4">
          Notícias do Radar
        </h2>
        <RadarNoticiasSection />
      </section>

      {/* Modal crowdsourcing */}
      <AjudeEncontrarModal
        open={!!ajudeTop}
        onOpenChange={(open) => !open && setAjudeTop(null)}
        top={ajudeTop}
      />
    </div>
  );
}
