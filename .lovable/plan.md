
# Parte 1 — Permissões do Menu Principal por Área

## Análise do Estado Atual

O `src/lib/permissoes.ts` **já existe** com permissões para as abas do Portal de Área (Parte 2). Para não conflitar, as permissões do menu principal serão adicionadas neste mesmo arquivo como uma nova seção exportada — mantendo a separação de contextos mas o arquivo unificado.

A área do usuário vem de `servidores.area_servico` (consultado por email) — padrão já utilizado em `Financeiro.tsx`, `CheckIn.tsx` e `TopRealTime.tsx`. Criaremos um hook `useAreaServico` para reutilizar essa lógica.

---

## Estratégia de Implementação

### Fase 1 — Arquivo de Permissões do Menu (`src/lib/permissoes.ts` — adicionar ao existente)

Adicionar ao arquivo existente:

```typescript
// ============================================
// Permissões do Menu Principal por Área
// ============================================

export type NivelAcesso = "V" | "E" | "B" | null;

export interface PermissoesMenu {
  // Participantes
  participantes_listar: NivelAcesso;
  participantes_buscar: NivelAcesso;
  participantes_filtros: NivelAcesso;
  participantes_importar: NivelAcesso;
  participantes_exportar: NivelAcesso;
  participantes_novo: NivelAcesso;
  participantes_visualizar: NivelAcesso;
  participantes_editar: NivelAcesso;
  // Servidores
  servidores_cards: NivelAcesso;
  servidores_listar: NivelAcesso;
  servidores_filtros: NivelAcesso;
  servidores_exportar: NivelAcesso;
  servidores_importar: NivelAcesso;
  servidores_novo: NivelAcesso;
  servidores_visualizar: NivelAcesso;
  servidores_editar: NivelAcesso;
  servidores_excluir: NivelAcesso;
  // Financeiro
  financeiro_resumo: NivelAcesso;
  // Check-in
  checkin_pulseiras: NivelAcesso;
  checkin_realizar: NivelAcesso;
  checkin_consultar: NivelAcesso;
  checkin_gestao: NivelAcesso;
  // Equipamentos
  equipamentos_listar: NivelAcesso;
  equipamentos_novo: NivelAcesso;
  equipamentos_filtros: NivelAcesso;
  // Artes & Docs
  artes_visualizar: NivelAcesso;
  artes_upload: NivelAcesso;
  artes_download: NivelAcesso;
  artes_editar: NivelAcesso;
  artes_excluir: NivelAcesso;
  // TOPs
  tops_edicoes: NivelAcesso;
  tops_whatsapp: NivelAcesso;
  tops_templates: NivelAcesso;
  // Configurações
  config_listar: NivelAcesso;
  config_novo: NivelAcesso;
  config_editar: NivelAcesso;
  // TOP Real Time
  realtime_visualizar: NivelAcesso;
  realtime_iniciar: NivelAcesso;
  realtime_pular: NivelAcesso;
  // Mapa
  mapa_visualizar: NivelAcesso;
  mapa_compartilhar_gps: NivelAcesso;
  // Aprovações
  aprovacoes: NivelAcesso;
  // Menu visibility (booleans)
  menu_participantes: boolean;
  menu_servidores: boolean;
  menu_financeiro: boolean;
  menu_checkin: boolean;
  menu_equipamentos: boolean;
  menu_artes: boolean;
  menu_tops: boolean;
  menu_config: boolean;
  menu_realtime: boolean;
  menu_mapa: boolean;
  menu_aprovacoes: boolean;
}

export const PERMISSOES_MENU: Record<string, PermissoesMenu> = { /* mapa completo */ };

export function getPermissoesMenu(area: string): PermissoesMenu;
export function canAccessMenu(area: string, funcionalidade: keyof PermissoesMenu): boolean;
export function canEditMenu(area: string, funcionalidade: keyof PermissoesMenu): boolean;
export function isBlockedMenu(area: string, funcionalidade: keyof PermissoesMenu): boolean;
```

---

### Fase 2 — Hook `useAreaServico` (`src/hooks/useAreaServico.ts` — criar)

