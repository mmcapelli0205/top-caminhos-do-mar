
# Parte 2 — Permissões dos Portais por Cargo

## Contexto Atual

O `src/lib/permissoes.ts` já contém dois sistemas de permissão:
1. **Sistema legado** (`PERMISSOES` + `getPermissaoAba`) — por área+cargo enum (`coord_01`, etc.), usado pelo `usePermissoes` que compara IDs de servidor com os campos da tabela `areas` (coordenador_id, sombra_id, etc.). Retorna `NivelPermissao` (E/V/EP/A/X).
2. **Sistema novo** (`PERMISSOES_MENU` + `getPermissoesMenu`) — por área (string), retorna `NivelAcesso` (E/V/B/null).

O `AreaPortal.tsx` ainda usa o sistema legado via `usePermissoes(areaNome)`. A Parte 2 adicionará um **terceiro sistema** ao mesmo arquivo — `PERMISSOES_PORTAL` — mais granular, com permissões por ação (não só por aba), chaveado por `"Área_Cargo"` onde cargo é o texto exato de `servidores.cargo_area`.

## Estratégia: Compatibilidade Retroativa

O sistema legado `PERMISSOES` e o `usePermissoes` **não serão removidos** — continuam funcionando para sub-componentes que já recebem `canEdit` como prop simples. Apenas o `AreaPortal.tsx` será atualizado para usar o novo sistema para controlar visibilidade de abas e flags de edição passadas para os filhos.

## Mapeamento de Cargo

O hook `useAreaServico` já retorna `cargoArea` (texto de `servidores.cargo_area`). Os valores possíveis são: `"Coord 01"`, `"Coord 02"`, `"Coord 03"`, `"Sombra 01"`, `"Sombra 02"`, `"Sombra 03"`, `"Servidor"`, além de `"Diretor Espiritual"` (tratado separadamente).

A chave do mapa será: `"Hakuna_Coord 01"`, `"Segurança_Servidor"`, etc.

Para `role === "diretoria"`, usa-se `"Diretoria_Coord 01"` como chave (acesso máximo).

## Arquivos a Modificar

| Arquivo | Operação |
|---|---|
| `src/lib/permissoes.ts` | Adicionar `PermissoesPortal`, `PERMISSOES_PORTAL` (77 entradas), `getPermissoesPortal`, `canAccessPortal`, `canEditPortal` |
| `src/pages/AreaPortal.tsx` | Substituir `usePermissoes` por `useAreaServico` + `getPermissoesPortal` para controle de abas e permissões |

## Detalhes Técnicos

### 1. Adição ao `src/lib/permissoes.ts`

Adicionar ao final do arquivo:

```typescript
// ============================================
// Permissões dos Portais por Cargo
// ============================================

export interface PermissoesPortal {
  // Painel
  painel_cards: NivelAcesso;
  painel_definir_coords: NivelAcesso;
  painel_editar_area: NivelAcesso;
  // Mural
  mural_visualizar: NivelAcesso;
  mural_novo_aviso: NivelAcesso;
  // Calendário
  calendario_visualizar: NivelAcesso;
  calendario_novo_evento: NivelAcesso;
  // Participantes da área
  participantes_area: NivelAcesso;
  // Documentos
  documentos_visualizar: NivelAcesso;
  documentos_upload: NivelAcesso;
  // Cronograma
  cronograma: NivelAcesso;
  // Prédicas
  predicas_visualizar: NivelAcesso;
  predicas_nova: NivelAcesso;
  // Pedidos
  pedidos_ver: NivelAcesso;
  pedidos_novo: NivelAcesso;
  // Hakuna-exclusivos (opcionais)
  consultar_pulseira?: NivelAcesso;
  equipe_ver?: NivelAcesso;
  equipe_match?: NivelAcesso;
  ergo_configurar?: NivelAcesso;
  ergo_lista?: NivelAcesso;
  autorizacoes_ver?: NivelAcesso;
  autorizacoes_aprovar?: NivelAcesso;
  medicamentos_ver?: NivelAcesso;
  medicamentos_novo?: NivelAcesso;
  medicamentos_baixa?: NivelAcesso;
  medicamentos_estoque?: NivelAcesso;
  medicamentos_historico?: NivelAcesso;
  equip_area_ver?: NivelAcesso;
  equip_area_novo?: NivelAcesso;
  equip_area_editar?: NivelAcesso;
  necessaire_ver?: NivelAcesso;
  necessaire_salvar?: NivelAcesso;
  // Segurança + Eventos
  familias_visualizar?: NivelAcesso;
  familias_gerar?: NivelAcesso;
  familias_salvar?: NivelAcesso;
  familias_etiquetas?: NivelAcesso;
  tirolesa_cards?: NivelAcesso;
  tirolesa_simular?: NivelAcesso;
  tirolesa_gerar_oficial?: NivelAcesso;
  tirolesa_briefing?: NivelAcesso;
  tirolesa_config?: NivelAcesso;
  tirolesa_imprimir?: NivelAcesso;
  tirolesa_exportar?: NivelAcesso;
  // Mídia
  radar_visualizar?: NivelAcesso;
  radar_rastrear?: NivelAcesso;
  radar_bases?: NivelAcesso;
  ia_criativa?: NivelAcesso;
  // Logística
  crono_logistica_ver?: NivelAcesso;
  crono_logistica_nova?: NivelAcesso;
  crono_logistica_relatorio?: NivelAcesso;
  // ADM
  homologacao_ver?: NivelAcesso;
  homologacao_marcar?: NivelAcesso;
  homologacao_editar?: NivelAcesso;
  painel_pedidos_cards?: NivelAcesso;
  painel_pedidos_listar?: NivelAcesso;
  painel_pedidos_alterar_status?: NivelAcesso;
}

// Chave: "Area_Cargo" (ex: "Hakuna_Coord 01", "Segurança_Servidor")
export const PERMISSOES_PORTAL: Record<string, PermissoesPortal> = {
  // 77 entradas cobrindo 11 áreas × 7 cargos
  // ... (mapa completo conforme especificação)
};

export function getPermissoesPortal(area: string | null, cargo: string | null): PermissoesPortal | null {
  if (!area || !cargo) return null;
  const key = `${area}_${cargo}`;
  return PERMISSOES_PORTAL[key] ?? null;
}

export function canAccessPortal(perms: PermissoesPortal | null, func: keyof PermissoesPortal): boolean {
  if (!perms) return false;
  const val = perms[func];
  return val === "V" || val === "E";
}

export function canEditPortal(perms: PermissoesPortal | null, func: keyof PermissoesPortal): boolean {
  if (!perms) return false;
  return perms[func] === "E";
}
```

