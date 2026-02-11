import { Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBasesLegendarios } from "@/hooks/useRadarLegendarios";
import { Skeleton } from "@/components/ui/skeleton";

export function BasesInstagramSection() {
  const { data: bases, isLoading } = useBasesLegendarios();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-20 bg-[#2d2d2d]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {bases?.map((base) => (
        <Card
          key={base.id}
          className="bg-[#2d2d2d] border-[#c9a84c]/20 hover:border-[#c9a84c]/50 transition-colors cursor-pointer"
          onClick={() =>
            window.open(
              `https://instagram.com/${base.instagram_handle}`,
              "_blank"
            )
          }
        >
          <CardContent className="p-3 flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {base.nome}
              </p>
              <p className="text-gray-500 text-[10px] truncate">
                @{base.instagram_handle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
