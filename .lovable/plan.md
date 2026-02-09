

## Responsividade Mobile (375px+) - Todas as Telas

Tornar todas as telas do aplicativo 100% responsivas para dispositivos mobile, sem alterar funcionalidade, logica, cores ou dados.

### Estrategia Geral

Criar um componente reutilizavel `MobileCard` para substituir linhas de tabela no mobile, e usar o hook `useIsMobile()` existente para alternar entre tabela (desktop) e cards (mobile) em cada tela.

### Componente Compartilhado

**Novo arquivo: `src/components/ui/responsive-table.tsx`**
- Componente wrapper que renderiza `<Table>` no desktop e uma lista de cards no mobile
- Usa `useIsMobile()` de `src/hooks/use-mobile.tsx`
- Cada card exibe os dados em stack vertical com labels

### Alteracoes por Tela (em ordem de prioridade)

---

**1. AppLayout (`src/components/AppLayout.tsx`)**
- Sidebar ja usa `collapsible="icon"` do Shadcn, que funciona como hamburger no mobile - verificar se funciona em 375px
- Reduzir padding do `<main>` no mobile: `p-2 md:p-6` (ja usa `p-4 md:p-6`, ajustar para `p-2`)
- Header: ja esconde texto longo no mobile (`hidden md:inline`), manter

---

**2. Participantes (`src/pages/Participantes.tsx`)** -- Prioridade 1
- Tabela com 11 colunas: no mobile, renderizar cards empilhados
- Cada card mostra: Nome (titulo), Status (badge), Contrato (icone), Familia, e botoes de acao
- Filtros: SelectTrigger com `w-full` no mobile em vez de `w-[140px]`
- Botoes do header: `w-full` no mobile (empilhados verticalmente)
- Busca: sem alteracao (ja responsivo)
- Barra de selecao em lote: empilhar no mobile
- Paginacao: layout compacto

---

**3. Familias (`src/pages/Familias.tsx`)** -- Prioridade 2
- Cards de familias: grid `grid-cols-1` no mobile (ja funciona com `grid-cols-1 md:grid-cols-2`)
- Botoes de config: empilhar verticalmente no mobile com `w-full`
- Tabela de resumo de balanceamento (6 colunas): converter para cards no mobile
- Membros dentro dos cards de familia: ja estao em lista vertical, sem alteracao necessaria

---

**4. Servidores (`src/pages/Servidores.tsx`)** -- Prioridade 3
- Grid de areas: `grid-cols-2` no mobile (ja esta correto)
- Tabela de servidores (8 colunas): converter para cards no mobile
- Card mostra: Nome, Area Atual, Status, botoes de acao
- Filtros: SelectTrigger `w-full` no mobile, empilhar verticalmente
- Botoes do header: `w-full` no mobile

---

**5. Check-in (`src/pages/CheckIn.tsx` + sub-componentes)** -- Prioridade 4

- **QrCodeTab**: Tabela de QR codes (4 colunas) para cards no mobile. Botoes `w-full`
- **CheckInTab**: Scanner ja e responsivo. Verificar card de resultado. Botoes ja usam `w-full`

---

**6. TOPs (`src/pages/Tops.tsx`)** -- Prioridade 5
- Tabela de edicoes (8 colunas): converter para cards no mobile
- Card do TOP ativo: verificar layout em 375px
- Tabs: adicionar scroll horizontal (`overflow-x-auto`)

---

**7. Financeiro (`src/pages/Financeiro.tsx` + sub-componentes)** -- Prioridade 6
- Tabs ja tem `overflow-x-auto` -- verificar scroll funciona
- **ResumoSection**: Cards de resumo `grid-cols-1` no mobile (ja tem `grid-cols-1 md:grid-cols-3`)
- **DespesasSection**: Tabela (10 colunas) para cards no mobile. Filtros empilhados
- **ReceitaSection, CeiaSection, BebidasSection, MreSection**: mesma abordagem - tabelas para cards

---

