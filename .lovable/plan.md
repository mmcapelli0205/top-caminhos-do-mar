

## Sistema de Permissoes Granulares - Parte 2: Aplicar no AreaPortal

### Resumo
Integrar o hook `usePermissoes` e as funcoes utilitarias de `permissoes.ts` no `AreaPortal.tsx` para controlar visibilidade de abas e permissoes de edicao/exclusao em cada componente. Ajustar componentes que ainda nao recebem props granulares.

### Arquivos

**1. Alteracao: `src/pages/AreaPortal.tsx`**

- Importar `usePermissoes` e funcoes utilitarias (`isAbaVisivel`, `canEdit as canEditPerm`, `canCreate as canCreatePerm`, `canDelete as canDeletePerm`, `canApprove as canApprovePerm`)
- Chamar `const { cargo, getPermissao, isDiretoria: isDiretoriaP } = usePermissoes(decodedNome);`
- Remover as variaveis de permissao antigas (`isCoord`, `isDiretoria`, `canEdit`, `canEditPredicas`, `isSombra`, `canComment`, `podeAprovar`) e substituir por logica baseada no hook
- `canComment` passa a ser: `canEditPerm(getPermissao("mural"))` ou `cargo !== "servidor"` (sombras e coords podem comentar)
- Default tab: `cargo === "servidor" ? "mural" : "painel"`

**TabsList - visibilidade de cada aba:**
- Painel: sempre visivel
- Mural: `isAbaVisivel(getPermissao("mural"))`
- Calendario: `isAbaVisivel(getPermissao("calendario"))`
- Participantes: `isAbaVisivel(getPermissao("participantes"))`
- Documentos: `isAbaVisivel(getPermissao("documentos"))`
- Familias: condicao de area (Seguranca/Eventos) AND `isAbaVisivel(getPermissao("familias"))`
- Tirolesa: condicao de area AND `isAbaVisivel(getPermissao("tirolesa"))`
- Radar: area Midia AND `isAbaVisivel(getPermissao("radar"))`
- IA Criativa: area Midia AND `isAbaVisivel(getPermissao("ia_criativa"))`
- Homologacao: area ADM AND `isAbaVisivel(getPermissao("homologacao"))`
- Cronograma: `isAbaVisivel(getPermissao("cronograma"))`
- Predicas: `isAbaVisivel(getPermissao("predicas"))`
- Pedidos: `isAbaVisivel(getPermissao("pedidos"))`

**TabsContent - props de permissao:**
- AreaHeader: `canEdit={canEditPerm(getPermissao("mural"))}`  (ou usar um check geral de coord/diretoria para editar header — manter isCoord/isDiretoria derivados do cargo)
- AreaMural: `canEdit={canEditPerm(getPermissao("mural"))}`, `canComment={cargo !== "servidor"}`
- AreaCalendario: `canEdit={canEditPerm(getPermissao("calendario"))}`
- AreaDesignacoes: `canEdit={canEditPerm(getPermissao("participantes"))}`
- AreaDocumentos: `canEdit={canEditPerm(getPermissao("documentos"))}`
- Familias/Tirolesa: sem props de permissao (componentes autonomos), manter como esta
- AreaRadar/AreaIACriativa: sem props (autonomos)
- HomologacaoTimeline: manter `areaId`; o componente tem logica interna de permissao
- CronogramaTop: manter logica especial de Logistica; para ADM usar `canEdit={canEditPerm(getPermissao("cronograma"))}`; para Logistica sub-tab logistica: `canEdit={cargo === "coord_01" || isDiretoriaP}`
- PredicasTab: `canEdit={canEditPerm(getPermissao("predicas"))}`
- AreaPedidos: adicionar props `canEdit`, `canDelete`, `canApprove`

**2. Alteracao: `src/components/area/AreaMural.tsx`**

- Separar logica de editar e excluir: o botao Pencil (editar) aparece se `canEdit`, o botao Trash2 (excluir) aparece se `canEdit` (ja que canEdit = permissao "E" ou "A", que inclui excluir)
- Nenhuma mudanca de interface necessaria — `canEdit` ja controla ambos os botoes (editar e excluir estao sob mesmo guard)
- Manter como esta (a prop `canEdit` ja faz o controle correto)

**3. Alteracao: `src/components/area/AreaCalendario.tsx`**

- Mesma situacao: `canEdit` ja controla botoes de criar, editar e excluir eventos
- Nenhuma alteracao necessaria na interface do componente

**4. Alteracao: `src/components/area/AreaDesignacoes.tsx`**

- `canEdit` ja controla designar, distribuir e remover
- Nenhuma alteracao necessaria

**5. Alteracao: `src/components/area/AreaDocumentos.tsx`**

- `canEdit` ja controla upload e excluir
- Nenhuma alteracao necessaria

**6. Alteracao: `src/components/area/AreaPedidos.tsx`**

- Adicionar props opcionais: `canEdit?: boolean`, `canDelete?: boolean`, `canApprove?: boolean`
- Se `canEdit === false` (e `canDelete === false`): esconder botao "Novo Pedido" e botao de editar
- Se `canEdit === true` e `canDelete === false` (EP): mostrar botao "Novo Pedido" e editar, mas nao excluir (atualmente nao ha botao excluir separado, so editar)
- O componente atualmente permite criar e editar para qualquer usuario — adicionar guard: botao "Novo Pedido" visivel apenas se `canEdit !== false`
- Botao editar (Pencil) visivel apenas se `canEdit !== false`
- Defaults: `canEdit = true`, `canDelete = true` para manter compatibilidade

### Detalhes Tecnicos

- Nenhuma migration necessaria
- Nenhuma dependencia nova
- O `AreaHeader` precisa continuar recebendo `canEdit` para permitir editar descricao da area e definir coordenadores/sombras — derivar de `cargo`: `const headerCanEdit = cargo === "coord_01" || cargo === "coord_02" || cargo === "coord_03" || isDiretoriaP;`
- Componentes Familias, Tirolesa, AreaRadar, AreaIACriativa nao recebem props de permissao (sao paginas/componentes autonomos com suas proprias logicas internas)
- O `usePermissoes` ja esta criado e retorna `cargo`, `getPermissao`, `isDiretoria`, `isDiretorEspiritual`, `isLoading`
- Quando `isLoading` do usePermissoes for true, as abas ainda renderizam normalmente pois o cargo default e "servidor" (mais restritivo) — isso e seguro, as abas aparecem apos o carregamento

