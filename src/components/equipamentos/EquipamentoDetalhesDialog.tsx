import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Package, History, Camera } from "lucide-react";

interface Equipamento {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  origem?: string | null;
  proprietario?: string | null;
  quantidade?: number | null;
  estado?: string | null;
  foto_url?: string | null;
  valor_estimado?: number | null;
  observacoes?: string | null;
  created_at?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento: Equipamento;
}

export function EquipamentoDetalhesDialog({ open, onOpenChange, equipamento }: Props) {
  const { data: historico = [] } = useQuery({
    queryKey: ["equipamento-historico", equipamento.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamento_emprestimos")
        .select("*")
        .eq("equipamento_id", equipamento.id)
        .order("data_retirada", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const origemLabel: Record<string, string> = { proprio: "Próprio", emprestado: "Emprestado", alugado: "Alugado" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {equipamento.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalhes">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({historico.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-4 mt-4">
            {equipamento.foto_url && (
              <img src={equipamento.foto_url} alt={equipamento.nome} className="w-full max-h-48 object-cover rounded-lg border" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-muted-foreground">Categoria:</span> <span>{equipamento.categoria}</span></div>
              <div><span className="font-medium text-muted-foreground">Origem:</span> <span>{origemLabel[equipamento.origem || "proprio"]}</span></div>
              {equipamento.proprietario && <div><span className="font-medium text-muted-foreground">Proprietário:</span> <span>{equipamento.proprietario}</span></div>}
              <div><span className="font-medium text-muted-foreground">Quantidade:</span> <span>{equipamento.quantidade}</span></div>
              <div><span className="font-medium text-muted-foreground">Estado:</span> <Badge variant="outline">{equipamento.estado}</Badge></div>
              <div><span className="font-medium text-muted-foreground">Valor Estimado:</span> <span>R$ {(equipamento.valor_estimado || 0).toFixed(2)}</span></div>
            </div>
            {equipamento.descricao && (
              <div className="text-sm"><span className="font-medium text-muted-foreground">Descrição:</span> <p className="mt-1">{equipamento.descricao}</p></div>
            )}
            {equipamento.observacoes && (
              <div className="text-sm"><span className="font-medium text-muted-foreground">Observações:</span> <p className="mt-1">{equipamento.observacoes}</p></div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum empréstimo registrado</p>
            ) : (
              <div className="space-y-4">
                {historico.map((h) => (
                  <div key={h.id} className="border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{h.responsavel_nome}</span>
                      <Badge variant={h.devolvido ? "secondary" : "default"} className={h.devolvido ? "" : "bg-orange-500 text-white"}>
                        {h.devolvido ? "Devolvido" : "Em uso"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>Retirada: {h.data_retirada ? format(new Date(h.data_retirada), "dd/MM/yyyy HH:mm") : "—"}</div>
                      <div>Devolução: {h.data_devolucao ? format(new Date(h.data_devolucao), "dd/MM/yyyy HH:mm") : "—"}</div>
                      <div>Estado saída: <Badge variant="outline" className="ml-1">{h.estado_saida}</Badge></div>
                      {h.estado_devolucao && <div>Estado devolução: <Badge variant="outline" className="ml-1">{h.estado_devolucao}</Badge></div>}
                    </div>
                    {(h.foto_saida_url || h.foto_devolucao_url) && (
                      <div className="flex gap-3">
                        {h.foto_saida_url && (
                          <div className="text-center">
                            <img src={h.foto_saida_url} alt="Saída" className="w-16 h-16 rounded object-cover border" />
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Camera className="h-3 w-3" /> Saída</span>
                          </div>
                        )}
                        {h.foto_devolucao_url && (
                          <div className="text-center">
                            <img src={h.foto_devolucao_url} alt="Devolução" className="w-16 h-16 rounded object-cover border" />
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Camera className="h-3 w-3" /> Devolução</span>
                          </div>
                        )}
                      </div>
                    )}
                    {h.observacoes && <p className="text-muted-foreground italic">{h.observacoes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
