

## Familias - Pagina de Gestao e Algoritmo de Formacao

### Resumo
Construir a pagina completa de Familias em `/familias` com configuracao, algoritmo automatico de distribuicao, visualizacao em cards e salvamento no Supabase.

### Arquivos a criar/modificar

**1. `src/pages/Familias.tsx`** (reescrever) — Pagina completa
**2. `src/lib/familiaAlgorithm.ts`** (novo) — Logica do algoritmo isolada para testabilidade

### Detalhes Tecnicos

#### Algoritmo de Formacao (`src/lib/familiaAlgorithm.ts`)

Funcao pura que recebe lista de participantes e numero N de familias, retorna um Map de familia_index para array de participante IDs.

Entrada:
- `participants`: array de participantes (com nome, data_nascimento, amigo_parente, doenca, peso, condicionamento)
- `numFamilias`: number

Saida:
- `families`: array de N arrays, cada um com participantes atribuidos

Passos do algoritmo (executados em ordem):
1. **Separacao (amigo_parente)**: Parseia o campo `amigo_parente`. Se participante A lista nome que faz match (case-insensitive, trim) com participante B, marca par como "devem separar". Na atribuicao, coloca em familias com distancia maxima (indice 0 vs N/2).
2. **Idosos 60+**: Filtra participantes com idade >= 60. Distribui round-robin entre as familias.
3. **Saude**: Filtra participantes com `doenca` preenchido (nao null, nao vazio). Distribui round-robin, pulando familias que ja tem 2+ membros com condicao de saude.
4. **Peso > 100kg**: Distribui round-robin, max 2 por familia.
5. **Condicionamento <= 2**: Distribui round-robin, max 2 por familia.
6. **Restantes**: Todos nao atribuidos, ordenados por idade decrescente, distribuidos round-robin para balancear contagem total.

Funcao auxiliar `calcAge(dob: string): number` para calcular idade.

#### Pagina Familias (`src/pages/Familias.tsx`)

**Secao Topo - Configuracao:**
- Input "Numero de Familias" (number, default 10)
- Botao "Gerar Familias Automaticamente" (laranja, destaque)
- Texto info: "Total participantes aptos: X" (count de participantes com status != 'cancelado')

**Dados:** Usa `useParticipantes()` hook existente para buscar participantes e familias.

**Ao clicar "Gerar":**
1. Filtra participantes com status != 'cancelado'
2. Executa algoritmo de `familiaAlgorithm.ts`
3. Armazena resultado em estado local (nao salva imediatamente)
4. Exibe resultado nos cards abaixo

**Grid de Cards de Familia:**
- Responsivo: 1 coluna mobile, 2 tablet (md), 3 desktop (lg)
- Cada card (componente Card do shadcn):
  - Header: "Familia X" + contagem de membros + idade media
  - Lista de membros com: nome, idade, badge peso (vermelho se >100kg), flag saude (icone coracao se tem doenca), badge condicionamento (1-5)
  - Borda vermelha se alguma regra violada no card

**Reatribuicao Manual:**
- Cada membro tem um Select dropdown com numeros das familias (1-N)
- Ao mudar, move o participante para a nova familia no estado local
- Mostra warning amarelo se a mudanca viola regra de separacao

**Tabela Resumo (bottom):**
- Colunas: Familia | Membros | Idade Media | Saude | Pesados | Baixo Cond.
- Linhas com violacao de balanceamento destacadas em laranja
- Violacao = diferenca de membros > 2 entre maior e menor familia, ou regra de max excedida

**Botao "Salvar Familias":**
- Primeiro: cria/atualiza registros na tabela `familias` (upsert por numero)
- Depois: para cada participante, faz update de `familia_id` na tabela `participantes`
- Usa batch updates via supabase
- Toast de sucesso "Familias salvas com sucesso!"
- Invalida cache react-query `["participantes"]` e `["familias"]`

### Sem Drag and Drop
Para evitar adicionar dependencia pesada (`@dnd-kit`), a reatribuicao manual sera feita via dropdown Select em cada membro. Isso e mais simples, mais acessivel e funciona perfeitamente em mobile.

### Sem alteracoes no banco
Usa tabelas `familias` e `participantes` existentes. Campo `familia_id` em participantes ja existe. Nenhuma migracao necessaria.

### Componentes shadcn utilizados
- Card, CardHeader, CardContent
- Input, Button, Select
- Table, TableHead, TableRow, TableCell
- Badge, Alert
- Toast (via sonner)