### 2. Modificação do `src/pages/AreaPortal.tsx`

Substituir o `usePermissoes` (sistema legado) pelo `useAreaServico` + `getPermissoesPortal`:

```typescript
// Remover:
const { cargo, getPermissao, isDiretoria: isDiretoriaP } = usePermissoes(decodedNome);

// Adicionar:
import { useAreaServico } from "@/hooks/useAreaServico";
import { getPermissoesPortal, canAccessPortal, canEditPortal } from "@/lib/permissoes";

const { role } = useAuth();
const { areaServico, cargoArea } = useAreaServico();

// Para diretoria: usar cargo "Coord 01" da área Diretoria (acesso máximo)
const effectiveCargo = role === "diretoria" ? "Coord 01" : (cargoArea ?? "Servidor");
const effectiveArea = role === "diretoria" ? "Diretoria" : decodedNome;
const perms = getPermissoesPortal(effectiveArea, effectiveCargo);
```

**Controle de abas (TabsTrigger):**

```tsx
// Antes:
{isAbaVisivel(getPermissao("mural")) && <TabsTrigger value="mural">Mural</TabsTrigger>}

// Depois:
{canAccessPortal(perms, "mural_visualizar") && <TabsTrigger value="mural">Mural</TabsTrigger>}
{canAccessPortal(perms, "calendario_visualizar") && <TabsTrigger value="calendario">Calendário</TabsTrigger>}
{canAccessPortal(perms, "participantes_area") && <TabsTrigger value="participantes">Participantes</TabsTrigger>}
{canAccessPortal(perms, "documentos_visualizar") && <TabsTrigger value="documentos">Documentos</TabsTrigger>}
{canAccessPortal(perms, "cronograma") && <TabsTrigger value="cronograma">Cronograma</TabsTrigger>}
{canAccessPortal(perms, "predicas_visualizar") && <TabsTrigger value="predicas">Prédicas</TabsTrigger>}
{canAccessPortal(perms, "pedidos_ver") && <TabsTrigger value="pedidos">Pedidos</TabsTrigger>}
// Hakuna-exclusivos:
{decodedNome === "Hakuna" && canAccessPortal(perms, "equipe_ver") && ...}
{decodedNome === "Hakuna" && canAccessPortal(perms, "ergo_lista") && ...}
{decodedNome === "Hakuna" && canAccessPortal(perms, "autorizacoes_ver") && ...}
{decodedNome === "Hakuna" && canAccessPortal(perms, "medicamentos_ver") && ...}
{decodedNome === "Hakuna" && canAccessPortal(perms, "equip_area_ver") && ...}
{decodedNome === "Hakuna" && canAccessPortal(perms, "necessaire_ver") && ...}
// Segurança/Eventos:
{(decodedNome === "Segurança" || decodedNome === "Eventos") && canAccessPortal(perms, "familias_visualizar") && ...}
{(decodedNome === "Segurança" || decodedNome === "Eventos") && canAccessPortal(perms, "tirolesa_cards") && ...}
// Mídia:
{decodedNome === "Mídia" && canAccessPortal(perms, "radar_visualizar") && ...}
{decodedNome === "Mídia" && canAccessPortal(perms, "ia_criativa") && ...}
// ADM:
{decodedNome === "ADM" && canAccessPortal(perms, "homologacao_ver") && ...}
```

