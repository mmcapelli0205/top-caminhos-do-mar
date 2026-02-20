
# Relatório de Servidores em PDF — Aprovações

## Análise do Estado Atual

### Arquivo Principal
`src/pages/Aprovacoes.tsx` (461 linhas) — a tela de Aprovações já possui:
- Botão "Cadastro Rápido Liderança" no header (linha 249), ao lado do qual o novo botão "Relatório PDF" será inserido
- Guarda de acesso por `profile.pode_aprovar` e `role === "diretoria"`

### Biblioteca jsPDF
`jsPDF` **já está instalado** no projeto (versão 4.x, conforme `package.json`) e em uso em 4 componentes:
- `src/components/cronograma/RelatorioTop.tsx`
- `src/components/financeiro/RelatorioConsolidado.tsx`
- `src/components/financeiro/ResumoSection.tsx`
- `src/pages/Tirolesa.tsx`

**Não é necessário instalar nenhuma dependência nova.**

### Tabela `servidores`
Os campos necessários para o relatório são:
- `nome` — nome completo do servidor
- `area_servico` — área de atuação (ex: "Hakuna", "Segurança")
- `cargo_area` — cargo dentro da área (ex: "Coord 01", "Sombra 02", "Servidor")
- `status` — usado para filtrar apenas servidores ativos/aprovados

Query base:
```typescript
supabase
  .from("servidores")
  .select("nome, area_servico, cargo_area, status")
  .order("area_servico")
  .order("nome")
```

---

## Arquivos a Criar/Modificar

| Arquivo | Operação |
|---|---|
| `src/components/RelatorioServidoresPDF.tsx` | **Criar** — modal completo + geração de PDF |
| `src/pages/Aprovacoes.tsx` | **Modificar** — adicionar import + botão + estado |

---

## Plano Técnico Detalhado

### 1. Novo componente: `RelatorioServidoresPDF.tsx`

#### Props
```typescript
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}
```

#### Estado interno
```typescript
const [areaFiltro, setAreaFiltro] = useState("Todas");
const [gerando, setGerando] = useState(false);
```

#### Ordenação de cargos (dentro de cada área)
```typescript
const ORDEM_CARGO = ["Coord 01", "Coord 02", "Coord 03", "Sombra 01", "Sombra 02", "Sombra 03"];

function ordenarCargo(cargo: string | null): number {
  const idx = ORDEM_CARGO.indexOf(cargo ?? "");
  return idx === -1 ? 999 : idx; // "Servidor" e outros vão ao final
}
```

#### Ordenação das áreas
```typescript
const ORDEM_AREAS = [
  "Hakuna", "Segurança", "Eventos", "Mídia", "Comunicação",
  "Logística", "Voz", "ADM", "Intercessão", "DOC", "Diretoria",
];
```

#### Cores das áreas (barras de seção)
```typescript
const CORES_AREAS: Record<string, string> = {
  "Hakuna": "#2196F3",
  "Segurança": "#4CAF50",
  "Eventos": "#FF9800",
  "Mídia": "#9C27B0",
  "Comunicação": "#F44336",
  "Logística": "#795548",
  "Voz": "#00BCD4",
  "ADM": "#607D8B",
  "Intercessão": "#E91E63",
  "DOC": "#3F51B5",
  "Diretoria": "#B8860B",
};
```

#### Função `gerarPDF()`

**Estrutura lógica:**

1. Buscar servidores no Supabase com filtro opcional de área
2. Agrupar por `area_servico`, ordenar pelo índice em `ORDEM_AREAS`
3. Ordenar servidores de cada área por cargo (coord → sombra → servidor) e depois por nome
4. Criar `jsPDF({ format: "a4", orientation: "portrait", unit: "mm" })`
5. Para cada página, desenhar cabeçalho e rodapé usando funções auxiliares
6. Para cada grupo de área:
   - Verificar se há espaço suficiente na página atual (estimativa: 14mm por linha + 20mm de cabeçalho de seção); se não, `doc.addPage()`
   - Desenhar barra colorida com `doc.setFillColor(hex)` + `doc.rect(..., "F")`
   - Nome da área + contagem à direita em branco sobre a barra
   - Tabela da área: linhas alternadas (zebra) com `doc.rect`
   - Formatação especial por cargo: "Coord" em negrito, "Sombra" em itálico, "Servidor" normal
7. Adicionar numeração de páginas no final iterando com `doc.setPage(i)`

**Cabeçalho (primeira página e demais):**
```
Logo (40x40px) | TOP 1575 — Caminhos do Mar (bold 16pt)
               | Relatório de Servidores (12pt)
               | Gerado em: DD/MM/YYYY às HH:MM (9pt cinza)
               | Filtro: Todas as Áreas / [Nome] (9pt cinza)
```
- Logo carregada via `fetch` convertida para base64 (já feito em outros relatórios do projeto)
- Linha separadora horizontal após o cabeçalho

