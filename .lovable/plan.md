

## Redesign: Dashboard para Tela "Inicio"

Transformar o Dashboard atual em uma tela de inicio profissional com logo, contagem regressiva, atalhos rapidos, mural de avisos, calendario e graficos.

---

### Arquivos a Criar

**1. `src/lib/coresEquipes.ts`**
Constante exportada `CORES_EQUIPES` com o mapa de cores das equipes. Funcao auxiliar `getTextColor(bg)` que retorna texto claro ou escuro conforme contraste. Reutilizavel em outras telas.

**2. `src/components/inicio/CountdownSection.tsx`**
Card com gradiente laranja/escuro. Contagem regressiva ate 02/04/2026 12:00 (Brasilia, UTC-3). `useEffect` + `setInterval` a cada segundo. Mostra "Faltam X semanas e X dias" + numeros grandes DD:HH:MM:SS. A partir de 02/04 12:00 ate 05/04 23:59: texto pulsante "O TOP JA COMECOU!". Apos 05/04: "TOP 1575 -- Finalizado".

**3. `src/components/inicio/QuickActions.tsx`**
4 cards clicaveis em grid. "Minha Area" busca `servidores` pelo email do auth para navegar para `/areas/{area_servico}`. "Meus Pedidos" navega para area com tab pedidos. "Calendario" faz scroll suave via `document.getElementById`. "Acompanhar TOP" com opacidade 50% e badge "Em breve", desabilitado.

**4. `src/components/inicio/MuralAvisos.tsx`**
Consulta `area_avisos` (5 mais recentes). Cada aviso com borda na cor da equipe (via `CORES_EQUIPES`), badge com nome da area, titulo, trecho truncado (2 linhas), data relativa (usando `date-fns` `formatDistanceToNow`). Fallback se vazio.

**5. `src/components/inicio/CalendarioMensal.tsx`**
Grade mensal 7 colunas (Dom-Sab). Navegacao mes anterior/proximo. Dia atual com borda laranja. Eventos da tabela `area_eventos` + eventos pre-cadastrados (15/02 "Abertura das Inscricoes", 02/04 "Inicio do TOP 1575"). Pontos coloridos por equipe nos dias com eventos. Hover/popover mostrando detalhes. Mobile: lista dos proximos 7 dias em vez de grade.

---

### Arquivos a Modificar

**6. `src/pages/Dashboard.tsx`**
Reescrever completamente. Nova estrutura na ordem:
1. Header com logo (img da URL do storage, ~120px) + titulo "TOP Manager" + subtitulo + texto descritivo. Horizontal desktop, empilhado mobile.
2. `<CountdownSection />`
3. KPI cards (manter logica existente do `useDashboardData`)
4. `<QuickActions />`
5. `<MuralAvisos />`
6. `<CalendarioMensal />`
7. Graficos existentes (faixa etaria + status donut)

Importar `useAuth` para obter email do usuario logado (passado ao QuickActions).

**7. `src/lib/auth.ts`**
Renomear item id=1 de "Dashboard" para "Inicio" e trocar icone de `LayoutDashboard` para `Home`.

---

### Detalhes Tecnicos

**Contagem regressiva:**
```text
const TARGET = new Date("2026-04-02T12:00:00-03:00").getTime();
const END = new Date("2026-04-05T23:59:59-03:00").getTime();

useEffect(() => {
  const id = setInterval(() => {
    const now = Date.now();
    if (now >= TARGET && now <= END) setPhase("started");
    else if (now > END) setPhase("finished");
    else setDiff(TARGET - now);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**Mural de Avisos - query:**
```text
supabase.from("area_avisos")
  .select("*, areas:area_id(nome, cor)")
  .order("created_at", { ascending: false })
  .limit(5)
```

Nota: a tabela `area_avisos` tem `area_id` que referencia `areas`. Se a FK nao existir, buscar areas separadamente e fazer join local pelo `area_id`.

**Calendario - query:**
```text
supabase.from("area_eventos")
  .select("*, areas:area_id(nome, cor)")
  .gte("data_inicio", startOfMonth)
  .lte("data_inicio", endOfMonth)
```

Eventos pre-cadastrados adicionados em codigo (nao SQL):
```text
const EVENTOS_FIXOS = [
  { data_inicio: "2026-02-15", titulo: "Abertura das Inscricoes", area: "ADM" },
  { data_inicio: "2026-04-02", titulo: "Inicio do TOP 1575", area: "Coordenacao Geral" },
];
```

**Quick Actions - busca de area:**
```text
supabase.from("servidores")
  .select("area_servico")
  .eq("email", profile.email)
  .maybeSingle()
```

**Data relativa:**
```text
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
formatDistanceToNow(new Date(aviso.created_at), { addSuffix: true, locale: ptBR })
```

**Responsividade:**
- Header: `flex-col md:flex-row`
- KPIs: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- Quick Actions: `grid-cols-2 md:grid-cols-4`
- Calendario: grade completa desktop, lista mobile via `useIsMobile()`
- Graficos: `grid-cols-1 md:grid-cols-2`

---

### Resumo

- **Arquivos criados:** 5 (coresEquipes.ts, CountdownSection.tsx, QuickActions.tsx, MuralAvisos.tsx, CalendarioMensal.tsx)
- **Arquivos modificados:** 2 (Dashboard.tsx, auth.ts)
- **Nenhuma alteracao no banco**
- **Nenhuma dependencia nova** (date-fns ja instalado)