**Flags de edição passadas para sub-componentes:**

```tsx
// Mural: dois níveis — visualizar aviso vs criar novo aviso
<AreaMural
  area={area}
  canEdit={canEditPortal(perms, "mural_novo_aviso")}
  canComment={canAccessPortal(perms, "mural_visualizar")}
  currentUser={currentUser}
/>

// Calendário:
<AreaCalendario
  area={area}
  canEdit={canEditPortal(perms, "calendario_novo_evento")}
  currentUser={currentUser}
/>

// Designações (Participantes da área):
<AreaDesignacoes
  area={area}
  canEdit={canEditPortal(perms, "participantes_area")}
  currentUser={currentUser}
/>

// Documentos:
<AreaDocumentos
  area={area}
  canEdit={canEditPortal(perms, "documentos_upload")}
  currentUser={currentUser}
/>

// Prédicas:
<PredicasTab canEdit={canEditPortal(perms, "predicas_nova")} />

// Pedidos:
<AreaPedidos
  areaNome={decodedNome}
  canEdit={canEditPortal(perms, "pedidos_novo")}
  canDelete={canEditPortal(perms, "pedidos_novo")}
/>

// Painel (cards de área): condicionado por painel_cards
// Botão "Definir Coordenadores": condicionado por painel_definir_coords
// Botão "Editar Área": condicionado por painel_editar_area

// Hakuna — Equipe:
<EquipeTab /> // botão "Novo Hakuna" condicionado por equipe_ver === "E"

// Hakuna — Necessaire:
<NecessaireTab isCoord={canEditPortal(perms, "necessaire_salvar")} />

// Logística — Cronograma:
<CronogramaTop
  canEdit={canEditPortal(perms, "crono_logistica_nova")}
  cronogramaTipo="logistica"
/>
```

**Painel ADM:** O `AdmPedidosDashboard` e `AdmFinanceiroDashboard` aparecem condicionados a `canAccessPortal(perms, "painel_pedidos_cards")`.

### 3. Casos especiais a manter

- **Diretor Espiritual** (`cargo_area === "Diretor Espiritual"`): continuará sendo tratado separadamente dentro de `AreaPortal.tsx` como um fallback — se `getPermissoesPortal` retornar `null` e o usuário for Diretor Espiritual, usar permissões existentes.
- **DOC**: O portal DOC fica praticamente vazio — apenas a aba Prédicas aparece para Coord 01/02 (com `predicas_visualizar: "E"` e `predicas_nova: "E"`). Coord 03 vê Prédicas mas não pode criar. Todos os demais campos são `"B"`.

## Mapa PERMISSOES_PORTAL — Estrutura de 77 Entradas

As 77 chaves são: `{11 áreas} × {7 cargos}`:

```
Hakuna_Coord 01, Hakuna_Coord 02, ..., Hakuna_Servidor
Segurança_Coord 01, ..., Segurança_Servidor
Eventos_Coord 01, ..., Eventos_Servidor
Mídia_Coord 01, ..., Mídia_Servidor
Comunicação_Coord 01, ..., Comunicação_Servidor
Logística_Coord 01, ..., Logística_Servidor
Voz_Coord 01, ..., Voz_Servidor
ADM_Coord 01, ..., ADM_Servidor
Intercessão_Coord 01, ..., Intercessão_Servidor
DOC_Coord 01, ..., DOC_Servidor
Diretoria_Coord 01, ..., Diretoria_Servidor
```

Todos os valores exatamente conforme a especificação fornecida na mensagem do usuário.

## Ordem de Implementação

1. Adicionar `PermissoesPortal`, `PERMISSOES_PORTAL` e funções ao `src/lib/permissoes.ts`
2. Atualizar `src/pages/AreaPortal.tsx`:
   - Trocar `usePermissoes` por `useAreaServico` + `getPermissoesPortal`
   - Atualizar todas as condicionais de `TabsTrigger`
   - Atualizar todos os `canEdit`/`canDelete` passados para sub-componentes

Nenhuma migration SQL. Nenhuma dependência nova. Nenhum sub-componente filho precisa ser alterado — apenas as props que `AreaPortal.tsx` já passa para eles.
