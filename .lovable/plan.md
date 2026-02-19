
## Correções + Nova Funcionalidade: Match Manual de Solos

### Diagnóstico do Bug 1 (Raiz do Problema — Definitivo)

A investigação do banco revelou:

- **Todas as 16 famílias têm `familia_top_id = NULL`** — o campo nunca foi populado.
- **Todos os participantes também têm `top_id = NULL`** — o campo `top_id` em participantes também é nulo.
- O código atual tenta filtrar com `allFamilias.filter(f => f.familia_top_id === topId)`. Como ambos são `null`, isso retorna array vazio quando `topId !== null`, e retorna tudo quando `topId === null`.
- O `topId` é derivado de `participantes[0].top_id`, que também é `null`, então `topId = null` → a condição `if (!topId) return allFamilias` retorna TODAS as 16 famílias.
- As famílias 1–10 são as únicas usadas (confirmado: participantes têm `familia_id` de 1 a 10). As famílias 11–16 existem no banco mas não têm participantes vinculados.

**Solução definitiva:** Em vez de filtrar por `familia_top_id`, filtrar pelo conjunto de `familia_id` que realmente aparecem nos participantes. Isso é agnóstico ao `top_id` e reflete a realidade atual dos dados.

```typescript
// Famílias que realmente possuem participantes vinculados
const familias = useMemo(() => {
  const familiasComParticipantes = new Set(
    participantes.map(p => p.familia_id).filter(Boolean)
  );
  return allFamilias.filter(f => familiasComParticipantes.has(f.id));
}, [allFamilias, participantes]);
```

Isso garante que apenas as 10 famílias que possuem participantes sejam exibidas, independente do `top_id`.

---

### Migration Necessária

Adicionar coluna `grupo_tipo` na tabela `tirolesa_duplas`:

```sql
ALTER TABLE tirolesa_duplas
  ADD COLUMN IF NOT EXISTS grupo_tipo TEXT DEFAULT 'auto';
```

Valores: `'auto'` = gerada pelo algoritmo, `'manual'` = formada no match manual de solos.

---

### Alterações em `src/pages/Tirolesa.tsx` (arquivo principal)

#### 1. Correção da filtragem de famílias

Substituir o `useMemo` de `familias` (linha 108-113) pela abordagem baseada em participantes:

```typescript
const familias = useMemo(() => {
  const familiasComPart = new Set(
    participantes.map(p => p.familia_id).filter(Boolean)
  );
  return allFamilias.filter(f => familiasComPart.has(f.id));
}, [allFamilias, participantes]);
```

#### 2. Correção dos cards — Card 1 e Card 2

**Card 1 — "Aptos (Peso) / Termo Aceito"** (substitui o card "Aptos (Peso)" atual):

```
Label: "Aptos (Peso) / Termo"
Valor: "120 / 0"  (totalAptoPeso / totalTermoAceito)
Cor do número: verde para totalAptoPeso, cinza para "/ N"
```

**Card 2 — "Descida Individual"** (substitui o card "Termo Aceito"):

```
Label: "Descida Individual"
Valor: X solos
Comportamento: CLICÁVEL — abre o Dialog de Match Manual
Mostrar: número de solos do resultado ativo (simulação ou oficial)
```

#### 3. Estado novo — Match Manual de Solos

Adicionar estados:

```typescript
const [showMatchManual, setShowMatchManual] = useState(false);
const [matchSelecionado, setMatchSelecionado] = useState<string | null>(null); // participante_id
const [matchManualPairs, setMatchManualPairs] = useState<ZiplinePair[]>([]); // solos extras em memória (simulação)
const [confirmMatchPair, setConfirmMatchPair] = useState<{p1: Participante, p2: Participante} | null>(null);
const [savingMatchPair, setSavingMatchPair] = useState(false);
```

#### 4. Lógica de solos ativos

Calcular a lista de solos disponíveis para o match manual:

```typescript
const solosAtivos = useMemo(() => {
  // Solos = participantes em pares sem participante2
  if (modoAtivo === "simulacao" && simulacaoResult) {
    return simulacaoResult.pairs
      .filter(p => !p.participante2)
      .map(p => p.participante1)
      .sort((a, b) => (a.peso ?? 0) - (b.peso ?? 0)); // mais leve ao mais pesado
  }
  if (modoAtivo === "oficial") {
    return duplas
      .filter(d => !d.participante_2_id)
      .map(d => partMap.get(d.participante_1_id))
      .filter(Boolean)
      .sort((a, b) => (a!.peso ?? 0) - (b!.peso ?? 0)) as Participante[];
  }
  return [];
}, [modoAtivo, simulacaoResult, duplas, partMap]);
```

#### 5. Dialog de Match Manual — Interface completa

Um `Dialog` com:

