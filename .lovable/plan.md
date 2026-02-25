

# Bloco A — Reorganizar Cargos no Sistema

## Escopo da Mudança

Este bloco afeta **5 arquivos front-end** e **1 Edge Function**. Nenhuma migration SQL é necessária — os valores do enum `app_role` já existem no banco (`flutuante01`, `flutuante02`, `flutuante03`, `expert`).

---

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| `src/components/CadastroRapidoDialog.tsx` | Atualizar `CARGOS_EQUIPE` (remover Sombras, adicionar Flutuantes e Expert) |
| `src/pages/Aprovacoes.tsx` | Atualizar `CARGOS` array e lógica de `handleEditarCargo` para usar mapeamento |
| `src/pages/Configuracoes.tsx` | Atualizar `ROLES` array e CARGO_LABELS |
| `src/lib/auth.ts` | Atualizar `isServidorComum`, adicionar novos roles no `getVisibleMenuItems` |
| `src/components/AppLayout.tsx` | Atualizar `CARGO_LABELS` com novos roles |
| `supabase/functions/manage-users/index.ts` | Atualizar mapeamento cargo→role no `create_temp_user` e `approve` |
| `src/lib/permissoes.ts` | Atualizar `normalizarCargoPortal` com os novos cargos |

---

## Detalhes por Arquivo

### 1. `src/components/CadastroRapidoDialog.tsx`

**Linha 17-20** — Substituir `CARGOS_EQUIPE`:
```typescript
const CARGOS_EQUIPE = [
  "Coordenador 01", "Coordenador 02", "Coordenador 03",
  "Flutuante 01", "Flutuante 02", "Flutuante 03",
  "Expert", "Servidor",
];
```
Note: Sombras removidos da lista de cadastro rápido conforme solicitado.

### 2. `src/pages/Aprovacoes.tsx`

**Linha 31-38** — Substituir `CARGOS` (usado nos dialogs de aprovar e editar cargo):
```typescript
const CARGOS = [
  { value: "servidor", label: "Servidor" },
  { value: "coordenacao", label: "Coordenador 01" },
  { value: "coord02", label: "Coordenador 02" },
  { value: "coord03", label: "Coordenador 03" },
  { value: "flutuante01", label: "Flutuante 01" },
  { value: "flutuante02", label: "Flutuante 02" },
  { value: "flutuante03", label: "Flutuante 03" },
  { value: "expert", label: "Expert" },
  { value: "diretoria", label: "Diretoria" },
];
```

**Nota**: O dialog de aprovação (linha 428-433) já usa `CARGOS` com `value` = role que é salvo diretamente no `user_profiles.cargo` e `user_roles.role` via edge function. Isso continua funcionando porque o `value` aqui já É o role do enum.

**`handleEditarCargo` (linha 164-177)**: Já funciona corretamente — salva `novoCargoEdit` (que vem do `CARGOS.value`) diretamente em `user_profiles.cargo` e `user_roles.role`.

### 3. `src/pages/Configuracoes.tsx`

**Linha 19** — Atualizar `ROLES`:
```typescript
const ROLES = ["diretoria", "coordenacao", "coord02", "coord03", "flutuante01", "flutuante02", "flutuante03", "expert", "servidor"];
```

### 4. `src/lib/auth.ts`

**`getVisibleMenuItems` (linha 65-103)** — Adicionar cases para novos roles:
```typescript
case "flutuante01":
case "flutuante02":
case "flutuante03":
case "expert":
  items = ALL_MENU_ITEMS.filter((item) =>
    [1, 2, 4, 8, 13, 14].includes(item.id)
  );
  break;
```
Estes roles terão acesso intermediário: Início, Participantes, Servidores, Artes & Docs, TOP Real Time, Mapa.

### 5. `src/components/AppLayout.tsx`

**Linha 15-22** — Atualizar `CARGO_LABELS`:
```typescript
const CARGO_LABELS: Record<string, string> = {
  diretoria: "Diretoria",
  coordenacao: "Coordenação",
  coord02: "Coord 02",
  coord03: "Coord 03",
  flutuante01: "Flutuante 01",
  flutuante02: "Flutuante 02",
  flutuante03: "Flutuante 03",
  expert: "Expert",
  sombra: "Sombra",
  servidor: "Servidor",
};
```

