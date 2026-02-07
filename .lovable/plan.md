

## Importacao CSV (TicketAndGo) - Stepper Modal

### Resumo
Adicionar botao "Importar da TicketAndGo" na pagina de Participantes que abre um modal com 4 etapas: Upload, Mapeamento, Validacao e Importacao. Usa a biblioteca `papaparse` para parsing de CSV.

### Dependencia nova
- `papaparse` (+ `@types/papaparse` como devDependency) para parsing robusto de CSV com auto-deteccao de delimitador e encoding.

### Arquivos a criar/modificar

**1. `src/components/ImportCSVDialog.tsx`** (novo)
Componente principal do modal com stepper de 4 etapas.

**2. `src/pages/Participantes.tsx`** (modificar)
Adicionar botao "Importar da TicketAndGo" e renderizar o dialog.

### Detalhes Tecnicos

**Estrutura do componente ImportCSVDialog:**
- Props: `open`, `onOpenChange`, `existingCpfs: string[]` (lista de CPFs ja cadastrados)
- Estado: `step` (1-4), `rawData`, `headers`, `mapping`, `validationResults`, `importProgress`

**Step 1 - Upload:**
- Zona de drag-and-drop com visual (icone Upload, borda tracejada)
- Aceita `.csv` e `.xlsx`
- Ao carregar o arquivo:
  - Tenta decodificar com TextDecoder usando UTF-8, depois Latin1 se houver caracteres estranhos
  - Usa `Papa.parse()` com `header: true`, `skipEmptyLines: true`, `dynamicTyping: false`
  - Papa auto-detecta delimitador (comma, semicolon, tab)
- Exibe nome do arquivo e contagem de linhas
- Botao "Proximo" habilitado apos upload

**Step 2 - Preview e Mapeamento:**
- Tabela preview com as 5 primeiras linhas do CSV
- Para cada coluna do banco (nome, cpf, telefone, data_nascimento, email, igreja, peso, altura, etc.), um Select dropdown mapeando para colunas do CSV
- Auto-mapeamento fuzzy: normaliza nomes removendo acentos e lowercase, tenta match parcial:
  - "nome completo" ou "nome" -> nome
  - "cpf" -> cpf
  - "data nasc" ou "nascimento" -> data_nascimento
  - "telefone" ou "celular" ou "whatsapp" -> telefone
  - "email" ou "e-mail" -> email
  - "igreja" ou "comunidade" -> igreja
  - etc.
- Campos obrigatorios (nome, cpf, telefone, data_nascimento) destacados em vermelho se nao mapeados
- Botao "Proximo" desabilitado se campos obrigatorios nao mapeados

**Step 3 - Validacao:**
- Processa todas as linhas aplicando:
  - Limpeza de CPF (remove pontos, tracos, espacos)
  - Validacao de algoritmo CPF (usando funcao existente em `src/lib/cpf.ts`)
  - Deteccao de duplicatas contra `existingCpfs`
  - Validacao de formato de data (tenta dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy)
  - Trim em todos os campos de texto
- Tabela resumo com 3 categorias:
  - Novos (verde): prontos para importar
  - Duplicatas (amarelo): CPF ja existe no banco
  - Erros (vermelho): CPF invalido, campos obrigatorios vazios
- Permite expandir cada categoria para ver as linhas
- Checkboxes para incluir/excluir linhas com problema

**Step 4 - Importacao:**
- Botao "Importar X participantes"
- Progress bar (componente Progress do shadcn) mostrando progresso
- Para cada participante valido:
  - `qr_code = crypto.randomUUID()`
  - `status = "inscrito"`
  - Calcula idade: se >= 40, `ergometrico_status = "pendente"`
  - `contrato_assinado = false`
  - `checkin_realizado = false`
- Insere em lotes de 50 via `supabase.from("participantes").insert(batch)`
- Ao concluir: resumo final ("X importados com sucesso"), botao "Fechar"
- Invalida cache react-query `["participantes"]` para atualizar a lista

**Edge cases tratados:**
- Linhas vazias ignoradas (skipEmptyLines do papaparse)
- Espacos extras no CPF e telefone removidos
- Telefone: aceita varios formatos, normaliza para (XX) XXXXX-XXXX
- Datas: aceita dd/mm/yyyy e yyyy-mm-dd, converte para yyyy-mm-dd no banco
- Arquivo vazio ou sem linhas validas: mensagem de erro

### Modificacao em Participantes.tsx
- Import do componente ImportCSVDialog
- Estado `importOpen` para controlar o modal
- Passar `existingCpfs` extraido de `participantes.map(p => p.cpf)`
- Botao "Importar da TicketAndGo" com icone Upload ao lado do botao "Novo Participante"

### Componentes shadcn utilizados
- Dialog/DialogContent (modal grande, max-w-4xl)
- Progress (barra de progresso)
- Table (preview e validacao)
- Select (mapeamento de colunas)
- Button, Badge, Alert
- Checkbox (selecao de linhas)

### Sem alteracoes no banco
Usa tabela `participantes` existente. Nenhuma migracao necessaria.

