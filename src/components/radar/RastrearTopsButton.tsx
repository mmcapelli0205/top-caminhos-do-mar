import { Loader2, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRastrearTops } from "@/hooks/useRadarLegendarios";
import { useToast } from "@/hooks/use-toast";

export function RastrearTopsButton() {
  const { mutate, isPending } = useRastrearTops();
  const { toast } = useToast();

  const handleClick = () => {
    mutate(undefined, {
      onSuccess: (data: any) => {
        toast({
          title: "Rastreamento concluído",
          description: `${data?.total_encontrados || 0} TOPs encontrados`,
        });
      },
      onError: (err) => {
        toast({
          title: "Erro no rastreamento",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="bg-[#c9a84c] hover:bg-[#b8963e] text-black font-semibold"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Radar className="h-4 w-4 mr-2" />
      )}
      {isPending ? "Rastreando..." : "Rastrear TOPs"}
    </Button>
  );
}
