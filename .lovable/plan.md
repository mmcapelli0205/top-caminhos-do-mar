

## Financeiro Completo - Receita, Despesas, MRE, Ceia do Rei

### Resumo
Reescrever a pagina `/financeiro` com 5 abas (Resumo, Receita, Despesas, MRE, Ceia do Rei), cada uma como componente independente, com dados conectados ao Supabase.

### Problema de tipos
A tabela `despesas` no banco ja tem colunas `quantidade`, `valor_unitario`, `item`, `fornecedor`, `data_aquisicao`, `observacoes` mas o arquivo `types.ts` esta desatualizado e nao as inclui. Da mesma forma, a tabela `doacoes` existe no banco mas nao esta no types. Sera necessaria uma migracao "no-op" (ex: um comentario SQL) para forcar a regeneracao dos tipos, ou usar `.select("*")` e tratar os campos manualmente. A abordagem sera usar uma migracao vazia para forcar refresh dos tipos.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `src/pages/Financeiro.tsx` | Reescrever — pagina com Tabs |
| `src/components/financeiro/ResumoSection.tsx` | Novo — dashboard financeiro |
| `src/components/financeiro/ReceitaSection.tsx` | Novo — inscricoes + doacoes |
| `src/components/financeiro/DespesasSection.tsx` | Novo — despesas por categoria |
| `src/components/financeiro/MreSection.tsx` | Novo — MRE kit alimentacao |
| `src/components/financeiro/CeiaSection.tsx` | Novo — Ceia do Rei |
| `src/components/financeiro/PriceCell.tsx` | Novo — celula de preco reutilizavel |

### Migracao necessaria
Uma migracao "no-op" para forcar regeneracao dos tipos que incluam `doacoes` e os campos novos de `despesas`. Algo como:
```sql
-- Force types refresh
SELECT 1;
```

### Detalhes Tecnicos

#### Financeiro.tsx (pagina principal)
- Tabs: Resumo | Receita | Despesas | MRE | Ceia do Rei
- Cada tab renderiza o componente correspondente
- Icone DollarSign no header

#### Tab 1 - ResumoSection
- 3 cards grandes: Receita Total (verde), Despesa Total (vermelho), Saldo (cor condicional)
- Receita = sum(participantes.valor_pago) + sum(doacoes.valor)
- Despesa = sum(despesas.valor)
- PieChart (recharts) com distribuicao de despesas por categoria
- BarChart comparando Receita vs Despesa
- Queries: fetch participantes (valor_pago), doacoes (valor), despesas (valor, categoria)

#### Tab 2 - ReceitaSection
**Secao 2a - Inscricoes:**
- Cards resumo: Total Arrecadado, por PIX, por Cartao, com Cupom
- Tabela: Nome | Valor Pago | Forma Pagamento | Cupom | Status
- Dados de `participantes` (somente leitura)
- Totalizador no rodape

**Secao 2b - Doacoes:**
- Tabela editavel com dados da tabela `doacoes`
- Colunas: Doador | Valor | Data | Observacoes | Acoes
- Botao "+ Nova Doacao" adiciona linha editavel
- CRUD completo via Supabase (insert/update/delete)
- Totalizador

#### Tab 3 - DespesasSection
- Categorias fixas no dropdown: Administrativas, Juridicas, Papelaria, Comunicacao, Equipamentos, Combustivel, Montanha, Locacao da Base, Banheiros Quimicos, Fogos/Decoracao, Fardas, Gorras, Patchs, Pins, Taxa Global, Taxa Ticket and Go, Diversos
- Tabela conectada a `despesas` (excluindo auto_calculado=true para nao misturar com MRE/Ceia)
- Colunas: Item | Categoria | Qtd | Valor Unit. | Total | Fornecedor | Data | Obs | Acoes
- "+ Nova Despesa" abre dialog com formulario
- Total auto: quantidade x valor_unitario salvo no campo valor
- Filtro por categoria e busca por texto
- Editar via dialog, excluir com confirmacao
- Rodape: total por categoria filtrada e total geral

#### Tab 4 - MreSection
- Header: Total Participantes (status != cancelado)
- Tabela editavel de `mre_itens`
- Pre-fill automatico se tabela vazia (7 obrigatorios + 3 outros)
- PriceCell com indicador azul (auto) / laranja (manual)
- Calculos: menorPreco, total por item, custo total MRE, custo por kit
- Botoes: Salvar, + Adicionar Item, Salvar como Despesa
- Botao "Buscar" nos headers de preco (toast placeholder por enquanto)

#### Tab 5 - CeiaSection
- Header: Total Pessoas (participantes + servidores), Total Carne (x 0.400), Margem editavel
- Tabela editavel de `cela_itens`
- Pre-fill com 4 itens (Bovina 40%, Linguica 25%, Frango 20%, Batata 15%)
- Mesma logica de PriceCell
- Calculos: kgTotal, menor preco, total por item, custo total, custo por pessoa
- Botoes: Salvar, Salvar como Despesa

#### PriceCell (componente reutilizavel)
- Input numerico com dot indicator (4px circulo)
- Azul: fonte_auto=true
- Laranja: preco digitado manualmente
- Sem dot: celula vazia

#### Alert de precos vazios
- Banner laranja no topo de MRE e Ceia se algum preco obrigatorio estiver vazio

#### Responsividade
- Tabelas com overflow-x-auto
- Primeira coluna sticky com bg-card
- Inputs min-width 80px
- Dialog de nova despesa fullscreen em mobile
- TabsList com scroll horizontal em mobile

### Componentes shadcn utilizados
Card, Tabs, Table, Input, Select, Button, Checkbox, Badge, Alert, Dialog, Label, Separator

### Graficos
PieChart e BarChart do recharts (ja instalado)

