

## Ajustes Multiplos no Sistema

### Resumo
Quatro alteracoes independentes: botao excluir servidor (com permissao ADM/Diretoria), renomear "Outra area" para "Diretoria", expandir sombras de 1 para 3, e indicadores visuais para servidores convidados/dados incompletos.

### Arquivos

**1. Alteracao: `src/pages/Servidores.tsx`**

AJUSTE 1 - Botao Excluir:
- Importar `Trash2` do lucide e `useAuth` de `@/hooks/useAuth`
- Importar `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` de `@/components/ui/alert-dialog`
- Adicionar estado: `deleteTarget` (Servidor | null)
- No hook useAuth, extrair `role`
- `const canDelete = role === "diretoria" || profile?.cargo === "coordenacao"`
- Na coluna Acoes (desktop, linha ~452-474), adicionar botao Trash2 vermelho se `canDelete`:
```text
{canDelete && (
  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300"
    onClick={() => setDeleteTarget(s)}>
    <Trash2 className="h-4 w-4" />
  </Button>
)}
```
- Mesma logica nos cards mobile (linha ~387-404)
- AlertDialog de confirmacao no final do componente:
```text
<AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir Servidor</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja excluir {deleteTarget?.nome}? Esta acao nao pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
- Funcao `handleDelete`: delete em `servidores`, invalidar query, toast sucesso

AJUSTE 2 - Renomear "Outra area" para "Diretoria":
- No array `AREAS_SERVICO` (linha 33-37): substituir `"Outra area"` por `"Diretoria"`
- No objeto `LOGOS_EQUIPES` (linha 39-52): adicionar `"Diretoria": "Logo%20Legendarios.png"`

AJUSTE 4 - Indicadores visuais:
- Importar `Star, AlertTriangle` (AlertTriangle ja importado) e `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` de `@/components/ui/tooltip`
- Na tabela desktop (linha 442), substituir `{s.nome}` por:
```text
<span className="flex items-center gap-1">
  {s.origem === "convite" && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
  {s.dados_completos === false && (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-yellow-400 animate-pulse" /></TooltipTrigger>
        <TooltipContent>Dados incompletos - aguardando preenchimento</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
  {s.nome}
</span>
```
- Mesma logica nos cards mobile (linha 380)

**2. Alteracao: `src/lib/coresEquipes.ts`**

- Substituir `"Outra area"` (se existir) ou adicionar entrada `"Diretoria": "#1F2937"`
- Verificar se ja nao existe — atualmente nao existe entrada "Outra area" neste arquivo, apenas adicionar "Diretoria"

**3. Alteracao: `src/components/area/AreaHeader.tsx`**

AJUSTE 2:
- No objeto `AREA_ICONS` (linha 42): substituir `"Outra area": Puzzle` por `"Diretoria": Crown` (Crown ja importado)

AJUSTE 3 - Expandir sombras:
- Na funcao `handleSetLeader` (linha 105): expandir union type para incluir `"sombra_02_id" | "sombra_03_id"`
- No grid de leadership cards (linha 162-192): expandir o array para incluir todos os 6 campos:
```text
const leaderFields = [
  { field: "coordenador_id", label: "Coordenador" },
  { field: "coordenador_02_id", label: "Coord. 02" },
  { field: "coordenador_03_id", label: "Coord. 03" },
  { field: "sombra_id", label: "Sombra 01" },
  { field: "sombra_02_id", label: "Sombra 02" },
  { field: "sombra_03_id", label: "Sombra 03" },
];
```
- Todos os campos sombra_ recebem badge "Em treinamento"
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`

**4. Alteracao: `src/pages/ServidorForm.tsx`**

AJUSTE 2:
- No array `AREAS_SERVICO` (linha 28-31): substituir `"Outra area"` por `"Diretoria"`

### Detalhes Tecnicos

- Nenhuma migration necessaria (todos os campos ja existem)
- Nenhuma dependencia nova
- Campos `origem` e `dados_completos` ja existem em `servidores`
- Campos `sombra_02_id` e `sombra_03_id` ja existem em `areas`
- Para o delete, a tabela `servidores` nao tem policy de DELETE restritiva alem de `auth.uid() IS NOT NULL`, entao funciona para qualquer usuario autenticado — a restricao e feita no frontend via role check

