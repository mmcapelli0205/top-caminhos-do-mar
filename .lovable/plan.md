
## Lista de Predicas

### Resumo
Criar dois componentes (listagem + formulario) para gerenciar as 28 predicas do TOP, e integrar como nova aba "Predicas" em todas as areas do AreaPortal. Intercessao e DOC editam; demais areas visualizam readonly.

### Arquivos

**1. Novo: `src/components/predicas/PredicasTab.tsx`**

Componente principal da aba. Props: `{ canEdit: boolean }`.

- **Query**: `predicas` ordenado por `codigo`, com React Query key `["predicas"]`
- **Estado**: `diaSelecionado` (string, "" = todos), `busca` (string), `statusFiltro` (string, "" = todos), `predicaSelecionada` (para modal detalhes), `editando` (para modal form)
- **Header**: Titulo "Lista de Predicas", subtitulo com contagem, botao "+ Nova Predica" se canEdit
- **Seletor de dia**: 5 botoes (Todos, D1, D2, D3, D4) com cores D1=#F97316, D2=#3B82F6, D3=#22C55E, D4=#EAB308 e badge de contagem
- **Filtros**: Input busca (titulo/pregador), Select status (Pendente, Confirmada, Ajustada, Cancelada)
- **Desktop (md+)**: Tabela com colunas: Codigo, Dia, Titulo, Local, Horario, Duracao, Pregador, Publico, Status, Acoes
  - Linha clicavel (abre detalhes readonly)
  - Borda lateral colorida por dia (border-l-4)
  - Status badges coloridos (pendente=cinza, confirmada=verde, ajustada=amarelo, cancelada=vermelho)
  - Acoes (se canEdit): botao editar (lapiz), botao excluir (lixeira com AlertDialog)
  - Linha com opacity-50 e line-through se cancelada
- **Mobile (< md)**: Cards empilhados com codigo+titulo, pregador, local, horario, status badge, borda lateral colorida
  - Card clicavel para detalhes
- **Modal de detalhes** (Dialog readonly): Exibe todos os campos da predica (codigo, titulo, dia, horario, duracao, pregador, local, passagens biblicas com icone Book, publico, recursos, status, observacoes). Acessivel por todos.

**2. Novo: `src/components/predicas/PredicaFormDialog.tsx`**

Dialog de criacao/edicao. Props: `{ open, onOpenChange, predica?: Predica | null }`.

- **Queries auxiliares**:
  - `cronograma_locais` ordenado por nome (para combobox de local)
  - `servidores` filtrado por `area_servico IN ('Intercessao', 'DOC', 'Voz')` ordenado por nome (para combobox de pregador)
- **Campos**:
  - Codigo: Input text (readonly na edicao)
  - Dia: Select (D1, D2, D3, D4)
  - Titulo: Input text (required)
  - Local: Combobox (Command/Popover) com lista de `cronograma_locais` + opcao "Adicionar novo" que insere em `cronograma_locais`
  - Horario Previsto: Input time (HH:MM)
  - Duracao Estimada: Input number (minutos)
  - Pregador: Combobox com servidores filtrados + opcao texto livre
  - Passagens Biblicas: Textarea
  - Publico: Select ("Todas", "1 Familia" ate "10 Familias")
  - Recursos Necessarios: Textarea
  - Status: Select (Pendente, Confirmada, Ajustada, Cancelada)
  - Observacoes: Textarea
- **Salvar**: Insert ou update em `predicas`, invalida query `["predicas"]`, toast de sucesso
- Reutiliza o mesmo pattern de Combobox do CronogramaFormDialog

**3. Alteracao: `src/pages/AreaPortal.tsx`**

- Import `PredicasTab` de `@/components/predicas/PredicasTab`
- Calcular permissao:
```text
const canEditPredicas = decodedNome === "Intercessao" || decodedNome === "DOC";
```
- Adicionar na TabsList (antes de pedidos, visivel para TODAS as areas):
```text
<TabsTrigger value="predicas">Predicas</TabsTrigger>
```
- Adicionar TabsContent:
```text
<TabsContent value="predicas">
  <PredicasTab canEdit={canEditPredicas && canEdit} />
</TabsContent>
```
- `canEdit` garante que apenas coordenadores/diretoria da area editam; `canEditPredicas` restringe a Intercessao e DOC

### Detalhes Tecnicos

- Nenhuma migration (tabela `predicas` ja existe com todos os campos)
- Nenhuma dependencia nova
- Query keys: `["predicas"]`, `["cronograma-locais"]`, `["pregadores-predicas"]`
- Horario previsto e `time without time zone` — mostrar substring(0,5) para HH:MM
- Campo `pregador_id` aceita uuid ou null (texto livre salva apenas `pregador_nome`)
- Delete com confirmacao via AlertDialog

### Responsividade

- Desktop: tabela completa com todas as colunas
- Mobile: cards empilhados com dados essenciais
- Modal form: max-w-2xl desktop, full-width mobile
- Modal detalhes: max-w-lg
