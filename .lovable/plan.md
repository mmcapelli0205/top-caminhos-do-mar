

## Dashboard Completo com KPIs, Cards e Graficos

### Resumo
Construir a pagina Dashboard com dados reais do Supabase, incluindo 4 KPI cards, 2 cards de resumo e 2 graficos (barra e donut). Tudo responsivo e com loading skeletons.

### Estrutura Visual

```text
+--Desktop Layout------------------------------------------+
| [Inscritos] [Contratos] [Ergometricos] [Check-ins]       |
| [Familias Formadas         ] [Balanco Financeiro        ]|
| [Grafico Faixa Etaria      ] [Grafico Status            ]|
+----------------------------------------------------------+

+--Mobile Layout----+
| [Inscritos       ]|
| [Contratos       ]|
| [Ergometricos    ]|
| [Check-ins       ]|
| [Familias        ]|
| [Balanco         ]|
| [Grafico Etaria  ]|
| [Grafico Status  ]|
+-------------------+
```

### Detalhes Tecnicos

**Arquivo modificado:** `src/pages/Dashboard.tsx`

**Dados buscados (3 queries paralelas com react-query):**
1. `participantes` — campos: status, contrato_assinado, checkin_realizado, ergometrico_status, data_nascimento, familia_id, valor_pago
2. `despesas` — campo: valor
3. `familias` — contagem total

**KPI Cards (linha 1, grid 1-4 colunas):**
1. Total Inscritos — count onde status != 'cancelado' (icone Users, borda laranja)
2. Contratos Assinados — "X/Y (Z%)" onde contrato_assinado = true (icone FileCheck, borda verde)
3. Ergometricos Pendentes — count onde ergometrico_status = 'pendente' E idade >= 40 (calculada a partir de data_nascimento). Icone AlertTriangle, borda vermelha se > 0
4. Check-ins Realizados — "X/Y (Z%)" onde checkin_realizado = true (icone QrCode, borda azul)

**Cards resumo (linha 2, grid 2 colunas):**
1. Familias Formadas — count distinct familia_id nao-null + "Y participantes alocados" (icone UsersRound)
2. Balanco Financeiro — sum(valor_pago) vs sum(valor despesas), diferenca verde/vermelha (icone DollarSign)

**Graficos (linha 3, grid 2 colunas) usando recharts:**
1. BarChart — Faixas etarias (18-30, 31-40, 41-50, 51-60, 60+) calculadas de data_nascimento
2. PieChart (donut) — Status dos participantes com cores: inscrito=amarelo, confirmado=verde, cancelado=vermelho

**Loading:** Skeleton placeholders do shadcn/ui enquanto dados carregam

**Estilo:** Cards com classes do tema (bg-card, border-border, rounded-lg). Cores de destaque via Tailwind usando os tokens existentes do tema escuro.

### Sem alteracoes no banco
Todas as queries usam tabelas existentes via Supabase client. Nenhuma migracao necessaria.
