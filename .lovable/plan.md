

# Diagnóstico: Flutuantes não apareceram no Portal de Área

## O que aconteceu

O Bloco A atualizou apenas os **dropdowns de criação/aprovação de usuários** (CadastroRápido, Aprovações, Configurações). Os cards de liderança no header do portal de área (`AreaHeader.tsx`) **não foram tocados** porque a tabela `areas` no banco **não possui colunas para Flutuantes**.

Estrutura atual da tabela `areas`:
```text
areas
├── coordenador_id      → Coord 01
├── coordenador_02_id   → Coord 02
├── coordenador_03_id   → Coord 03
├── sombra_id           → Sombra 01
├── sombra_02_id        → Sombra 02
└── sombra_03_id        → Sombra 03
   (sem flutuante_01_id, flutuante_02_id, flutuante_03_id)
```

Para exibir Flutuantes no header do portal, são necessárias **3 mudanças**:

---

## Plano de Correção

### 1. Migration SQL — Adicionar colunas na tabela `areas`

```sql
ALTER TABLE areas
  ADD COLUMN flutuante_01_id UUID REFERENCES servidores(id),
  ADD COLUMN flutuante_02_id UUID REFERENCES servidores(id),
  ADD COLUMN flutuante_03_id UUID REFERENCES servidores(id);
```

### 2. Atualizar tipos Supabase (`src/integrations/supabase/types.ts`)

Adicionar `flutuante_01_id`, `flutuante_02_id`, `flutuante_03_id` nos blocos Row, Insert e Update da tabela `areas`.

### 3. Atualizar `src/components/area/AreaHeader.tsx`

Adicionar os 3 slots de Flutuante nos cards de liderança (entre Coords e Sombras):

```text
Coord 01 | Coord 02 | Coord 03 | Flut. 01 | Flut. 02 | Flut. 03 | Sombra 01 | Sombra 02 | Sombra 03
```

Layout proposto: grid de 9 colunas no desktop (3+3+3), com os Flutuantes sem badge especial e os Sombras mantendo o badge "Em treinamento".

### 4. Atualizar `src/hooks/usePermissoes.ts`

Adicionar verificação dos novos campos `flutuante_01_id/02/03` no `getCargoNaArea()` para resolver corretamente o cargo quando o servidor logado é um flutuante na área. Também atualizar a query para incluir os novos campos no select.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| Nova migration SQL | `ALTER TABLE areas ADD COLUMN flutuante_01/02/03_id` |
| `src/integrations/supabase/types.ts` | Adicionar 3 campos nos tipos da tabela `areas` |
| `src/components/area/AreaHeader.tsx` | Adicionar 3 cards de Flutuante + tipo no `handleSetLeader` |
| `src/hooks/usePermissoes.ts` | Incluir `flutuante_01/02/03_id` no select e no `getCargoNaArea` |

