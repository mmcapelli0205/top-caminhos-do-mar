

## Taxa Global + Inscricao de Servidores

### Resumo
Duas mudancas principais: (1) adicionar taxa "Global" no Resumo, separada da "Ticket and Go", com logica diferenciada por tipo de inscricao; (2) adicionar secao "Inscricao de Servidores" na aba Receita, usando a tabela `servidores` com novos campos financeiros.

### Logica das Taxas (ponto-chave)

- **Participantes** pagam ambas as taxas: Ticket and Go + Global
- **Servidores** pagam apenas: Ticket and Go (sem Global)
- No Resumo, o calculo fica:

```text
receitaParticipantes = sum(participantes.valor_pago) onde status != cancelado
receitaServidores    = sum(servidores.valor_pago)

taxaTicket_Participantes = receitaParticipantes * ticketPercent%
taxaTicket_Servidores    = receitaServidores * ticketPercent%
taxaGlobal_Participantes = receitaParticipantes * globalPercent%

totalTaxas = taxaTicket_Participantes + taxaTicket_Servidores + taxaGlobal_Participantes

receitaLiquida = (receitaParticipantes + receitaServidores + doacoes) - totalTaxas
```

### Migracao necessaria

Adicionar campos na tabela `servidores`:

```sql
ALTER TABLE public.servidores
  ADD COLUMN valor_pago numeric DEFAULT 0,
  ADD COLUMN forma_pagamento text,
  ADD COLUMN cupom_desconto text,
  ADD COLUMN status text DEFAULT 'ativo';
```

### Arquivos a modificar

| Arquivo | Acao |
|---|---|
| `src/components/financeiro/ResumoSection.tsx` | Adicionar taxa Global, buscar servidores, recalcular receita liquida |
| `src/components/financeiro/ReceitaSection.tsx` | Adicionar secao "Inscricao de Servidores" com tabela read-only + cards resumo |

### Detalhes Tecnicos

#### ResumoSection

- Novo estado: `globalPercent` (default 0)
- Nova query: buscar `servidores` (valor_pago, status)
- Card de Receita reformulado:
  - Total Bruto = participantes + servidores + doacoes
  - Linha "Taxa Ticket and Go: [10]%" com input editavel — aplicada sobre (participantes + servidores)
  - Linha "Taxa Global: [0]%" com input editavel — aplicada apenas sobre participantes
  - Receita Liquida = bruto - taxaTicket(part+serv) - taxaGlobal(part)
- PDF atualizado para incluir servidores e taxa Global

#### ReceitaSection

- Nova secao "Inscricoes de Servidores" entre "Inscricoes" e "Doacoes"
- Nova query: buscar servidores com campos financeiros
- Cards resumo: Total Arrecadado Servidores, por PIX, por Cartao
- Tabela read-only: Nome | Valor Pago | Forma Pgto | Cupom | Status
- Totalizador de servidores
- Card final "RECEITA TOTAL" soma participantes + servidores + doacoes

### Sem alteracao em MRE/Ceia/Bebidas
As taxas sao descontadas apenas no Resumo para calcular receita liquida. As outras abas nao sao afetadas.
