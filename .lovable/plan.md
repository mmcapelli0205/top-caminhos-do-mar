

## Pagina de Participantes - Tabela Completa com Filtros, Ordenacao e Detalhes

### Resumo
Substituir o placeholder da pagina Participantes por uma tabela de dados completa conectada ao Supabase, com busca, filtros, ordenacao, paginacao, painel lateral de detalhes e exportacao CSV.

### Arquivos a criar/modificar

**1. `src/hooks/useParticipantes.ts`** (novo)
- Hook com react-query para buscar todos os participantes da tabela `participantes`
- Tambem buscar `familias` para mapear familia_id -> numero
- Retornar dados brutos para processamento no componente

**2. `src/pages/Participantes.tsx`** (reescrever)
- Componente principal com toda a logica de estado:
  - `searchTerm` com debounce de 300ms (useEffect + setTimeout)
  - `filters`: status, familia, contrato, ergometrico
  - `sortConfig`: coluna + direcao (asc/desc)
  - `currentPage`: paginacao de 20 por pagina
  - `selectedParticipant`: para o painel lateral
- Fluxo de dados: query -> filtrar client-side -> ordenar -> paginar -> renderizar

**3. `src/components/ParticipanteSheet.tsx`** (novo)
- Painel lateral (Sheet do shadcn) com todos os campos do participante organizados em secoes:
  - Dados Pessoais: nome, cpf, email, telefone, data_nascimento, profissao, instagram, igreja
  - Dados Fisicos: peso, altura, condicionamento, tamanho_farda
  - Saude: doenca, medicamentos, alergia_alimentar, ergometrico_status, ergometrico_url
  - Contato de Emergencia: contato_nome, contato_telefone, contato_email
  - Inscricao: status, forma_pagamento, valor_pago, cupom_desconto, inscrito_por, motivo_inscricao, amigo_parente
  - Documentos: contrato_assinado, contrato_url, qr_code
- No mobile: sheet ocupa tela inteira (side="bottom" ou className fullscreen)

### Detalhes da Tabela

**Colunas desktop (todas visiveis):**
| Nome | Idade | Telefone | Igreja | Familia | Contrato | Ergometrico | Check-in | Status | Acoes |

**Colunas mobile (apenas 3 + acoes):**
| Nome | Status | Contrato | Acoes |

- Idade calculada: `Math.floor((Date.now() - new Date(data_nascimento)) / (365.25 * 86400000))`
- Familia: mostra numero da familia (via lookup na tabela familias) ou "---"
- Contrato: CheckCircle verde (true) / XCircle vermelho (false)
- Ergometrico: Badge com cores (pendente=orange, enviado=blue, aprovado=green, dispensado=gray)
- Check-in: CheckCircle verde (true) / Circle cinza (false)
- Status: Badge (inscrito=yellow, confirmado=green, cancelado=red)
- Acoes: botao olho (abre sheet) + botao lapis (navega para edicao futura)

**Ordenacao:** Click no header alterna asc/desc. Seta visual indica direcao.

**Busca:** Input no topo filtra por nome, cpf ou telefone (debounce 300ms).

**Filtros (linha de dropdowns):**
- Status: todos / inscrito / confirmado / cancelado
- Familia: todos / lista de numeros
- Contrato: todos / sim / nao
- Ergometrico: todos / pendente / enviado / aprovado / dispensado

**Paginacao:** 20 itens por pagina. Controles Previous/Next + indicador "Mostrando X-Y de Z".

**Export CSV:** Botao que gera e baixa CSV da vista filtrada atual.

**Botao "Novo Participante":** Botao laranja no topo direito, navega para /participantes/novo (rota placeholder).

**Loading:** Skeleton rows enquanto dados carregam.

### Componentes shadcn utilizados
- Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- Input (busca)
- Select (filtros)
- Badge (status, ergometrico)
- Sheet/SheetContent (painel lateral)
- Button (acoes, export, novo)
- Skeleton (loading)
- Pagination

### Sem alteracoes no banco
Todas as queries usam tabelas existentes. Nenhuma migracao necessaria.

