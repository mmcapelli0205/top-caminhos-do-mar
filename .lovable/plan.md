

## Sistema de Pedidos/Orcamentos - Plano de Implementacao

Este e um sistema completo de solicitacao, orcamento, aprovacao e compra de materiais por area de servico, com integracao automatica ao modulo Financeiro.

---

### Problema com tipos TypeScript

As tabelas `pedidos_orcamentos` e `categorias_despesas` existem no Supabase mas **nao estao no arquivo de tipos gerado** (`src/integrations/supabase/types.ts`). Como nao podemos editar esse arquivo diretamente, vou criar interfaces manuais para essas tabelas.

---

### Arquivos a criar

**1. `src/types/pedidos.ts`**
Definicoes de tipos manuais para `pedidos_orcamentos` e `categorias_despesas`, ja que nao estao no arquivo de tipos gerado.

**2. `src/components/area/AreaPedidos.tsx`**
Componente completo de pedidos para cada area, contendo:
- Listagem de pedidos filtrada pela area atual (tabela desktop / cards mobile)
- Badges coloridos por status (Aguardando=amarelo, Em Orcamento=azul, Aprovado=verde, Reprovado=vermelho, Comprado=cinza)
- Filtro por status
- Botao "+ Novo Pedido" abrindo modal com campos: area (readonly), responsavel (dropdown servidores da area), categoria (da tabela categorias_despesas), nome do item, quantidade, valor unitario estimado, valor total calculado, finalidade
- Edicao permitida apenas quando status != "comprado"

**3. `src/components/area/AdmPedidosDashboard.tsx`**
Painel exclusivo da area ADM com:
- Cards de contagem por status (aguardando, em_orcamento, aprovados pendentes, comprados este mes, urgentes >7 dias sem orcamento)
- Card "urgente" com animacao pulsante vermelha
- Lista completa de TODOS os pedidos de todas as areas
- Filtros por area, categoria, status
- Modal de gestao com 3 secoes:
  - Secao 1: Dados do pedido (readonly)
  - Secao 2: Orcamentos (3 fornecedores com valores) - oculta se `is_obrigatorio_global = true`
  - Secao 3: Decisao (Aprovar/Reprovar) e Compra (fornecedor aprovado, valor pago, quantidade, data, upload comprovante/NF, checkbox "Comprado")
- Ao marcar "Comprado": cria registro automatico na tabela `despesas` e marca `migrado_despesas = true`

---

### Arquivos a modificar

**4. `src/pages/AreaPortal.tsx`**
- Importar `AreaPedidos` e `AdmPedidosDashboard`
- Adicionar aba "Pedidos" no TabsList (visivel para todas as areas)
- Para a area "ADM": renderizar `AdmPedidosDashboard` no topo da aba Painel (antes dos cards existentes)
- Para todas as areas: renderizar `AreaPedidos` na aba "Pedidos"

**5. `src/components/financeiro/DespesasSection.tsx`**
- Substituir a constante hardcoded `CATEGORIAS` por uma query a `categorias_despesas`
- Remover categorias antigas (Fardas, Gorras, Pins)
- O dropdown de filtro e o dropdown do modal usarao dados dinamicos do banco

---

### Detalhes Tecnicos

**Query de categorias (usado em DespesasSection e AreaPedidos):**
```text
supabase.from("categorias_despesas")
  .select("id, nome")
  .eq("ativo", true)
  .order("ordem")
```

**Query de servidores da area (para dropdown de responsavel):**
```text
supabase.from("servidores")
  .select("id, nome, cargo_area")
  .eq("area_servico", areaNome)
  .order("nome")
```

**Migracao automatica para despesas ao marcar "Comprado":**
```text
await supabase.from("despesas").insert({
  item: pedido.nome_item,
  descricao: pedido.nome_item,
  categoria: pedido.categoria,
  quantidade: pedido.quantidade_comprada,
  valor_unitario: pedido.valor_pago / pedido.quantidade_comprada,
  valor: pedido.valor_pago,
  fornecedor: pedido.fornecedor_aprovado,
  data_aquisicao: pedido.data_compra,
  comprovante_url: pedido.comprovante_url || pedido.comprovante_nf_url,
  auto_calculado: false,
});
await supabase.from("pedidos_orcamentos")
  .update({ status: "comprado", migrado_despesas: true })
  .eq("id", pedido.id);
```

**Acesso via Supabase sem tipos gerados:**
Como as tabelas nao estao nos tipos gerados, usaremos casting manual nos retornos das queries e criaremos interfaces locais em `src/types/pedidos.ts`.

**Responsividade:**
- Desktop: tabelas com todas as colunas
- Mobile: cards empilhados (mesmo padrao usado em DespesasSection, Servidores, etc.)

**Arquivos criados:** 3
**Arquivos modificados:** 2
**Nenhuma migration necessaria** (tabelas ja existem)

