export interface PedidoOrcamento {
  id: string;
  area_solicitante: string;
  responsavel_id: string | null;
  responsavel_nome: string;
  categoria: string;
  nome_item: string;
  quantidade: number;
  valor_unitario_estimado: number | null;
  valor_total_estimado: number | null;
  finalidade: string | null;
  status: string;
  data_solicitacao: string | null;
  orcamento_1_fornecedor: string | null;
  orcamento_1_valor: number | null;
  orcamento_2_fornecedor: string | null;
  orcamento_2_valor: number | null;
  orcamento_3_fornecedor: string | null;
  orcamento_3_valor: number | null;
  fornecedor_aprovado: string | null;
  valor_pago: number | null;
  quantidade_comprada: number | null;
  data_compra: string | null;
  comprovante_url: string | null;
  comprovante_nf_url: string | null;
  comprado: boolean | null;
  migrado_despesas: boolean | null;
  is_obrigatorio_global: boolean | null;
  aprovado_por: string | null;
  motivo_reprovacao: string | null;
  top_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  ativo: boolean | null;
  ordem: number | null;
  created_at: string | null;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  aguardando: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  em_orcamento: { label: "Em Orçamento", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  aprovado: { label: "Aprovado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  reprovado: { label: "Reprovado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  comprado: { label: "Comprado", color: "bg-muted text-muted-foreground border-muted" },
};

export const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
