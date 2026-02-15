

## Importar da TicketAndGo para Servidores

### Resumo
Criar um novo componente `ImportServidoresCSVDialog` baseado no `ImportCSVDialog` existente, adaptado para inserir dados na tabela `servidores`. Adicionar botao na tela de Servidores para abrir o modal.

### Mudancas

**1. Novo arquivo: `src/components/ImportServidoresCSVDialog.tsx`**

Copia adaptada do `ImportCSVDialog.tsx` com as seguintes diferencias:

- **DB_COLUMNS** mapeados para a tabela `servidores`:
  - `nome` (obrigatorio), `cpf` (obrigatorio), `telefone` (obrigatorio), `email`, `data_nascimento`, `igreja`, `valor_pago`, `area_preferencia_1`, `area_preferencia_2`, `numero_legendario`, `sede`, `cidade`, `estado`, `endereco`, `cep`, `habilidades`, `experiencia`, `especialidade`, `tamanho_farda`, `contato_nome`, `contato_telefone`, `contato_email`, `forma_pagamento`, `cupom_desconto`
- **Fuzzy patterns** adaptados (ex: `area_preferencia_1` -> ["area", "area 1", "1 opcao", "area servico"])
- **Titulo do dialog**: "Importar Servidores da TicketAndGo"
- **Tabela destino**: `supabase.from("servidores").insert(batch)`
- **Campos do insert**: mapeados para colunas da tabela `servidores`
- **Status padrao**: `"pendente"` em vez de `"inscrito"`
- **QR Code**: `crypto.randomUUID()` (mesmo padrao)
- **Sem logica de ergometrico** (nao se aplica a servidores)
- **Query invalidation**: `queryKey: ["servidores"]`

**2. Alteracao: `src/pages/Servidores.tsx`**

- Importar `ImportServidoresCSVDialog` e icone `Upload`
- Adicionar estado `const [importOpen, setImportOpen] = useState(false)`
- Extrair lista de CPFs existentes: `const existingCpfs = servidores.map(s => s.cpf).filter(Boolean) as string[]`
- Adicionar botao "Importar TicketAndGo" ao lado dos botoes CSV e Novo Servidor (com icone Upload)
- Renderizar `<ImportServidoresCSVDialog>` no JSX

### O que NAO muda
- O componente `ImportCSVDialog` dos participantes permanece intacto
- Toda logica existente da tela Servidores (cards, filtros, tabela, dialogs) permanece igual
- Nenhuma dependencia nova

