

## Modulo Equipamentos - Controle de Emprestimos

### 1. Migracao de Banco de Dados

A tabela `equipamentos` atual tem apenas: id, nome, tipo, quantidade, status, emprestado_por, data_devolucao, top_id, created_at. Precisamos adicionar as colunas faltantes:

```sql
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Outros',
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'proprio',
  ADD COLUMN IF NOT EXISTS proprietario text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'bom',
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS observacoes text;
```

A tabela `equipamento_emprestimos` ja possui todas as colunas necessarias (equipamento_id, responsavel_nome, data_retirada, data_devolucao, estado_saida, estado_devolucao, foto_saida_url, foto_devolucao_url, devolvido, observacoes).

### 2. Estrutura de Arquivos

| Arquivo | Descricao |
|---|---|
| `src/pages/Equipamentos.tsx` | Reescrever completamente - pagina principal com header, cards por categoria, filtros e tabela |
| `src/components/equipamentos/EquipamentoFormDialog.tsx` | Dialog para criar/editar equipamento |
| `src/components/equipamentos/EmprestarDialog.tsx` | Dialog para registrar emprestimo |
| `src/components/equipamentos/DevolverDialog.tsx` | Dialog para registrar devolucao |
| `src/components/equipamentos/EquipamentoDetalhesDialog.tsx` | Dialog com detalhes + aba historico de emprestimos |

### 3. Pagina Principal (Equipamentos.tsx)

- **Header**: Icone Wrench + "Equipamentos" + contador + botao "+ Novo Equipamento"
- **Cards panoramicos**: Grid de cards (2 cols mobile, 4 desktop), um por categoria, mostrando total de itens e valor estimado total
- **Filtros**: Categoria (dropdown), Origem (Proprio/Emprestado/Alugado), Estado (Bom/Regular/Danificado/Perdido), busca por nome
- **Tabela**: Foto (thumbnail 40x40), Nome, Categoria, Qtd, Origem, Proprietario, Estado, Emprestimo (badge verde "Disponivel" ou laranja "Em uso por [nome]"), Acoes
- **Acoes**: Ver detalhes, Editar, Emprestar (se disponivel), Devolver (se emprestado)
- Queries: buscar equipamentos + emprestimos ativos (devolvido=false) para saber status de emprestimo

### 4. Dialog Novo/Editar Equipamento

Campos: nome, descricao, categoria (Select com 7 categorias), origem (Proprio/Emprestado/Alugado), proprietario (visivel se origem != "proprio"), quantidade, estado, foto_url (upload para bucket "assets" path "equipamentos/"), valor_estimado (input monetario R$), observacoes.

### 5. Dialog Emprestar

Campos: responsavel_nome (input text), data_retirada (default agora), estado_saida (Select), foto_saida_url (upload opcional), observacoes.
Ao confirmar: INSERT em equipamento_emprestimos + UPDATE equipamento.estado.

### 6. Dialog Devolver

Exibe dados da retirada (quem, quando, estado saida). Campos: data_devolucao (default agora), estado_devolucao (Select), foto_devolucao_url (upload opcional), observacoes.
Ao confirmar: UPDATE emprestimo devolvido=true + data_devolucao + estado_devolucao, UPDATE equipamento.estado.

### 7. Dialog Detalhes + Historico

- Aba "Detalhes": info completa do equipamento com foto
- Aba "Historico": lista de todos emprestimos do equipamento ordenados por data, mostrando responsavel, datas, estados, fotos de saida/devolucao, observacoes

### 8. Upload de Fotos

Utilizar o bucket "assets" (ja existente e publico) com path `equipamentos/{uuid}`. Componente de upload inline nos dialogs com preview da imagem.

### 9. Responsividade

- Cards de categoria: grid-cols-2 em mobile, grid-cols-3 md, grid-cols-4 lg
- Tabela: overflow-x-auto com coluna Nome sticky
- Dialogs: classe adicional para fullscreen em mobile

