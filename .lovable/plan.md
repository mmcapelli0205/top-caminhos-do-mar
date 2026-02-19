
## O que travou e por quê

O plano anterior travou porque requereu uma migration de banco de dados (adicionar coluna `grupo_tipo` em `tirolesa_duplas`) que nunca foi aprovada pelo usuário. Sem a coluna no banco, a implementação completa do Match Manual não pôde ser finalizada.

---

## Diagnóstico Definitivo — Bug das 16 Famílias

Confirmado via banco:
- Todas as 16 famílias têm `familia_top_id = NULL`
- O campo `top_id` nos participantes também está `NULL`
- `topId` derivado dos participantes resulta em `null`
- A condição `if (!topId) return allFamilias` retorna todas as 16 famílias

A solução é filtrar pelo conjunto de `familia_id` que aparecem nos participantes:

```typescript
const familias = useMemo(() => {
  const familiasComParticipantes = new Set(
    participantes.map(p => p.familia_id).filter(Boolean)
  );
  return allFamilias.filter(f => familiasComParticipantes.has(f.id));
}, [allFamilias, participantes]);
```

Isso retorna exatamente as famílias 1–10 (que têm participantes) e exclui as 11–16.

---

## O que precisa ser feito

### Passo 1 — Migration: adicionar `grupo_tipo` na tabela `tirolesa_duplas`

```sql
ALTER TABLE tirolesa_duplas
  ADD COLUMN IF NOT EXISTS grupo_tipo TEXT DEFAULT 'auto';
```

Valores: `'auto'` = gerada pelo algoritmo, `'manual'` = formada no match manual de solos.

### Passo 2 — Reescrever `src/pages/Tirolesa.tsx`

**2.1 — Correção da filtragem de famílias (Bug 1)**
Substituir o `useMemo` de `familias` na linha 108–113 pelo filtro baseado em participantes.

**2.2 — Atualizar o tipo `DuplaRow`**
Adicionar `grupo_tipo: string | null` ao tipo local.

**2.3 — Atualizar os 8 cards**

```text
Linha 1 (4 cards):
[Aptos (Peso) / Termo — "120 / 0"]   [Descida Individual — "34 solos" CLICÁVEL]   [Termo Pendente — "120"]   [Termo Recusado — "0"]

Linha 2 (4 cards):
[Total Duplas — "43"]   [Inaptos (>120kg)]   [Peso Médio Dupla]   [Duplas Desceram — "—" ou "X/Y"]
```

Card 1 — "Aptos (Peso) / Termo":
- Label: "Aptos (Peso) / Termo Aceito"
- Valor: `120 / 0` (verde para aptos, cinza para o `/N`)

Card 2 — "Descida Individual" (NOVO, substitui "Termo Aceito"):
- Mostra total de solos do resultado ativo (simulação ou oficial)
- Clicável: abre o Dialog de Match Manual
- Desabilitado quando `modoAtivo === "none"`

**2.4 — Novos estados para o Match Manual**

```typescript
const [showMatchManual, setShowMatchManual] = useState(false);
const [matchSelecionado, setMatchSelecionado] = useState<string | null>(null);
const [matchManualPairs, setMatchManualPairs] = useState<ZiplinePair[]>([]);
const [confirmMatchPair, setConfirmMatchPair] = useState<{p1: Participante, p2: Participante} | null>(null);
const [savingMatchPair, setSavingMatchPair] = useState(false);
```

**2.5 — `solosAtivos` (useMemo)**

Lista de solos disponíveis para o match manual, excluindo os já emparelhados manualmente:

```typescript
const solosAtivos = useMemo(() => {
  // IDs já emparelhados manualmente (em simulação)
  const manualUsed = new Set<string>(
    matchManualPairs.flatMap(p => [p.participante1.id, p.participante2?.id].filter(Boolean) as string[])
  );

  if (modoAtivo === "simulacao" && simulacaoResult) {
    return simulacaoResult.pairs
      .filter(p => !p.participante2 && !manualUsed.has(p.participante1.id))
      .map(p => p.participante1)
      .sort((a, b) => (a.peso ?? 0) - (b.peso ?? 0));
  }
  if (modoAtivo === "oficial") {
    // duplas com grupo_tipo != 'manual' e sem participante2
    return duplas
      .filter(d => !d.participante_2_id && d.grupo_tipo !== 'manual')
      .map(d => partMap.get(d.participante_1_id))
      .filter(Boolean)
      .sort((a, b) => (a!.peso ?? 0) - (b!.peso ?? 0)) as Participante[];
  }
  return [];
}, [modoAtivo, simulacaoResult, duplas, partMap, matchManualPairs]);
```

**2.6 — Atualizar `totalSolo` para excluir solos já emparelhados manualmente**

