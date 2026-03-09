

## Plan

### MUDANCA 1 — ReceitaSection: Collapsible Sections

**File:** `src/components/financeiro/ReceitaSection.tsx`

- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible` and `ChevronDown` from lucide-react.
- Add three state booleans: `openParticipantes`, `openServidores`, `openDoacoes` (all default `false`).
- Wrap each of the three sections (Participantes, Servidores, Doacoes) in a `Collapsible` component:
  - The header becomes a `CollapsibleTrigger` showing: title + total value + count + chevron icon (rotates when open).
  - The stats cards grid and the list/table go inside `CollapsibleContent`.
  - For Doacoes, the "Nova Doacao" button stays visible in the header.

### MUDANCA 2 — AdmPedidosDashboard: Doado & Pago por Terceiro

**File:** `src/types/pedidos.ts`
- Add fields to `PedidoOrcamento` interface: `is_doado`, `doado_por`, `is_pago_por_terceiro`, `pago_por` (all nullable).

**File:** `src/components/area/AdmPedidosDashboard.tsx`

**State additions (in modal):**
- `isDoado` (boolean), `doadoPor` (string), `isPagoPorTerceiro` (boolean), `pagoPor` (string)
- Initialize from `selectedPedido` in `openGestao`.

**UI additions** — Inside the "Decisao e Compra" section, after the approve/reject buttons and before the purchase fields, add two blocks:

1. **Bloco Doacao**: Checkbox "Item Doado". When checked, show `Input` for "Doado por" and disable the "Pago por terceiro" checkbox. When unchecked, hide the input.

2. **Bloco Pago por Terceiro**: Checkbox "Pago por terceiro (gera reembolso)". When checked, show `Input` for "Pago por" and disable the "Doado" checkbox. When unchecked, hide the input.

Both blocks only visible when status is `aprovado` and not yet `comprado`.

**Save logic** — In `marcarComprado` mutation:
- Include `is_doado`, `doado_por`, `is_pago_por_terceiro`, `pago_por` in the pedido update.
- If `isDoado`: insert into `doacoes` with `tipo='material'`, `doador=doadoPor`, `valor=selectedPedido.valor_total_estimado`, `pedido_id=selectedPedido.id`, `item_descricao=selectedPedido.nome_item`, `top_id=selectedPedido.top_id`.
- If `isPagoPorTerceiro`: insert into `reembolsos` with `nome_pagador=pagoPor`, `descricao=selectedPedido.nome_item`, `valor=valorPago || selectedPedido.valor_total_estimado`, `area=selectedPedido.area_solicitante`, `pedido_id=selectedPedido.id`, `top_id=selectedPedido.top_id`, `status='pendente'`.
- Also invalidate `fin-doacoes-lista` queries on success.

No database migrations needed — all columns and tables already exist.

