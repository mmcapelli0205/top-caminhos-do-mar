
# Correção Urgente — Permissões do Portal de Área

## Causa Raiz Identificada

O problema é uma **incompatibilidade de strings** entre os valores reais do banco de dados e as chaves do mapa `PERMISSOES_PORTAL`.

**Banco de dados** (`servidores.cargo_area`):
- `"Coordenador 01"`, `"Coordenador 02"`, `"Coordenador 03"`
- `"Sombra 01"`, `"Sombra 02"`, `"Sombra 03"`
- `"Servidor"`, `"Diretor Espiritual"`, `"Diretor"`, `"Sub-Diretor"`

**Mapa `PERMISSOES_PORTAL`** em `permissoes.ts`:
- `"Hakuna_Coord 01"`, `"Hakuna_Coord 02"`, `"Hakuna_Coord 03"`
- `"Hakuna_Sombra 01"` etc.

A diferença fatal: `"Coordenador 01"` ≠ `"Coord 01"`. Resultado: `getPermissoesPortal` retorna `null` para **todos os coordenadores**, e `canAccessPortal(null, ...)` retorna `false` — zerando todas as abas.

## Solução: Normalizar o cargo antes de consultar o mapa

A correção é cirúrgica: adicionar uma função `normalizarCargoPortal(cargo)` que converte os valores brutos do banco para os formatos esperados pelas chaves do mapa. Isso é feito em **dois arquivos**.

---

## Arquivo 1: `src/lib/permissoes.ts`

Adicionar a função de normalização **antes** de `getPermissoesPortal`:

```typescript
// Normaliza os valores reais de cargo_area do banco para as chaves do PERMISSOES_PORTAL
export function normalizarCargoPortal(cargo: string | null): string | null {
  if (!cargo) return null;
  const map: Record<string, string> = {
    "Coordenador 01": "Coord 01",
    "Coordenador 02": "Coord 02",
    "Coordenador 03": "Coord 03",
    "Sombra 01":      "Sombra 01",  // já está correto
    "Sombra 02":      "Sombra 02",
    "Sombra 03":      "Sombra 03",
    "Servidor":       "Servidor",
    "Diretor Espiritual": "Servidor", // fallback temporário
    "Diretor":        "Servidor",
    "Sub-Diretor":    "Servidor",
  };
  return map[cargo] ?? cargo;
}
```

Modificar `getPermissoesPortal` para usar a normalização:
```typescript
export function getPermissoesPortal(area: string | null, cargo: string | null): PermissoesPortal | null {
  if (!area || !cargo) return null;
  const normalizedCargo = normalizarCargoPortal(cargo);
  const key = `${area}_${normalizedCargo}`;
  return PERMISSOES_PORTAL[key] ?? null;
}
```

---

## Arquivo 2: `src/pages/AreaPortal.tsx`

A lógica atual:
```typescript
const effectiveCargo = role === "diretoria" ? "Coord 01" : (cargoArea ?? "Servidor");
const effectiveArea  = role === "diretoria" ? "Diretoria" : decodedNome;
const perms = getPermissoesPortal(effectiveArea, effectiveCargo);
```

**Problema adicional**: `cargoArea` vem do banco com valor `"Coordenador 01"`, mas era passado cru para `getPermissoesPortal`. Com a correção em `permissoes.ts`, a normalização será feita automaticamente dentro da função, então não é necessário mudar o `AreaPortal.tsx` além de uma pequena correção de fallback.

**O que muda no `AreaPortal.tsx`:**

Adicionar o `console.log` de debug solicitado e garantir que `cargoArea` seja passado diretamente (a normalização agora acontece dentro de `getPermissoesPortal`). Remover o override `"Coord 01"` para o cargo da diretoria que também está incorreto — ao acessar portais com `role === "diretoria"`, a chave correta é `"Diretoria_Coord 01"`, que existe no mapa. Isso já funciona:

```typescript
// Antes (já estava certo para diretoria):
const effectiveCargo = role === "diretoria" ? "Coord 01" : (cargoArea ?? "Servidor");
const effectiveArea  = role === "diretoria" ? "Diretoria" : decodedNome;
```

Isso produz a chave `"Diretoria_Coord 01"` → existe no mapa → correto.

Para não-diretoria, agora `cargoArea = "Coordenador 01"` vai passar pela `normalizarCargoPortal` dentro de `getPermissoesPortal`, gerando a chave `"Hakuna_Coord 01"` → existe → correto.

**Adicionar log de debug** (conforme solicitado):
```typescript
// Linha logo após calcular perms (~linha 145):
console.log("[AreaPortal] perms debug:", { effectiveArea, effectiveCargo, cargoArea, role, permsNull: perms === null });
```

---

## Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| `src/lib/permissoes.ts` | Adicionar `normalizarCargoPortal()` e usar dentro de `getPermissoesPortal()` |
| `src/pages/AreaPortal.tsx` | Adicionar console.log de debug |

## Por que essa abordagem é segura

- A normalização é feita em um único ponto central (`getPermissoesPortal`), sem alterar nenhum componente de UI
- Os valores do banco de dados **não precisam ser alterados** — evita migrations
- Nenhuma lógica de permissão existente é removida
- O `Diretor Espiritual` e `Sub-Diretor` recebem o fallback `"Servidor"` enquanto não há chave específica no mapa
- Sem nenhuma migration SQL necessária

## Resultado esperado

Após a correção, um coordenador de Hakuna (`cargo_area = "Coordenador 01"`) ao acessar `/areas/Hakuna` terá a chave `"Hakuna_Coord 01"` resolvida corretamente, e todas as abas (Equipe, Ergométricos, Medicamentos, Necessaire etc.) voltarão a aparecer conforme configurado no mapa.
