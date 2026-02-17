

## Ajustes Visuais do Dashboard e Sidebar -- 7 Itens

### Resumo
Simplificar o Dashboard principal, melhorar estilos de cards, adicionar logo na sidebar, criar card de clima (Open-Meteo), e mover KPIs especificos para os paineis das areas ADM e Hakuna.

---

### Arquivos Novos

**1. `src/components/dashboard/WeatherCard.tsx`**

Componente novo que consome a API Open-Meteo (fetch puro, sem dependencia).

- URL: `https://api.open-meteo.com/v1/forecast?latitude=-23.7745&longitude=-46.5633&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m&timezone=America/Sao_Paulo&forecast_days=4`
- useQuery com `staleTime: 30 * 60 * 1000` (30 min)
- Layout: card com gradiente azul (`bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-600/20`)
- Hoje: icone WMO, temperatura atual (text-3xl), descricao, umidade e vento
- Proximos 3 dias: grid-cols-3, dia da semana, icone, max/min, prob. chuva
- Mapeamento weathercode -> emoji/descricao (0: sol, 1-3: parcialmente nublado, 45-48: nevoa, 51-55: garoa, 61-65: chuva, 80-82: pancadas, 95-99: tempestade)
- Fallback: "Clima indisponivel" se erro

---

### Arquivos a Modificar

**2. `src/components/AppSidebar.tsx`**

- Importar `SidebarFooter` de `@/components/ui/sidebar`
- Adicionar `<SidebarFooter>` apos `</SidebarContent>` com a imagem dos Legendarios:
  - URL: `https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Logo%20Legendarios.png`
  - Classes: `h-16 w-auto mx-auto opacity-60`
  - Quando sidebar colapsada (usar contexto `useSidebar` se disponivel, ou classes `group-data-[collapsible=icon]:h-8`): mostrar menor

**3. `src/components/inicio/QuickActions.tsx` (Card da Area)**

- Alterar layout de horizontal (flex items-center gap-4) para vertical centralizado:
  - `flex flex-col items-center text-center p-6`
  - Logo: `h-16 w-16 object-contain mx-auto`
  - Nome da equipe: `text-xl font-bold text-center mt-2`
  - Texto "Acessar minha area": `text-sm text-gray-400 text-center mt-1`
- Adicionar `hover:scale-[1.02] transition-transform` (ja tem)

**4. `src/pages/Dashboard.tsx`**

Reestruturar o conteudo principal:

- **TopRealTimeCard**: Aplicar estilo verde:
  - Card: `bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600/30`
  - Titulo centralizado, "TOP" branco + "Real-Time" verde (`text-green-400`)
  - Icone Radio centralizado acima do titulo
  - Subtexto centralizado

- **KPIs simplificados** (grid 2x2 ou 4 colunas):
  - Total Participantes (manter)
  - Total Servidores (NOVO - query count servidores status=ativo)
  - Total Familias (manter `familiasFormadas`)
  - Avisos Recentes (NOVO - query count area_avisos recentes, ou usar dado do MuralAvisos)

- **REMOVER**:
  - Card "Contratos Assinados"
  - Card "Check-ins Realizados"
  - Card "Ergometricos Pendentes"
  - Card "Participantes por Faixa Etaria" (grafico)
  - Card "Status dos Participantes" (grafico) -- excluir completamente

- **WeatherCard**: Posicionar apos KPIs, antes do calendario

- **Avisos + Calendario lado a lado**: manter, mas calendario com fundo diferenciado

- **useDashboardData**: Adicionar query de servidores ativos (count) e avisos recentes (count). Os campos removidos (`contratosAssinados`, `checkinsRealizados`, `ergometricosPendentes`, `ageData`, `statusData`) podem ser mantidos no hook (serao usados nos paineis das areas), so nao exibi-los no Dashboard.

**5. `src/hooks/useDashboardData.ts`**

- Adicionar query para count de servidores ativos:
  ```
  supabase.from("servidores").select("*", { count: "exact", head: true }).eq("status", "ativo")
  ```
- Adicionar query para count de avisos recentes (ultimos 7 dias)
- Retornar `totalServidores` e `avisosRecentes` no objeto

**6. `src/components/inicio/CalendarioMensal.tsx`**

- Alterar o Card wrapper para usar fundo diferenciado:
  - `className="bg-slate-800/50 border-slate-600/30"`
- A query ja busca de area_eventos com join em areas, e ja usa CORES_EQUIPES -- ja mostra eventos de todas as areas
- Ja tem popover com badge colorido por area e horario -- nenhuma alteracao de query necessaria (Item 13 ja esta implementado)

**7. `src/pages/AreaPortal.tsx`**

Na aba "Painel":

- **Quando `decodedNome === "ADM"`**: Apos os cards existentes (grid 2x4), adicionar:
  - KpiCard "Contratos Assinados" (usar useDashboardData ou query local)
  - KpiCard "Check-ins Realizados"
  - Importar `useDashboardData` e usar `contratosAssinados`, `checkinsRealizados`, `totalInscritos`

- **Quando `decodedNome === "Hakuna"`**: Apos os cards existentes, adicionar:
  - KpiCard "Ergometricos Pendentes"
  - Grafico "Participantes por Faixa Etaria" (BarChart com recharts)
  - Importar `useDashboardData` e usar `ergometricosPendentes`, `ageData`

Nota: para nao duplicar queries, importar `useDashboardData` no AreaPortal e renderizar condicionalmente.

---

### Resumo de Alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| `src/components/dashboard/WeatherCard.tsx` | Novo | Card de clima Open-Meteo |
| `src/components/AppSidebar.tsx` | Alterar | Logo Legendarios no footer |
| `src/components/inicio/QuickActions.tsx` | Alterar | Layout centralizado |
| `src/pages/Dashboard.tsx` | Alterar | Simplificar KPIs, estilo TopRealTime, adicionar WeatherCard |
| `src/hooks/useDashboardData.ts` | Alterar | Adicionar totalServidores e avisosRecentes |
| `src/components/inicio/CalendarioMensal.tsx` | Alterar | Fundo diferenciado |
| `src/pages/AreaPortal.tsx` | Alterar | Cards movidos para paineis ADM e Hakuna |

### Detalhes Tecnicos

- Nenhuma migration necessaria
- Nenhuma dependencia nova (Open-Meteo e fetch puro)
- Open-Meteo nao requer chave de API
- O hook `useDashboardData` continua retornando todos os dados (contratosAssinados, ageData, etc.) para uso nos paineis das areas
- Tratamento de erro no WeatherCard: try/catch com fallback visual
