

## Nova Funcionalidade: Aba Homologacao no Portal ADM

### Resumo
Criar componente `HomologacaoTimeline` com visual de timeline vertical mostrando as 12 etapas de homologacao da pista, e adicionar aba "Homologacao" no AreaPortal quando a area for "ADM".

### Arquivos

**1. Novo: `src/components/area/HomologacaoTimeline.tsx`**

Componente principal com:

- **Query**: Busca as 12 etapas de `homologacao_etapas` ordenadas por `numero`
- **Permissoes**: Usa `useAuth()` para verificar se usuario e diretoria ou servidor ADM. Se sim, `canEdit = true`, senao readonly
- **Logica de "atrasada"**: No front-end, ao carregar dados, se `data_prevista < hoje` e `status != "concluida"` -> tratar como atrasada visualmente
- **Barra de progresso no topo**:
  - Card com titulo "Homologacao da Pista" (text-2xl font-bold)
  - Subtexto "X de 12 etapas concluidas"
  - Componente `Progress` do shadcn com cor laranja via className
  - Percentual ao lado
  - `transition-all duration-500` na barra
- **Timeline vertical**:
  - Cada etapa renderizada com circulo numerado a esquerda + linha vertical conectando
  - Cores dos circulos: verde (concluida), laranja (em_andamento), cinza (pendente), vermelho (atrasada)
  - Animacao `animate-pulse` nos circulos de "em_andamento" e "atrasada"
  - Icones: Check (concluida), Clock (em_andamento), AlertTriangle (atrasada), numero (pendente)
  - Linha vertical verde ate ultima concluida, cinza depois
- **Card de cada etapa** (lado direito):
  - Nome da etapa (font-bold text-lg)
  - Badge de status colorido
  - Se `canEdit`:
    - Responsavel: input text (responsavel_nome)
    - Data Prevista: input date
    - Data Conclusao: input date
    - Observacao: textarea compacto
    - Checkbox "Marcar como concluida": ao clicar, atualiza `status = "concluida"`, `concluida = true`, `data_conclusao = hoje`
  - Se readonly: exibe dados sem inputs
- **Salvar**: Cada campo salva individualmente via `supabase.from("homologacao_etapas").update(...)` e invalida query
- **Notificacao de atrasadas**: Ao detectar etapas atrasadas, verifica se ja existe aviso com mesmo titulo na `area_avisos` nos ultimos 7 dias. Se nao, insere aviso automatico com titulo "Etapa Atrasada: {nome}" e conteudo descritivo.

**2. Alteracao: `src/pages/AreaPortal.tsx`**

- Importar `HomologacaoTimeline`
- Adicionar tab condicional para area "ADM":
```text
{decodedNome === "ADM" && <TabsTrigger value="homologacao">Homologacao</TabsTrigger>}
```
- Adicionar TabsContent:
```text
{decodedNome === "ADM" && (
  <TabsContent value="homologacao">
    <HomologacaoTimeline areaId={area.id} />
  </TabsContent>
)}
```

### Responsividade
- Desktop: timeline com linha vertical, cards largos ao lado dos circulos
- Mobile: cards full-width empilhados, circulos menores (h-8 w-8 vs h-10 w-10)

### Detalhes Tecnicos

- Nenhuma migration necessaria (tabela ja existe com 12 etapas)
- Nenhuma dependencia nova
- Query key: `["homologacao-etapas"]`
- Cores: verde `#22c55e`, laranja `#f97316`, cinza `#6b7280`, vermelho `#ef4444`
- Usa `useAuth()` para permissoes (role === "diretoria" ou profile.area_preferencia === "ADM")
- Usa `getUser()` ja disponivel no AreaPortal para verificar `currentUser?.papel === "diretoria"`
