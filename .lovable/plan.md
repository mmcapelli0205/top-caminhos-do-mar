

## Portal de Areas - Base para todas as areas de servico

### Resumo
Criar portal acessivel ao clicar em cada card de area na pagina Servidores. Cada area tem: dashboard com lideranca, mural de avisos com comentarios, calendario de eventos, lista de participantes designados, e galeria de documentos. Rota: `/areas/:nome`.

### Pre-requisito: Atualizar tipos Supabase
As tabelas `areas`, `area_avisos`, `area_comentarios`, `area_eventos`, `area_documentos` e `area_designacoes` existem no banco mas nao estao no arquivo de tipos gerado. Os tipos serao adicionados ao `src/integrations/supabase/types.ts` para ter tipagem correta.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `src/integrations/supabase/types.ts` | Modificar - adicionar tipos das 6 tabelas area_* |
| `src/App.tsx` | Modificar - adicionar rota `/areas/:nome` |
| `src/pages/AreaPortal.tsx` | Criar - pagina principal com 5 tabs |
| `src/components/area/AreaHeader.tsx` | Criar - header com logo, cor, lideranca, stats |
| `src/components/area/AreaMural.tsx` | Criar - mural de avisos com comentarios |
| `src/components/area/AreaCalendario.tsx` | Criar - calendario de eventos |
| `src/components/area/AreaDesignacoes.tsx` | Criar - participantes designados por servidor |
| `src/components/area/AreaDocumentos.tsx` | Criar - galeria de documentos |
| `src/pages/Servidores.tsx` | Modificar - area cards clicaveis com navigate |

### Detalhes Tecnicos

#### 1. App.tsx - Nova rota
Adicionar dentro do bloco `<Route element={<AppLayout />}>`:
```
<Route path="/areas/:nome" element={<AreaPortal />} />
```

#### 2. Servidores.tsx - Cards clicaveis
Cada card de area no grid (linha ~267-291) passa a navegar para `/areas/${encodeURIComponent(area)}` ao inves de apenas filtrar a tabela. Manter filtro como acao secundaria ou adicionar botao de filtro separado.

#### 3. AreaPortal.tsx
- Recebe `nome` via `useParams`, decodifica com `decodeURIComponent`
- Query `areas` filtrado por `nome` - se nao encontrar, cria registro automaticamente com defaults
- Busca usuario logado via `getUser()` de `src/lib/auth.ts`
- Calcula permissoes: `isCoord` (coordenador_id, 02, 03), `isSombra`, `canEdit`
- Tabs: Painel | Mural | Calendario | Participantes | Documentos
- Passa `area`, `canEdit`, `canComment`, `currentUser` como props para cada tab

#### 4. AreaHeader.tsx
- Logo da area (imagem de `logo_url` ou icone fallback do mapa AREA_ICONS)
- Nome com cor tema da tabela `cor`
- Botao "Editar Area" (so `canEdit`): Dialog com upload logo, descricao, paleta de cores
- Cards de lideranca: Coordenador, Coord 02, Coord 03, Sombra
  - Cada um com Select de servidores da area para designar (query servidores filtrado por area_servico)
  - Sombra com badge "Em treinamento"
- Stats: Total servidores na area, Total participantes designados

#### 5. AreaMural.tsx (Tab Mural)
- Botao "+ Novo Aviso" (so `canEdit`, NAO sombra)
- Dialog criar/editar: Titulo + Conteudo (textarea) + Checkbox "Fixar no topo"
- Lista avisos: fixados primeiro, depois por created_at desc
- Cada aviso: badge fixado, titulo, conteudo, autor+data, botoes editar/excluir (so canEdit)
- Secao comentarios expansivel (Collapsible):
  - Lista comentarios com autor + data
  - Input + botao Enviar (todos servidores da area + sombra podem comentar)
- Queries: `area_avisos` filtrado por area_id, `area_comentarios` filtrado por aviso_id

#### 6. AreaCalendario.tsx (Tab Calendario)
- Botao "+ Novo Evento" (so `canEdit`)
- Dialog: Titulo, Descricao, Data Inicio (datetime-local input), Data Fim, Local, Tipo (Select: Reuniao, Oracao, Treinamento, Outro)
- Card destaque "Proximo Evento" no topo
- Lista cronologica proximos eventos
- Secao colapsavel "Eventos anteriores" em cinza
- Icones por tipo: Calendar=Reuniao, Heart=Oracao, GraduationCap=Treinamento

#### 7. AreaDesignacoes.tsx (Tab Participantes)
- Botao "+ Designar Participante" (so `canEdit`): Dialog com Select servidor, Select participante (busca), Tipo (Oracao/Cuidado/Acompanhamento), Observacoes
- Botao "Distribuir Automaticamente": round-robin participantes nao designados entre servidores da area
- Visualizacao agrupada por servidor: Card servidor + lista participantes
- Cada participante: Nome, Tipo, Observacoes, Status, botao remover
- Totalizador: "X participantes para Y servidores"

#### 8. AreaDocumentos.tsx (Tab Documentos)
- Botao "+ Upload Documento" (so `canEdit`)
- Dialog: Nome, Descricao, Upload arquivo para bucket "assets"
- Galeria em grid de cards: icone por tipo, nome, descricao, autor+data, botao download, botao excluir
- Filtro por tipo arquivo
- Ordenacao: mais recente primeiro

#### 9. Tab Painel (embutido em AreaPortal ou componente separado)
- Cards de acoes rapidas: Servidores pendentes, Participantes designados, Avisos recentes, Proximo evento
- Ultimos 3 avisos resumidos
- Proximos 3 eventos resumidos

### Permissoes (logica frontend)
```typescript
const currentUser = getUser();
const isCoord = [area.coordenador_id, area.coordenador_02_id, area.coordenador_03_id]
  .includes(currentUser?.id);
const isDiretoria = currentUser?.papel === "diretoria";
const isSombra = area.sombra_id === currentUser?.id;
const canEdit = isCoord || isDiretoria;
const isServidorDaArea = currentUser?.area_servico === area.nome;
const canComment = canEdit || isSombra || isServidorDaArea;
```

### Icones fallback por area
Mapa de icones lucide para cada area quando nao tem logo_url: Hakuna=Heart, Seguranca=Shield, Eventos=PartyPopper, Midia=Camera, etc.

### Responsividade
- Header: stack vertical em mobile
- Cards lideranca: grid-cols-2 mobile, grid-cols-4 desktop
- Mural: full-width
- Galeria docs: grid-cols-1 mobile, grid-cols-2 md, grid-cols-3 lg
- Tabs com overflow-x-auto em mobile

### Componentes reutilizados
Tabs, Card, Avatar, Badge, Button, Dialog, Input, Textarea, Select, Table, Separator, Alert, Collapsible, Skeleton

