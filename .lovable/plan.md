

## Bug: Coordenador vê "Área não encontrada" / sem permissões no portal ADM

### Causa Raiz

Em `AreaPortal.tsx`, o cargo efetivo do usuário é resolvido assim:

```tsx
const { cargoArea } = useAreaServico(); // lê servidores.cargo_area
const effectiveCargo = role === "diretoria" ? "Coord 01" : (cargoArea ?? "Servidor");
```

O campo `servidores.cargo_area` está **NULL** para todos os servidores da área ADM. Resultado: Juliano (que É o `coordenador_id` da área ADM) recebe `effectiveCargo = "Servidor"`, perdendo todas as permissões de coordenador.

O hook `usePermissoes.ts` já resolve isso corretamente — ele cruza `servidor.id` com `areas.coordenador_id`, `coordenador_02_id`, etc. Mas o `AreaPortal` **não usa esse hook**, usa uma lógica separada e quebrada.

### Dados no banco confirmam

- `areas.coordenador_id = e1389bd8` (Juliano) ✅
- `servidores.cargo_area = NULL` para Juliano ❌
- Console: `effectiveCargo: "Servidor"`, `cargoArea: null`

### Correção

**Arquivo: `src/pages/AreaPortal.tsx`**

Substituir a lógica de resolução de cargo (linhas 149-155) para usar o mesmo padrão do `usePermissoes`: buscar o `servidor.id` do usuário logado e cruzar com os campos `coordenador_id`, `coordenador_02_id`, `coordenador_03_id`, `flutuante_*`, `expert_id` da tabela `areas`.

Concretamente:

1. Já temos `area` carregada (com `coordenador_id`, etc.) — só precisamos buscar o `servidor.id` do usuário logado pelo email.
2. Já existe a query `servidoresDaArea` mas ela busca todos da área. Precisamos de uma query específica para o servidor logado (por email).
3. Resolver o cargo efetivo com a mesma lógica de `usePermissoes.getCargoNaArea()`:
   - `area.coordenador_id === servidorId` → "Coord 01"
   - `area.coordenador_02_id === servidorId` → "Coord 02"
   - `area.coordenador_03_id === servidorId` → "Coord 03"
   - `flutuante_01_id` / `expert_id` → "Coord 01"
   - `flutuante_02_id` → "Coord 02"
   - `flutuante_03_id` → "Coord 03"
   - fallback → "Servidor"
   - `role === "diretoria"` → "Coord 01"

4. Usar esse cargo resolvido no `getPermissoesPortal(effectiveArea, effectiveCargo)`.

### Impacto
- Apenas `AreaPortal.tsx` precisa ser editado
- Adicionar uma query para buscar o `servidor.id` do usuário logado pelo email (ou reutilizar dados existentes)
- Nenhuma migração de banco necessária