- **Header:** "Formação Manual de Duplas — Solos" + subtítulo "X participantes sem dupla"
- **Indicador de seleção ativa:** quando um participante está selecionado, mostrar banner "Selecionado: [Nome] ([Xkg]) — Peso máximo do par: [170-X]kg"
- **Tabela de solos:** colunas `Checkbox | Nome | Família | Peso`, ordenada do mais leve ao mais pesado

**Lógica de seleção:**

- **Nenhum selecionado:** todos os checkboxes habilitados
- **Um selecionado (p1, pesoP1):** 
  - Calcular `pesoMaxPar = 170 - pesoP1`
  - Participantes com `peso > pesoMaxPar` → desabilitados (opacity, `cursor-not-allowed`)
  - Participantes com `peso ≤ pesoMaxPar` → habilitados (exceto o próprio p1)
  - Clique em habilitado → abre `confirmMatchPair` com os dois participantes
- **Ao desmarcar p1:** volta ao estado inicial (todos habilitados)

**Sub-dialog de confirmação:**

```
"Formar dupla?
João Macedo (75kg, Fam. 1) + Maria Santos (82kg, Fam. 3) = 157kg"

[✅ Confirmar Dupla]   [✖ Cancelar]
```

**Ao confirmar:**

- Modo simulação: adiciona dupla manual a `matchManualPairs` (estado local, não salva no banco)
- Modo oficial: UPSERT na tabela `tirolesa_duplas` com `grupo_tipo = 'manual'`
- Remove os dois participantes da lista de solos
- Atualiza `matchSelecionado = null`
- Toast de confirmação

**Mensagem quando sem mais combinações:**

```
Se nenhum par dos solos restantes tem pesoTotal ≤ 170:
"Não há mais combinações possíveis dentro do limite de 170kg"
```

#### 6. GRUPO SOLO na lista de duplas

Após o loop de `gruposEfetivosDisplay`, adicionar seção especial "GRUPO SOLO":

```
Condição de exibição: há duplas com grupo_tipo = 'manual' OU (simulação com matchManualPairs.length > 0)

GRUPO SOLO — Duplas Manuais    [X duplas] [Y solo restante]
├── Dupla 1: João (Fam.1) + Maria (Fam.3) = 157kg    ☐ Desceu
├── Dupla 2: Pedro (Fam.7) + Ana (Fam.2) = 163kg     ☐ Desceu
├── Solo: Carlos Mendes (Fam.4) — 98kg
└── Solo: Bruno Silva (Fam.9) — 92kg
```

Implementação:
- Filtrar `duplas.filter(d => d.grupo_tipo === 'manual')` para o modo oficial
- Em simulação: usar `matchManualPairs`
- Os solos restantes são `solosAtivos` sem os já emparelhados manualmente
- Aparece sempre por último

#### 7. Card "Total Duplas" — incluir manuais

```typescript
const totalDuplas = modoAtivo === "simulacao"
  ? activePairs.filter(p => p.participante2).length + matchManualPairs.filter(p => p.participante2).length
  : duplas.filter(d => d.participante_2_id).length; // já inclui manuais
```

#### 8. Card "Duplas Desceram" — mantém lógica atual (somente oficial)

Permanece mostrando `—` em simulação e `X / Y` em oficial. As duplas manuais oficiais também entram na contagem (já têm `desceu` field).

---

### Resumo dos 8 Cards Atualizados

```
Linha 1:
[Aptos (Peso) / Termo — "120 / 0"]  [Descida Individual — "34 solos" CLICÁVEL]  [Termo Pendente]  [Termo Recusado]

Linha 2:
[Total Duplas — "43+manuais"]  [Inaptos (>120kg)]  [Peso Médio Dupla]  [Duplas Desceram — "—" ou "X/Y"]
```

---

### Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---|---|
| `supabase/migrations/...sql` | Nova migration: ADD COLUMN `grupo_tipo` em `tirolesa_duplas` |
| `src/pages/Tirolesa.tsx` | Reescrever: bugfix família, cards atualizados, Dialog match manual, GRUPO SOLO |

---

### Detalhes Técnicos

- **Família filter:** Agnóstico ao `top_id`/`familia_top_id` — usa apenas `familia_id` dos participantes
- **`grupo_tipo`:** Campo `TEXT DEFAULT 'auto'` — duplas manuais recebem `'manual'`
- **Simulação:** `matchManualPairs` em `useState` local — nunca persiste no banco
- **Oficial:** duplas manuais persistem com `grupo_tipo = 'manual'`, aparecem na mesma query existente
- **Limite:** O Dialog de match manual filtra em tempo real conforme seleção — não precisa de nenhuma query extra
- **Anti-duplicação:** Os solos exibidos no match manual excluem participantes já emparelhados (tanto pelo algoritmo quanto manualmente)
- **Checkbox "Desceu":** Funciona normalmente para duplas manuais no modo oficial (mesma lógica já existente)