Centralizar a busca da área do servidor logado:

```typescript
export function useAreaServico() {
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["area-servico", profile?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico, cargo_area")
        .eq("email", profile!.email)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });
  return { areaServico: data?.area_servico ?? null, cargoArea: data?.cargo_area ?? null, isLoading };
}
```

---

### Fase 3 — Sidebar dinâmica (`src/components/AppSidebar.tsx`)

Em vez de `getVisibleMenuItems(cargo, podeAprovar)`, o sidebar passará a usar `getPermissoesMenu(area)` para controlar a visibilidade de cada item com base na área. O cargo `"diretoria"` (role) mantém acesso total como hoje.

**Lógica de prioridade:**
1. Se `role === "diretoria"` → usa as permissões da área `"Diretoria"` 
2. Se `areaServico` é conhecido → usa `PERMISSOES_MENU[areaServico]`
3. Fallback → itens básicos (Início, Artes, Mapa)

O componente passará a receber a `area` como prop ou buscar via hook internamente.

---

### Fase 4 — Integração nas Páginas

#### `Participantes.tsx`
- Esconder botão "Importar da TicketAndGo" se `participantes_importar === "B"`
- Esconder botão "CSV" se `participantes_exportar === "B"` 
- Esconder botão "Novo Participante" se `participantes_novo === "B"` ou `null`
- Esconder barra de busca se `participantes_buscar === null`
- Botão editar em linha → escondido se `participantes_editar !== "E"`
- Seleção em lote / exclusão → escondida se sem permissão

#### `Servidores.tsx`
- Cards de área → escondidos se `servidores_cards === "B"`
- Botões de importar/exportar → condicionais
- Botão "Novo Servidor" → condicional
- Botões editar/excluir por linha → condicionais

#### `Financeiro.tsx`
- Já tem guard `temAcesso` baseado em area/role. Expandir para incluir as áreas com permissão `"V"` (atualmente Hakuna acessa com `"E"` no novo mapa)
- Hakuna: acesso com `financeiro_resumo === "E"` (apenas a aba Resumo das Taxas, conforme especificação)

**Nota importante:** O Financeiro da Hakuna dá acesso apenas ao campo `financeiro_resumo` (taxas de saúde). A especificação diz `financeiro_resumo: E`, mas as demais sub-seções (`financeiro_taxas`, `financeiro_relatorio`, etc.) são `"B"`. O guard atual vai mudar para mostrar o menu financeiro para Hakuna mas restringir internamente as abas visíveis.

#### `CheckIn.tsx`
- Expandir a lógica `isAdmin` atual para incluir: Segurança, Eventos (para pulseiras/realizar/gestão)
- Hakuna → já tem acesso a "consultar"
- Diretoria → acesso a "gestao" apenas
- Outros → sem acesso (redirect)

#### `Equipamentos.tsx`
- Esconder botão "Novo" se `equipamentos_novo === "B"` 
- Esconder filtros se `equipamentos_filtros === null`
- Para Comunicação: `listar: V` (read-only, sem botão novo)

#### `ArtesEDocs.tsx`
- Botão "Novo" / upload → mostrar apenas se `artes_upload === "E"`
- Botões editar/excluir → condicionais por `artes_editar` e `artes_excluir`

#### `Tops.tsx`
- Esconder aba "Edições" se `tops_edicoes === "B"`
- Esconder aba "WhatsApp" se `tops_whatsapp === "B"`
- Aba "Templates" → apenas DOC e Diretoria

#### `Configuracoes.tsx`
- Já restringe a `isDiretoria`. Expandir para DOC ter acesso parcial:
  - DOC: pode listar e criar, mas não editar ou aprovar usuários

#### `TopRealTime.tsx`
- Botões INICIAR e PULAR → condicional: `canControl = area === "ADM" && cargoArea inclui "Coord 01"` (lógica já parcialmente implementada)
- Expandir `canView` para incluir todas as áreas (atualmente só coord01/diretoria/ADM)

---

## Arquivos a Criar/Modificar

