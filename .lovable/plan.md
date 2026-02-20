
# Correção dos Erros de Build — AreaPortal.tsx

## Diagnóstico

O arquivo `AreaPortal.tsx` tem 10 erros de build concentrados em dois grupos:

**Grupo 1 — Linha 141:** A chamada `usePermissoes(decodedNome)` ainda existe, mas o import foi removido na iteração anterior. Também persistem variáveis derivadas `cargo`, `isDiretoriaP`, `headerCanEdit`, `canComment` que dependem desse hook.

**Grupo 2 — Linhas 401-522:** Funções auxiliares `canEditPerm`, `canCreatePerm`, `canDeletePerm` são chamadas no JSX, mas nunca foram definidas nem importadas.

**Grupo 3 — Linhas 184-211 (TabsList) e 446 (cronograma):** Condicionais ainda usam o sistema legado `isAbaVisivel(getPermissao(...))` e variáveis `cargo`/`isDiretoriaP`.

## Solução

### Seção 1 — Substituir o bloco de permissões (linhas 140-147)

Remover:
```typescript
const { cargo, getPermissao, isDiretoria: isDiretoriaP } = usePermissoes(decodedNome);
const headerCanEdit = cargo === "coord_01" || cargo === "coord_02" || cargo === "coord_03" || isDiretoriaP;
const canComment = cargo !== "servidor";
```

Adicionar:
```typescript
const { role } = useAuth();
const { areaServico, cargoArea } = useAreaServico();

// Para diretoria: usa permissões máximas; caso contrário, usa a área+cargo do servidor
const effectiveCargo = role === "diretoria" ? "Coord 01" : (cargoArea ?? "Servidor");
const effectiveArea  = role === "diretoria" ? "Diretoria" : decodedNome;
const perms = getPermissoesPortal(effectiveArea, effectiveCargo);

// Helpers derivados
const headerCanEdit = canEditPortal(perms, "painel_editar_area") || canEditPortal(perms, "painel_definir_coords");
const canComment    = canAccessPortal(perms, "mural_visualizar");
```

### Seção 2 — TabsList (linhas 183-212)

Substituir todas as condicionais `isAbaVisivel(getPermissao(...))` pelo novo sistema:

```tsx
<TabsTrigger value="painel">Painel</TabsTrigger>
{canAccessPortal(perms, "mural_visualizar")        && <TabsTrigger value="mural">Mural</TabsTrigger>}
{canAccessPortal(perms, "calendario_visualizar")   && <TabsTrigger value="calendario">Calendário</TabsTrigger>}
{canAccessPortal(perms, "participantes_area")      && <TabsTrigger value="participantes">Participantes</TabsTrigger>}
{canAccessPortal(perms, "documentos_visualizar")   && <TabsTrigger value="documentos">Documentos</TabsTrigger>}
{(decodedNome==="Segurança"||decodedNome==="Eventos") && canAccessPortal(perms,"familias_visualizar") && <TabsTrigger value="familias">Famílias</TabsTrigger>}
{(decodedNome==="Segurança"||decodedNome==="Eventos") && canAccessPortal(perms,"tirolesa_cards")      && <TabsTrigger value="tirolesa">Tirolesa</TabsTrigger>}
{decodedNome==="Mídia"  && canAccessPortal(perms,"radar_visualizar") && <TabsTrigger value="radar">Radar</TabsTrigger>}
{decodedNome==="Mídia"  && canAccessPortal(perms,"ia_criativa")      && <TabsTrigger value="ia-criativa">IA Criativa</TabsTrigger>}
{decodedNome==="ADM"    && canAccessPortal(perms,"homologacao_ver")  && <TabsTrigger value="homologacao">Homologação</TabsTrigger>}
{canAccessPortal(perms, "cronograma")              && <TabsTrigger value="cronograma">Cronograma</TabsTrigger>}
{canAccessPortal(perms, "predicas_visualizar")     && <TabsTrigger value="predicas">Prédicas</TabsTrigger>}
{canAccessPortal(perms, "pedidos_ver")             && <TabsTrigger value="pedidos">Pedidos</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"equipe_ver")       && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"ergo_lista")       && <TabsTrigger value="ergometricos">Ergométricos</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"autorizacoes_ver") && <TabsTrigger value="autorizacoes">Autorizações</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"medicamentos_ver") && <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"equip_area_ver")   && <TabsTrigger value="equipamentos_hakuna">Equipamentos</TabsTrigger>}
{decodedNome==="Hakuna" && canAccessPortal(perms,"necessaire_ver")   && <TabsTrigger value="necessaire">Necessaire</TabsTrigger>}
```

### Seção 3 — TabsContent com `canEditPerm` (linhas 401-522)

Substituir todas as chamadas problemáticas:

| Linha | Antes | Depois |
|---|---|---|
| 401 | `canEditPerm(getPermissao("mural"))` | `canEditPortal(perms, "mural_novo_aviso")` |
| 401 | `canComment` | `canAccessPortal(perms, "mural_visualizar")` |
| 405 | `canEditPerm(getPermissao("calendario"))` | `canEditPortal(perms, "calendario_novo_evento")` |
| 409 | `canEditPerm(getPermissao("participantes"))` | `canEditPortal(perms, "participantes_area")` |
| 413 | `canEditPerm(getPermissao("documentos"))` | `canEditPortal(perms, "documentos_upload")` |
| 446 | `isAbaVisivel(getPermissao("cronograma"))` | `canAccessPortal(perms, "cronograma")` |
| 458 | `cargo === "coord_01" \|\| isDiretoriaP` | `canEditPortal(perms, "crono_logistica_nova")` |
| 463 | `canEditPerm(getPermissao("cronograma"))` | `canEditPortal(perms, "cronograma")` |
| 471 | `canEditPerm(getPermissao("predicas"))` | `canEditPortal(perms, "predicas_nova")` |
| 477 | `canCreatePerm(getPermissao("pedidos"))` | `canEditPortal(perms, "pedidos_novo")` |
| 478 | `canDeletePerm(getPermissao("pedidos"))` | `canEditPortal(perms, "pedidos_novo")` |
| 484 | `canEditPerm(getPermissao("equipe"))` | `canEditPortal(perms, "equipe_ver")` |
| 521 | `cargo === "coord_01" \|\| cargo === "coord_02" \|\| ...` | `canEditPortal(perms, "necessaire_salvar")` |

### Seção 4 — Painel ADM condicionado (linha 216-220)

O bloco `AdmPedidosDashboard + AdmFinanceiroDashboard` passa a ser condicional:
```tsx
{decodedNome === "ADM" && canAccessPortal(perms, "painel_pedidos_cards") && (
  <div className="mb-6 space-y-6">
    <AdmPedidosDashboard />
    <AdmFinanceiroDashboard />
  </div>
)}
```

### Seção 5 — Limpar imports não utilizados

Remover do import de `@/lib/permissoes`:
- `PERMISSOES_DIRETOR_ESPIRITUAL` (não usado mais)
- `isAbaVisivel` (não usado mais)

O import final ficará:
```typescript
import {
  getPermissoesPortal,
  canAccessPortal,
  canEditPortal,
} from "@/lib/permissoes";
```

## Arquivos a Modificar

| Arquivo | Escopo |
|---|---|
| `src/pages/AreaPortal.tsx` | Apenas: imports, bloco de permissões (l.140-147), TabsList (l.183-212), 10 chamadas em TabsContent (l.401-522) |

Nenhum sub-componente filho precisa ser alterado.
