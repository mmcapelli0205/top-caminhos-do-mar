

## Etiquetas PDF (Pimaco 6080)

### Resumo
Adicionar botao "Gerar Etiquetas" na pagina de Familias que abre um modal com preview e gera PDF de etiquetas adesivas no formato Pimaco 6080 usando jsPDF.

### Dependencia nova
- `jspdf` — geracao de PDF client-side

### Arquivos a criar/modificar

**1. `src/components/EtiquetasPDFDialog.tsx`** (novo)
Componente modal com preview e geracao do PDF.

**2. `src/pages/Familias.tsx`** (modificar)
Adicionar botao "Gerar Etiquetas" ao lado de "Salvar Familias" e renderizar o dialog.

### Detalhes Tecnicos

#### Especificacoes Pimaco 6080
- Pagina A4: 210mm x 297mm
- 3 colunas x 10 linhas = 30 etiquetas por pagina
- Etiqueta: 25.4mm altura x 66.7mm largura
- Margem esquerda: 4.7mm
- Margem superior: 10.7mm
- Gap horizontal: 3.1mm entre colunas
- Sem gap vertical

#### Componente EtiquetasPDFDialog
Props:
- `open`, `onOpenChange`
- `families`: array de arrays de IDs (do result)
- `participantMap`: Map de ID para participante
- `numFamilias`: number

Logica:
1. Monta lista de etiquetas: percorre familias em ordem (1, 2, 3...), dentro de cada familia ordena participantes alfabeticamente por nome
2. Para cada participante gera 4 entradas identicas na lista
3. Calcula totais: total participantes, total etiquetas (x4), total paginas (ceil(total/30))
4. Exibe info: "X participantes x 4 etiquetas = Y etiquetas total (Z paginas)"

Preview:
- Canvas ou div simulando a primeira pagina com as etiquetas renderizadas em HTML/CSS
- Grid 3x10 com as dimensoes proporcionais

Geracao PDF (jsPDF):
- `new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })`
- Loop pelas etiquetas, calculando posicao x/y de cada uma:
  - `x = 4.7 + col * (66.7 + 3.1)`
  - `y = 10.7 + row * 25.4`
- Cada etiqueta:
  - Linha 1: nome do participante (bold, 10pt, truncado se exceder largura com `doc.getTextWidth`)
  - Linha 2: "Familia X" (regular, 8pt)
  - Texto centralizado horizontal e verticalmente na area da etiqueta
- Nova pagina a cada 30 etiquetas

Botoes:
- "Baixar PDF": gera blob e faz download com `doc.save("etiquetas-familias.pdf")`
- "Imprimir": abre janela de impressao com `window.open(blobUrl)` ou `doc.autoPrint()` + `doc.output("bloburl")`

#### Modificacao em Familias.tsx
- Import do EtiquetasPDFDialog
- Estado `etiquetasOpen` para controlar o modal
- Botao "Gerar Etiquetas" (com icone Printer) ao lado de "Salvar Familias", visivel somente quando `result` existe
- Passa `result.families`, `participantMap` e `numFamilias` ao dialog

### Componentes shadcn utilizados
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Button