**8. Hakunas (`src/pages/Hakunas.tsx` + sub-componentes)** -- Prioridade 7
- Tabs ja tem `overflow-x-auto`
- **EquipeTab**: Tabela (7 colunas) para cards no mobile
- **ErgometricosTab**: Tabela (6 colunas) para cards no mobile
- **AutorizacoesTab**: Tabela (7 colunas) para cards no mobile
- **MedicamentosTab**: Tabela com inputs - manter scroll horizontal no mobile (nao converte para cards pois e um formulario inline)
- **EquipamentosTab**: verificar se tem tabela

---

**9. Equipamentos (`src/pages/Equipamentos.tsx`)** -- Prioridade 8
- Tabela (9 colunas): converter para cards no mobile
- Card mostra: foto, nome, categoria, estado, emprestimo, botoes de acao
- Filtros: empilhar verticalmente no mobile, `w-full`
- Cards de categoria: ja responsivos (`grid-cols-2`)

---

**10. Configuracoes (`src/pages/Configuracoes.tsx`)** -- Prioridade 9
- Tabela de usuarios (6 colunas): converter para cards no mobile
- Botao "Novo Usuario": `w-full` no mobile

---

**11. Aprovacoes (`src/pages/Aprovacoes.tsx`)** -- Prioridade 9
- Cards de contagem: ja tem `sm:grid-cols-2 lg:grid-cols-4`
- Tabela (9 colunas): converter para cards no mobile
- Card mostra: Nome, Email, Status, botoes de acao
- Keyword config section: ja responsivo

---

### Padrao de Implementacao (para cada tabela)

```text
// Pseudocodigo do padrao usado em cada tela:

const isMobile = useIsMobile();

// Desktop: <Table> normal
// Mobile: lista de cards com dados empilhados

{isMobile ? (
  <div className="space-y-3">
    {items.map(item => (
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium truncate">{item.nome}</span>
            <Badge>{item.status}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            ... dados secundarios ...
          </div>
          <div className="flex gap-2">
            ... botoes de acao w-full ...
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <Table>...</Table>
)}
```

### Resumo de Arquivos Alterados

| Arquivo | Tipo de Alteracao |
|---|---|
| `src/components/AppLayout.tsx` | Ajustar padding mobile |
| `src/pages/Participantes.tsx` | Tabela para cards, filtros empilhados, botoes w-full |
| `src/pages/Familias.tsx` | Tabela resumo para cards, botoes w-full |
| `src/pages/Servidores.tsx` | Tabela para cards, filtros empilhados |
| `src/components/checkin/QrCodeTab.tsx` | Tabela para cards, botoes w-full |
| `src/components/checkin/CheckInTab.tsx` | Ajustes menores |
| `src/pages/Tops.tsx` | Tabela para cards |
| `src/components/financeiro/ResumoSection.tsx` | Ajustes menores charts |
| `src/components/financeiro/DespesasSection.tsx` | Tabela para cards |
| `src/components/financeiro/ReceitaSection.tsx` | Tabela para cards |
| `src/components/financeiro/CeiaSection.tsx` | Tabela para cards |
| `src/components/financeiro/BebidasSection.tsx` | Tabela para cards |
| `src/components/financeiro/MreSection.tsx` | Tabela para cards |
| `src/components/hakunas/EquipeTab.tsx` | Tabela para cards |
| `src/components/hakunas/ErgometricosTab.tsx` | Tabela para cards |
| `src/components/hakunas/AutorizacoesTab.tsx` | Tabela para cards |
| `src/pages/Equipamentos.tsx` | Tabela para cards, filtros empilhados |
| `src/pages/Configuracoes.tsx` | Tabela para cards |
| `src/pages/Aprovacoes.tsx` | Tabela para cards |

Total: ~19 arquivos alterados, nenhum arquivo novo necessario (usaremos `useIsMobile()` existente e `Card` existente).

### O que NAO sera alterado

- Nenhuma logica de negocio
- Nenhuma cor ou estilo visual
- Nenhum dado ou fluxo de dados
- Dialogs/Sheets (ja sao responsivos por padrao do Shadcn)
- Sidebar (ja tem comportamento mobile nativo do Shadcn)

