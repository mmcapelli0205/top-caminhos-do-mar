

## Relatorio Pos-Evento do TOP

### Resumo
Criar componente de relatorio analitico comparando cronograma planejado vs execucao real, acessivel via botao no header do CronogramaTop (apenas para ADM/Diretoria). Inclui resumo executivo, tabela detalhada agrupada por dia, insights automaticos e exportacao PDF/CSV.

### Arquivos

**1. Novo: `src/components/cronograma/RelatorioTop.tsx`**

Componente completo do relatorio com:

- **Props**: `{ onVoltar: () => void }`
- **Query**: `cronograma_atividades` com `cronograma_tipo = 'adm'`, ordenado por `dia` e `ordem`
- **Estado**: filtros (dia, tipo, status), todos iniciam vazios (mostra tudo)

**Header**:
- Titulo: "Relatorio Pos-Evento -- TOP 1575 Caminhos do Mar"
- Data de geracao (formatada)
- Botao "Voltar ao Cronograma" (chama `onVoltar`)
- Botao "Exportar PDF" (jsPDF, orientacao paisagem)
- Botao "Exportar CSV" (papaparse unparse)

**Resumo Executivo** (grid de cards, 2 colunas mobile, 4 desktop):
- Total de Atividades
- Concluidas (verde) / Puladas (cinza) / Pendentes (amarelo)
- Tempo Total Previsto (Xh Xmin)
- Tempo Total Real (Xh Xmin)
- Diferenca Geral (+/- Xmin, verde/vermelho)
- % Pontualidade (concluidas dentro do tempo / total concluidas)

**Filtros**:
- Por Dia: select (D1, D2, D3, D4, Todos)
- Por Tipo: select (lista de tipos)
- Por Status: select (concluida, pulada, pendente)
- Botao Limpar

**Tabela** (desktop) / **Cards** (mobile):
- Colunas: Dia | Ordem | Atividade | Tipo | Local | H. Previsto | H. Real Inicio | H. Real Fim | Tempo Previsto | Tempo Real | Diferenca | Status
- Regras visuais:
  - Diferenca positiva (atrasou): vermelho, "Xmin"
  - Diferenca negativa (adiantou): verde, "-Xmin"
  - Diferenca < 3min: branco, "No tempo"
  - Status pulada: opacity-50, line-through
  - Status pendente: texto cinza, diferenca "--"
- Agrupamento por dia com header colorido (mesmas cores D1-D4)
- Subtotal por dia (tempo previsto total, tempo real total, diferenca)

**Rodape - Resumo por Tipo**:
- Tabela: Tipo | Qtd | Tempo Previsto Total | Tempo Real Total | Diferenca Media

**Insights Automaticos** (calculados a partir dos dados):
- Atividade com maior atraso
- Dia com melhor pontualidade
- Media de diferenca por tipo relevante (ex: Predicas)

**Exportacao PDF (jsPDF)**:
- Orientacao paisagem
- Cabecalho com titulo e data
- Tabela formatada (cores nas diferencas)
- Resumo por dia e insights no rodape
- Usa `autoTable` pattern manual (linhas desenhadas) ou texto simples formatado

**Exportacao CSV (papaparse)**:
- `unparse()` com todas as colunas + campos calculados (diferenca, status)
- Download automatico como arquivo .csv

**2. Alteracao: `src/components/cronograma/CronogramaTop.tsx`**

- Adicionar estado: `const [showRelatorio, setShowRelatorio] = useState(false)`
- No header, quando `canEdit`, adicionar botao "Relatorio do TOP" ao lado de "Nova Atividade"
- Renderizacao condicional: se `showRelatorio`, renderizar `<RelatorioTop onVoltar={() => setShowRelatorio(false)} />` em vez do conteudo atual (seletor de dia, filtros, timeline)
- Import do `RelatorioTop`

### Calculo da Diferenca

```text
Para cada atividade concluida:
  diferenca = tempo_real_min - tempo_previsto_min
  Se diferenca > 0: atrasou (vermelho)
  Se diferenca < 0: adiantou (verde)
  Se abs(diferenca) < 3: "No tempo" (branco)
  Se tempo_real_min == null: "--"
```

### Calculo de Pontualidade

```text
pontualidade = (atividades onde abs(diferenca) <= 3) / total concluidas * 100
```

### Detalhes Tecnicos

- Nenhuma migration necessaria (todos os campos ja existem)
- Nenhuma dependencia nova (jsPDF e papaparse ja instalados)
- Query key: `["relatorio-top-atividades"]`
- Formatacao de horarios: `horario_inicio` e `horario_fim` sao `time` (ex: "06:30:00"), mostrar substring(0,5)
- `horario_inicio_real` e `horario_fim_real` sao `timestamp with time zone`, formatar com `toLocaleTimeString`
- Mobile: tabela substituida por cards empilhados com dados essenciais

### Responsividade

- Cards de resumo: grid-cols-2 mobile, grid-cols-4 desktop
- Tabela: visivel apenas em md+; mobile usa cards compactos
- Filtros e botoes de exportacao: flex-wrap

