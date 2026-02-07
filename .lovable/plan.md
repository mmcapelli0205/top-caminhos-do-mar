

## Melhorias no Financeiro - Complemento

### Resumo
Quatro melhorias na area Financeiro: (1) Taxa Ticket and Go e Receita Liquida no Resumo, (2) Upload de comprovante nas Despesas, (3) Exportar PDF do balanco, (4) Subtotais por categoria com badges no Resumo.

### Arquivos a modificar

| Arquivo | Acao |
|---|---|
| `src/components/financeiro/ResumoSection.tsx` | Reescrever — taxa, receita liquida, PDF, badges por categoria |
| `src/components/financeiro/DespesasSection.tsx` | Modificar — campo comprovante_url com upload no dialog + coluna na tabela |

### Detalhes Tecnicos

#### 1. ResumoSection — Taxa Ticket and Go + Receita Liquida

- Adicionar estado `taxaPercent` (default 10)
- Input editavel ao lado do card de Receita: "Taxa Ticket and Go: [10] %"
- Calculos:
  - `taxaValor = receitaInscricoes * (taxaPercent / 100)`
  - `receitaLiquida = receitaInscricoes - taxaValor + receitaDoacoes`
  - `saldo = receitaLiquida - despesaTotal`
- Card de Receita reformulado para mostrar 3 linhas:
  - Total Bruto (inscricoes + doacoes)
  - Taxa TicketAndGo: -R$ X.XXX
  - Receita Liquida (verde, destaque)
- Card de Saldo usa receitaLiquida
- Abaixo do Saldo: texto "Despesas representam X% da Receita" (`(despesaTotal / receitaLiquida * 100).toFixed(1)%`)

#### 2. ResumoSection — Subtotais por categoria com badges

- Usar as 17 categorias fixas do DespesasSection (+ MRE, Ceia do Rei, Bebidas para auto_calculados)
- Abaixo do grafico de pizza, listar cada categoria que tem valor > 0 como Badge colorido: "Fardas: R$ 1.200"
- Cores dos badges seguem o array COLORS ja existente

#### 3. ResumoSection — Exportar PDF

- Botao "Exportar PDF" no header do Resumo
- Usa jsPDF (ja instalado)
- Conteudo:
  - Header: "TOP Caminhos do Mar #1575 | 02 a 05 de Abril de 2026"
  - Secao Receita: Total Inscricoes, Doacoes, Taxa TicketAndGo, Receita Liquida
  - Secao Despesas: lista cada categoria com subtotal
  - Resultado Final: Saldo (texto verde/vermelho nao aplicavel em PDF basico, usar prefixo +/-)
  - Nome arquivo: "balanco-financeiro-top1575.pdf"

#### 4. DespesasSection — Upload de comprovante

- Adicionar `comprovante_url` ao form state (string)
- No dialog, novo campo "Comprovante" com input type="file"
- Ao selecionar arquivo:
  - Upload para Supabase Storage bucket "assets" no path `comprovantes/{uuid}-{filename}`
  - Obter URL publica via `getPublicUrl`
  - Salvar URL no campo `comprovante_url` do payload
- Na tabela, nova coluna "Comprovante" entre "Obs" e "Acoes":
  - Se `comprovante_url` existe: icone FileDown como link (target="_blank")
  - Se nao: "-"
- No edit, se ja tem comprovante mostrar link + opcao de trocar

### Componentes utilizados
- jsPDF para geracao do PDF
- Supabase Storage (`supabase.storage.from("assets").upload(...)`)
- Badge para subtotais por categoria
- Input type="file" para upload
- FileDown (lucide) como icone de download

### Sem alteracao no banco
O campo `comprovante_url` ja existe na tabela `despesas`. O bucket "assets" ja existe e e publico. Nenhuma migracao necessaria.