### 6. `supabase/functions/manage-users/index.ts`

**`create_temp_user` (linha 128-129)** — Atualizar o mapeamento cargo→role:
```typescript
const diretoriaCargos = ["Diretor", "Sub-Diretor", "Diretor Espiritual"];
const CARGO_TO_ROLE: Record<string, string> = {
  "Diretor": "diretoria",
  "Sub-Diretor": "diretoria",
  "Diretor Espiritual": "diretoria",
  "Coordenador 01": "coordenacao",
  "Coordenador 02": "coord02",
  "Coordenador 03": "coord03",
  "Flutuante 01": "flutuante01",
  "Flutuante 02": "flutuante02",
  "Flutuante 03": "flutuante03",
  "Expert": "expert",
  "Servidor": "servidor",
};
const CARGO_TO_PROFILE: Record<string, string> = {
  "Diretor": "diretoria",
  "Sub-Diretor": "diretoria",
  "Diretor Espiritual": "diretoria",
  "Coordenador 01": "coordenacao",
  "Coordenador 02": "coordenacao",
  "Coordenador 03": "coordenacao",
  "Flutuante 01": "coordenacao",
  "Flutuante 02": "coordenacao",
  "Flutuante 03": "coordenacao",
  "Expert": "coordenacao",
  "Servidor": "servidor",
};
const role = CARGO_TO_ROLE[cargo_area] || "servidor";
const profileCargo = CARGO_TO_PROFILE[cargo_area] || "servidor";
```

Usar `role` para `user_roles.role` e `profileCargo` para `user_profiles.cargo`.

Atualizar a linha que insere no profile (linha 149): `cargo: profileCargo` em vez de `cargo: role`.

### 7. `src/lib/permissoes.ts`

**`normalizarCargoPortal` (linha 1500-1515)** — Adicionar os novos cargos:
```typescript
const map: Record<string, string> = {
  "Coordenador 01": "Coord 01",
  "Coordenador 02": "Coord 02",
  "Coordenador 03": "Coord 03",
  "Flutuante 01": "Coord 01",   // Flutuantes herdam permissões de Coord 01
  "Flutuante 02": "Coord 02",
  "Flutuante 03": "Coord 03",
  "Expert": "Coord 01",          // Expert herda permissões de Coord 01
  "Sombra 01":      "Sombra 01",
  "Sombra 02":      "Sombra 02",
  "Sombra 03":      "Sombra 03",
  "Servidor":       "Servidor",
  "Diretor Espiritual": "Servidor",
  "Diretor":        "Servidor",
  "Sub-Diretor":    "Servidor",
};
```

---

## Fluxo de Dados Resumido

Quando o cadastro rápido é usado (ex: "Flutuante 02" na equipe "Eventos"):
1. `cargo_area = "Flutuante 02"` → salvo em `servidores.cargo_area`
2. `role = "flutuante02"` → salvo em `user_roles.role`
3. `profileCargo = "coordenacao"` → salvo em `user_profiles.cargo`

Quando aprovação é feita na tela de Aprovações:
1. O select mostra labels como "Flutuante 01" com value "flutuante01"
2. O value "flutuante01" é salvo diretamente em `user_profiles.cargo` e `user_roles.role` (via edge function `approve`)
3. **Problema**: O approve action na edge function salva o role diretamente como cargo do profile. Precisamos atualizar para mapear para o cargo simplificado.

### Correção no `approve` action (Edge Function, linha 319-346):
Adicionar mapeamento role→profile_cargo:
```typescript
const ROLE_TO_PROFILE: Record<string, string> = {
  "diretoria": "diretoria",
  "coordenacao": "coordenacao",
  "coord02": "coordenacao",
  "coord03": "coordenacao",
  "flutuante01": "coordenacao",
  "flutuante02": "coordenacao",
  "flutuante03": "coordenacao",
  "expert": "coordenacao",
  "sombra": "sombra",
  "servidor": "servidor",
};
const profileCargo = ROLE_TO_PROFILE[cargo] || "servidor";
```
E usar `profileCargo` no update do profile em vez de `cargo` diretamente.

---

## Nenhuma Migration SQL

Os valores `flutuante01`, `flutuante02`, `flutuante03` e `expert` já existem no enum `app_role`. Nenhuma alteração de schema necessária.