**Cards de resumo (apenas na primeira página, logo após o cabeçalho):**
```
[  Total Geral: 87  |  Áreas: 11  |  Média/Área: 7.9  ]
```
Desenhados com bordas arredondadas usando `doc.roundedRect` e texto centralizado.

**Rodapé (todas as páginas):**
```
TOP Manager — top-caminhos-do-mar.lovable.app       Página X de Y
```

#### UI do Modal (Dialog)

```
┌─────────────────────────────────────────────┐
│  📄 Relatório de Servidores                 │
├─────────────────────────────────────────────┤
│  Filtrar por Área                           │
│  [Select: Todas as Áreas ▼]                 │
│                                             │
│  • Inclui servidores de todas as áreas      │
│  • Ordenado por cargo e nome               │
├─────────────────────────────────────────────┤
│  [Cancelar]           [⬇ Gerar PDF]        │
└─────────────────────────────────────────────┘
```

### 2. Modificação: `Aprovacoes.tsx`

**Adicionar import:**
```typescript
import RelatorioServidoresPDF from "@/components/RelatorioServidoresPDF";
import { FileDown } from "lucide-react";
```

**Adicionar estado:**
```typescript
const [showRelatorio, setShowRelatorio] = useState(false);
```

**Adicionar botão** ao lado do "Cadastro Rápido Liderança" (linha ~249):
```tsx
{role === "diretoria" && (
  <div className="flex gap-2">
    <Button onClick={() => setShowRelatorio(true)} variant="outline" className="gap-2">
      <FileDown className="h-4 w-4" /> Relatório PDF
    </Button>
    <Button onClick={() => setShowCadastroRapido(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
      <Star className="h-4 w-4" /> Cadastro Rápido Liderança
    </Button>
  </div>
)}
```

**Adicionar componente** antes do fechamento do `</div>` raiz:
```tsx
<RelatorioServidoresPDF open={showRelatorio} onOpenChange={setShowRelatorio} />
```

---

## Detalhes Visuais do PDF

### Paleta de cores
| Elemento | Cor |
|---|---|
| Fundo geral | Branco `#FFFFFF` |
| Texto principal | Cinza escuro `#1B2838` |
| Subtítulos / meta | Cinza médio `#6B7280` |
| Linha separadora | Cinza claro `#E5E7EB` |
| Linha zebra par | `#F9FAFB` (levíssimo cinza) |
| Texto em barra de área | Branco `#FFFFFF` |

### Tipografia (usando Helvetica, já disponível no jsPDF)
| Elemento | Tamanho | Estilo |
|---|---|---|
| Título TOP | 16pt | bold |
| "Relatório de Servidores" | 12pt | normal |
| Data/Filtro | 9pt | normal, cinza |
| Card resumo — label | 8pt | normal, cinza |
| Card resumo — valor | 14pt | bold |
| Cabeçalho de área | 11pt | bold, branco |
| Contador à direita | 9pt | normal, branco |
| Nomes — Coord | 10pt | bold |
| Nomes — Sombra | 10pt | italic |
| Nomes — Servidor | 10pt | normal |
| Cargo | 9pt | normal, cinza médio |
| Rodapé | 8pt | normal, cinza claro |

### Geração de PDF — abordagem sem autotable
Como `jspdf-autotable` **não está instalado** (apenas `jsPDF` puro está), o PDF será gerado com as APIs nativas do jsPDF, seguindo o mesmo padrão já usado em `RelatorioTop.tsx` e `RelatorioConsolidado.tsx`:
- `doc.rect()` para células e barras coloridas
- `doc.text()` posicionado manualmente com `x, y`
- Controle manual de `y` (cursor vertical) com quebra de página por `if (y > pageH - margin) { doc.addPage(); resetY(); }`

---

## Nenhuma Migration SQL Necessária

O relatório usa apenas leitura da tabela `servidores` que já existe, com RLS `auth_only` que permite leitura para usuários autenticados.

---

## Resultado Final

- Um botão "Relatório PDF" aparece no header da tela de Aprovações, visível apenas para Diretoria
- Ao clicar, um modal pergunta qual área filtrar (ou todas)
- Clicar em "Gerar PDF" busca os servidores, gera o PDF in-browser e dispara o download automático
- O arquivo baixado se chama `Relatorio_Servidores_TOP1575_DD-MM-YYYY.pdf` ou `Relatorio_Servidores_[Area]_TOP1575_DD-MM-YYYY.pdf`
