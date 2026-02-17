

## 3 Ajustes Rapidos

### Ajuste 1: Legenda do Grafico de Despesas por Categoria (ResumoSection)

**Arquivo**: `src/components/financeiro/ResumoSection.tsx`

**Problema**: A legenda (badges abaixo do PieChart) filtra categorias usando o array fixo `ALL_CATEGORIAS` (linhas 32-38, 112-114). Categorias como "Obrigatorio Global" e "Medicamentos" nao estao nesse array, entao aparecem no grafico mas nao na legenda.

**Correcao**: Substituir a logica de `categoryBadges` para usar diretamente os dados do `pieData` (que contem TODAS as categorias com despesas), sem filtrar por `ALL_CATEGORIAS`. Cada badge recebe uma cor indexada pela posicao no array pieData.

```
// Antes (filtra por ALL_CATEGORIAS):
const categoryBadges = ALL_CATEGORIAS
  .map((cat, i) => ({ cat, value: catMap.get(cat) ?? 0, colorIdx: i }))
  .filter((c) => c.value > 0);

// Depois (mostra TODAS as categorias com despesa):
const categoryBadges = pieData.map((d, i) => ({
  cat: d.name,
  value: d.value,
  colorIdx: i,
}));
```

A `div` com `flex-wrap` ja existe (linha 257), entao categorias extras quebram em novas linhas naturalmente.

---

### Ajuste 2: Default Tab = "painel" para todos

**Arquivo**: `src/pages/AreaPortal.tsx`

**Problema**: Linha 142 define `const defaultTab = cargo === "servidor" ? "mural" : "painel"`, fazendo servidores comuns cairem no Mural.

**Correcao**: Alterar para `const defaultTab = "painel"` — todos os usuarios abrem no Painel.

---

### Ajuste 3: Botao Relatorio Consolidado no Resumo

**Arquivo**: `src/components/financeiro/ResumoSection.tsx`

**Problema**: O botao "Relatorio Consolidado" so existe na aba Despesas.

**Correcao**: 
- Importar `RelatorioConsolidado` e `BarChart3` no `ResumoSection`
- Adicionar estado `showRelatorio`
- Se `showRelatorio` for true, renderizar `<RelatorioConsolidado onBack={() => setShowRelatorio(false)} />`
- Adicionar botao "Relatorio Consolidado" ao lado do botao "Exportar PDF" no header (linha 157-162)
- Manter o botao existente em DespesasSection (nao remover)

O ResumoSection passara a ter dois botoes no header:
- "Exportar PDF" (ja existe)
- "Relatorio Consolidado" (novo)

---

### Resumo de Alteracoes

| Arquivo | Alteracao |
|---|---|
| `src/components/financeiro/ResumoSection.tsx` | Corrigir legenda + adicionar botao Relatorio |
| `src/pages/AreaPortal.tsx` | Mudar defaultTab para "painel" |
| `src/components/financeiro/DespesasSection.tsx` | Nenhuma (manter botao existente) |

Nenhuma migration, nenhuma dependencia nova.
