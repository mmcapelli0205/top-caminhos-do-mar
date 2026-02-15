

## Correcao: Aba Cronograma nao aparece para Diretoria

### Causa Raiz

O `AreaPortal.tsx` usa `getUser()` (que le de `localStorage("top_user")`) para determinar permissoes. Porem, o sistema migrou para `useAuth()` (Supabase Auth). O `currentUser` retornado por `getUser()` esta `null` ou sem o campo `papel`, fazendo com que `isDiretoria` seja sempre `false`.

O header do sistema (em `AppLayout.tsx`) usa `useAuth()` corretamente e mostra "Diretoria", mas o `AreaPortal` nao usa essa fonte de dados.

### Solucao

**Arquivo: `src/pages/AreaPortal.tsx`**

1. Importar e usar `useAuth()` no componente
2. Derivar `isDiretoria` a partir de `role` do `useAuth()` em vez de `currentUser?.papel`
3. Adicionar `podeAprovar` como criterio adicional de visibilidade
4. Manter `getUser()` apenas para props que ainda dependem dele (mural, calendario, etc.)

Mudancas especificas:

- Adicionar import: `import { useAuth } from "@/hooks/useAuth";`
- No corpo do componente: `const { profile, role } = useAuth();`
- Trocar a linha `const isDiretoria = currentUser?.papel === "diretoria";` por:
```text
const isDiretoria = role === "diretoria";
const podeAprovar = profile?.pode_aprovar === true;
```
- Atualizar a condicao da aba Cronograma (linha 171) de:
```text
{(canEdit || isCoord || isDiretoria) && <TabsTrigger ...>}
```
para:
```text
{(isDiretoria || isCoord || podeAprovar) && <TabsTrigger ...>}
```
- Atualizar a condicao do TabsContent do Cronograma de forma equivalente
- `canEdit` no CronogramaTop: para ADM, `canEdit = isDiretoria || isCoord`; para Logistica, coordenadores editam o proprio; demais areas, `canEdit = false`

### O que NAO muda
- O `getUser()` continua sendo usado para passar `currentUser` aos sub-componentes (Mural, Calendario, etc.) que ainda dependem dele
- Nenhum outro arquivo e alterado
- Nenhuma dependencia nova

