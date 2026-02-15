

## Etapa 3: Dashboard Financeiro ADM + Relatorio Consolidado + Controle de Acesso

Esta etapa envolve 3 partes interligadas: remover financeiro do dashboard principal e bloquear acesso, adicionar dashboard financeiro profissional no ADM, e criar relatorio consolidado de despesas.

---

### Alteracao no Banco de Dados

Adicionar coluna `acesso_financeiro` na tabela `user_profiles`:

```text
ALTER TABLE public.user_profiles ADD COLUMN acesso_financeiro BOOLEAN DEFAULT false;
```

Usar a tabela `user_profiles` (ja existente) em vez de `user_roles` para manter consistencia com o padrao do campo `pode_aprovar`.

---

### Arquivos a Modificar

**1. `src/pages/Dashboard.tsx`**
- Remover o card "Balanco Financeiro" (linhas 109-128)
- Remover imports `DollarSign` e dados financeiros (`receita`, `totalDespesas`, `balanco`)
- O grid "Summary Row" passa a ter apenas o card "Familias Formadas" em largura total

**2. `src/hooks/useDashboardData.ts`**
- Remover query de despesas (`dashboard-despesas`)
- Remover campos `receita`, `totalDespesas`, `balanco` do retorno
- Manter apenas KPIs operacionais

**3. `src/pages/Financeiro.tsx`**
- Adicionar verificacao de acesso no componente
- Usar `useAuth()` para obter `profile` e `role`
- Verificar: `role === "diretoria"` OU `profile?.area_preferencia === "ADM"` OU `profile?.acesso_financeiro === true`
- Se nao tem acesso: renderizar tela com icone de cadeado (`Lock` do lucide) e mensagem "Acesso restrito a Diretoria e equipe ADM"
- Buscar tambem na tabela `servidores` se o usuario logado tem `area_servico = "ADM"` como verificacao adicional

**4. `src/pages/Aprovacoes.tsx`**
- Na tabela desktop: adicionar coluna "Financeiro" com Switch para usuarios aprovados
- No card mobile: adicionar toggle "Acesso Financeiro" abaixo do toggle "Pode aprovar"
- Ao mudar: `supabase.from("user_profiles").update({ acesso_financeiro: !current }).eq("id", userId)`
- Atualizar `UserProfile` type em `useAuth.ts` para incluir `acesso_financeiro`

**5. `src/hooks/useAuth.ts`**
- Adicionar `acesso_financeiro: boolean | null` ao interface `UserProfile`

---

### Arquivos a Criar

**6. `src/components/area/AdmFinanceiroDashboard.tsx`**
Componente profissional de dashboard financeiro para o painel ADM. Contera:

- **Cards de resumo** (5 cards em linha): Receita Total (verde), Despesa Total (vermelho), Saldo (verde/vermelho), Pedidos Pendentes (amarelo - soma valores estimados de pedidos nao comprados), Budget Comprometido (azul - saldo menos pedidos pendentes)
- **Grafico de despesas por categoria**: PieChart ou BarChart horizontal usando Recharts, cores diferentes por categoria
- **Mini tabela "Ultimas Despesas"**: 5 ultimas despesas com colunas Item, Categoria, Valor, Data. Link "Ver tudo" para `/financeiro`
- **Alertas**: Card vermelho pulsante se pedidos urgentes (>7 dias sem orcamento), card amarelo se despesas > 80% da receita

Queries:
```text
// Receita
supabase.from("participantes").select("valor_pago, status")
supabase.from("servidores").select("valor_pago")
supabase.from("doacoes").select("valor")
// Despesas
supabase.from("despesas").select("valor, categoria").eq("auto_calculado", false)
// Pedidos pendentes
supabase.from("pedidos_orcamentos").select("valor_total_estimado, status, data_solicitacao")
  .in("status", ["aguardando", "em_orcamento", "aprovado"])
// Ultimas despesas
supabase.from("despesas").select("*").eq("auto_calculado", false)
  .order("created_at", { ascending: false }).limit(5)
```

**7. `src/components/financeiro/RelatorioConsolidado.tsx`**
Componente de relatorio consolidado dentro da aba Despesas. Contera:

- **Cabecalho**: Titulo "Relatorio Consolidado de Despesas - TOP 1575", data de geracao, totais
- **Barra de filtros**: Categoria (multi-select), Faixa de valor (min-max), Data de compra (de-ate), botao "Limpar Filtros", botao "Exportar PDF" (jsPDF ja instalado), botao "Exportar CSV" (papaparse ja instalado, substitui Excel por simplicidade)
- **Tabela agrupada**: Colunas: Item, Categoria, Qtd, Valor Unitario, Valor Total, Fornecedor, Data da Compra. Agrupamento visual por categoria com subtotal. Linha de TOTAL GERAL no final. Ordenavel por coluna
- **Rodape**: Resumo por categoria com percentual sobre o total

Exportar PDF: usar jsPDF (ja instalado)
Exportar CSV/Excel: usar papaparse (ja instalado) para gerar CSV compativel com Excel

---

### Integracao no AreaPortal

**8. `src/pages/AreaPortal.tsx`**
- Importar `AdmFinanceiroDashboard`
- Dentro da aba "painel", quando `decodedNome === "ADM"`, adicionar `<AdmFinanceiroDashboard />` abaixo do `<AdmPedidosDashboard />`

---

### Integracao no DespesasSection

**9. `src/components/financeiro/DespesasSection.tsx`**
- Adicionar botao "Relatorio Consolidado" na barra de filtros
- Ao clicar, alternar entre a visualizacao normal de despesas e o componente `RelatorioConsolidado`
- Usar estado `showRelatorio` para controlar a exibicao

---

### Detalhes Tecnicos

**Verificacao de acesso ao Financeiro (`Financeiro.tsx`):**
```text
const { profile, role } = useAuth();
const { data: servidor } = useQuery({
  queryKey: ["fin-check-servidor", profile?.id],
  queryFn: async () => {
    const { data } = await supabase.from("servidores")
      .select("area_servico")
      .eq("email", profile!.email)
      .maybeSingle();
    return data;
  },
  enabled: !!profile?.email,
});

const temAcesso = role === "diretoria"
  || servidor?.area_servico === "ADM"
  || profile?.acesso_financeiro === true;
```

**Tela de bloqueio:**
```text
<div className="flex flex-col items-center justify-center py-20 space-y-4">
  <Lock className="h-16 w-16 text-muted-foreground" />
  <h2 className="text-xl font-bold">Acesso Restrito</h2>
  <p className="text-muted-foreground text-center max-w-md">
    Acesso restrito a Diretoria e equipe ADM. Solicite acesso ao seu coordenador.
  </p>
</div>
```

**Tipagem**: Adicionar `acesso_financeiro` ao tipo gerado sera feito automaticamente pela migration. Tambem atualizar a interface `UserProfile` em `useAuth.ts`.

**Dependencias**: Nenhuma nova dependencia necessaria. jsPDF e papaparse ja estao instalados.

---

### Resumo

- **Arquivos criados:** 2 (AdmFinanceiroDashboard.tsx, RelatorioConsolidado.tsx)
- **Arquivos modificados:** 7 (Dashboard.tsx, useDashboardData.ts, Financeiro.tsx, Aprovacoes.tsx, useAuth.ts, AreaPortal.tsx, DespesasSection.tsx)
- **1 alteracao no banco:** adicionar coluna `acesso_financeiro` em `user_profiles`
- **Nenhuma dependencia nova**