```typescript
const totalSolo = modoAtivo === "simulacao"
  ? solosAtivos.length + matchManualPairs.filter(p => !p.participante2).length
  : duplas.filter(d => !d.participante_2_id && d.grupo_tipo !== 'manual').length;
```

**2.7 — Atualizar `totalDuplas` para incluir manuais**

```typescript
const totalDuplas = modoAtivo === "simulacao"
  ? activePairs.filter(p => p.participante2).length + matchManualPairs.filter(p => p.participante2).length
  : duplas.filter(d => d.participante_2_id).length; // inclui 'manual'
```

**2.8 — Dialog de Match Manual (novo componente inline)**

Interface completa dentro de um `Dialog`:

```
Header: "Formação Manual de Duplas — Solos"
Subtítulo: "X participantes sem dupla"

[Quando matchSelecionado != null:]
Banner amarelo: "Selecionado: João Macedo (75kg) — Peso máximo do par: 95kg"

Tabela:
☐  Nome                 Família    Peso
☐  Ana Costa (habilitada)   Fam. 2    68kg
☑  João Macedo (selecionado) Fam. 1    75kg   ← marcado, cor primária
☐  Maria Santos (habilitada) Fam. 3    82kg
☐  Pedro Lima (DESABILITADO) Fam. 7    95kg   ← cinza, não clicável (95 > 95kg max)
```

Lógica dos checkboxes:
- Estado inicial: todos habilitados, `matchSelecionado = null`
- Clique em participante A (sem seleção): `matchSelecionado = A.id`, calcular `pesoMax = 170 - A.peso`, desabilitar quem tem `peso > pesoMax`
- Clique em participante A já selecionado: `matchSelecionado = null` (deselecionar)
- Clique em participante B (habilitado, com A selecionado): abrir `confirmMatchPair` com A e B

Sub-dialog de confirmação:
```
"Formar dupla?
João Macedo (75kg, Fam. 1) + Maria Santos (82kg, Fam. 3) = 157kg"

[✅ Confirmar Dupla]    [✖ Cancelar]
```

Ao confirmar:
- **Simulação:** adicionar ao `matchManualPairs` (in-memory), toast "Dupla formada!"
- **Oficial:** INSERT em `tirolesa_duplas` com `grupo_tipo = 'manual'`, `top_id = topId`, etc., invalidar query, toast "Dupla salva!"
- Limpar `matchSelecionado`, fechar confirmação

Mensagem quando sem combinações:
```
"Não há mais combinações possíveis dentro do limite de 170kg"
(exibida quando nenhum par dos solosAtivos tem pesoTotal ≤ 170)
```

**2.9 — Seção GRUPO SOLO na lista de duplas**

Renderizada APÓS o loop `gruposEfetivosDisplay`, somente quando:
- `matchManualPairs.length > 0` (simulação) OU
- `duplas.filter(d => d.grupo_tipo === 'manual').length > 0` (oficial)

Exibição:
```
GRUPO SOLO — Duplas Manuais    [X duplas] [Y solos restantes]
├── Dupla 1: João (Fam.1) + Maria (Fam.3) = 157kg    ☐ Desceu
├── Dupla 2: Pedro (Fam.7) + Ana (Fam.2) = 163kg     ☐ Desceu
├── Solo: Carlos Mendes (Fam.4) — 98kg
└── Solo: Bruno Silva (Fam.9) — 92kg
```

- Em simulação: usa `matchManualPairs` + `solosAtivos` restantes
- Em oficial: filtra `duplas.filter(d => d.grupo_tipo === 'manual')` + solos `grupo_tipo !== 'manual'` e sem `participante_2_id`
- Solos restantes aparecem ao final do grupo, sem checkbox "Desceu"
- Checkbox "Desceu" só aparece no modo oficial (igual às duplas automáticas)

---

## Arquivos a Modificar

| Arquivo | Tipo | Descrição |
|---|---|---|
| `supabase/migrations/*.sql` | Novo | ADD COLUMN `grupo_tipo` em `tirolesa_duplas` |
| `src/pages/Tirolesa.tsx` | Reescrever | Bug família, cards, Dialog Match Manual, GRUPO SOLO |

---

## Sequência de Execução

1. Aprovar e executar a migration SQL
2. Reescrever `src/pages/Tirolesa.tsx` com todas as correções e nova funcionalidade

---

## Detalhes Técnicos

- Bug 1 resolvido: filtro de famílias por `familia_id` dos participantes (agnóstico ao `top_id`)
- `grupo_tipo` = `'auto'` (padrão) ou `'manual'` (match manual)
- Simulação não persiste no banco — `matchManualPairs` fica em `useState`
- Oficial persiste com `grupo_tipo = 'manual'`
- Sem query extra no Dialog — filtragem em tempo real via `useMemo`
- Anti-duplicação: `solosAtivos` exclui participantes já emparelhados manualmente