| Arquivo | Operação | O que muda |
|---|---|---|
| `src/lib/permissoes.ts` | Modificar | Adicionar `NivelAcesso`, `PermissoesMenu`, `PERMISSOES_MENU`, funções utilitárias de menu |
| `src/hooks/useAreaServico.ts` | Criar | Hook centralizando busca de `area_servico` e `cargo_area` do servidor logado |
| `src/components/AppSidebar.tsx` | Modificar | Usar `PERMISSOES_MENU[area].menu_*` para visibilidade dos itens |
| `src/components/AppLayout.tsx` | Modificar | Passar `areaServico` para `AppSidebar` |
| `src/pages/Participantes.tsx` | Modificar | Condicionar botões de ação (importar, exportar, novo, editar, excluir) |
| `src/pages/Servidores.tsx` | Modificar | Condicionar cards, botões de importar/novo/editar/excluir |
| `src/pages/Financeiro.tsx` | Modificar | Expandir guard para Hakuna (resumo de taxas); restringir abas internas |
| `src/pages/CheckIn.tsx` | Modificar | Expandir lógica de acesso para Segurança/Eventos/Diretoria |
| `src/pages/Equipamentos.tsx` | Modificar | Condicionar botão "Novo" e permissões de edição |
| `src/pages/ArtesEDocs.tsx` | Modificar | Condicionar upload/edição/exclusão |
| `src/pages/Tops.tsx` | Modificar | Condicionar abas por área (DOC vs outros) |
| `src/pages/Configuracoes.tsx` | Modificar | Expandir acesso para DOC (listar/criar) |
| `src/pages/TopRealTime.tsx` | Modificar | Expandir `canView` para todas as áreas; manter `canControl` restrito a ADM Coord 01 |

---

## Detalhes Críticos de Implementação

### Como a área é identificada

O `role` do `useAuth()` define o nível global (`"diretoria"`, `"coordenacao"`, `"servidor"`, etc.), mas **não** identifica a área. A área vem de `servidores.area_servico`, consultada pelo email do usuário logado.

- `role === "diretoria"` → usa permissões de `"Diretoria"` no mapa
- `role === "coordenacao"` ou `"sombra"` → usa `areaServico` para buscar no mapa
- Fallback quando área não encontrada → permissões mínimas (apenas Início, Artes, Mapa)

### Permissões especiais

**Hakuna — Financeiro:** Apenas a aba de "Resumo" (taxas Hakuna) é acessível. As demais sub-seções ficam ocultas. O `menu_financeiro: true` aparece na sidebar, mas internamente o componente restringe ao resumo.

**DOC — Configurações:** Pode listar e criar TOPs, mas não editar usuários nem configurações sensíveis. A aba de configurações aparece mas com escopo limitado.

**ADM — TOP Real Time (Regra Especial):** 
- Todos os cargos ADM: visualizar ✅
- Apenas `cargo_area` contendo "Coord 01" na área ADM: pode INICIAR e PULAR
- O check já existe parcialmente em `TopRealTime.tsx`:
  ```typescript
  const isAdmCoord = servidor?.area_servico === "ADM" && 
    servidor?.cargo_area?.toLowerCase().includes("coordenador");
  const canControl = isDiretoria || isAdmCoord;
  ```
  Ajustar para verificar especificamente "Coord 01" ou "Coordenador 01".

**Voz e Intercessão — Mapa GPS:** Campo `mapa_compartilhar_gps: "E"` que habilita um botão de compartilhamento de localização GPS no `KmzMapa.tsx`.

### Ordem de implementação
1. Adicionar tipos e mapa `PERMISSOES_MENU` em `src/lib/permissoes.ts`
2. Criar `src/hooks/useAreaServico.ts`
3. Modificar `AppSidebar.tsx` + `AppLayout.tsx` 
4. Modificar páginas na ordem: `Participantes` → `Servidores` → `Financeiro` → `CheckIn` → `Equipamentos` → `ArtesEDocs` → `Tops` → `Configuracoes` → `TopRealTime`

Nenhuma migration SQL necessária. Nenhuma dependência nova.
