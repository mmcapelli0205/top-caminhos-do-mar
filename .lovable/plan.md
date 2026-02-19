
## Implementação: Bug das Famílias + Cards Atualizados + Match Manual de Solos

### O que existe hoje no arquivo

O arquivo `src/pages/Tirolesa.tsx` tem 984 linhas e as seguintes seções relevantes:

- **Linha 107-113:** O `useMemo` de `familias` ainda usa o filtro `f.familia_top_id === topId`, que retorna vazio (porque `familia_top_id` é NULL) e cai no fallback `if (!topId) return allFamilias`, retornando todas as 16.
- **Linhas 59-73:** Tipo `DuplaRow` — falta o campo `grupo_tipo`.
- **Linhas 558-632:** 8 cards — Card 1 e Card 2 precisam ser trocados.
- **Linhas 765-932:** Lista de duplas em Accordion — precisa receber o "GRUPO SOLO" ao final.
- **Não existe:** Nenhuma lógica de Match Manual de Solos ainda.

---

### Mudanças que serão feitas

**1. Correção definitiva do `useMemo` de `familias` (Bug 1)**

Substituir as linhas 107-113:

```typescript
// ANTES (bugado):
const familias = useMemo(() => {
  if (!topId) return allFamilias;
  return allFamilias.filter((f) => f.familia_top_id === topId);
}, [allFamilias, topId]);

// DEPOIS (correto):
const familias = useMemo(() => {
  const familiasComParticipantes = new Set(
    participantes.map(p => p.familia_id).filter(Boolean)
  );
  return allFamilias.filter(f => familiasComParticipantes.has(f.id));
}, [allFamilias, participantes]);
```

Isso garante que somente as 10 famílias (1–10) com participantes sejam exibidas, independente de `top_id` ou `familia_top_id`.

**2. Atualizar tipo `DuplaRow`**

Adicionar `grupo_tipo: string | null` ao tipo local na linha 59:

```typescript
type DuplaRow = {
  // ... campos existentes
  grupo_tipo: string | null;
};
```

**3. Novos estados para o Match Manual**

Adicionar logo após os estados existentes (linha ~99):

```typescript
const [showMatchManual, setShowMatchManual] = useState(false);
const [matchSelecionado, setMatchSelecionado] = useState<string | null>(null);
const [matchManualPairs, setMatchManualPairs] = useState<ZiplinePair[]>([]);
const [confirmMatchPair, setConfirmMatchPair] = useState<{p1: typeof participantes[0], p2: typeof participantes[0]} | null>(null);
const [savingMatchPair, setSavingMatchPair] = useState(false);
```

**4. `solosAtivos` — novo `useMemo`**

Calcula a lista de solos disponíveis para o match manual, excluindo os já emparelhados manualmente:

```typescript
const solosAtivos = useMemo(() => {
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
    return duplas
      .filter(d => !d.participante_2_id && d.grupo_tipo !== 'manual')
      .map(d => partMap.get(d.participante_1_id))
      .filter(Boolean)
      .sort((a, b) => (a!.peso ?? 0) - (b!.peso ?? 0)) as typeof participantes;
  }
  return [];
}, [modoAtivo, simulacaoResult, duplas, partMap, matchManualPairs]);
```

**5. Atualizar `totalSolo` e `totalDuplas`**

```typescript
// totalSolo: exclui solos já emparelhados manualmente (na simulação)
const totalSolo = modoAtivo === "simulacao"
  ? solosAtivos.length  // já exclui os emparelhados manualmente
  : duplas.filter(d => !d.participante_2_id && d.grupo_tipo !== 'manual').length;

// totalDuplas: inclui duplas manuais
const totalDuplas = modoAtivo === "simulacao"
  ? activePairs.filter(p => p.participante2).length + matchManualPairs.filter(p => p.participante2).length
  : duplas.filter(d => d.participante_2_id).length;
```

**6. Verificação de combinações possíveis**

Computed booleano para saber se há combinações possíveis entre os solos restantes:

```typescript
const temCombinacoesPossiveis = useMemo(() => {
  const solos = solosAtivos;
  for (let i = 0; i < solos.length; i++) {
    for (let j = i + 1; j < solos.length; j++) {
      if ((solos[i].peso ?? 0) + (solos[j].peso ?? 0) <= 170) return true;
    }
  }
  return false;
}, [solosAtivos]);
```

**7. Handlers para Match Manual**

```typescript
// Lógica de clique no checkbox do solo
const handleMatchClick = (participante: typeof participantes[0]) => {
  if (matchSelecionado === participante.id) {
    setMatchSelecionado(null); // deselecionar
    return;
  }
  if (matchSelecionado) {
    // Há um selecionado — verificar se forma par válido e abrir confirmação
    const p1 = solosAtivos.find(s => s.id === matchSelecionado)!;
    const pesoTotal = (p1.peso ?? 0) + (participante.peso ?? 0);
    if (pesoTotal <= 170) {
      setConfirmMatchPair({ p1, p2: participante });
    }
    return;
  }
  setMatchSelecionado(participante.id);
};

// Confirmar dupla manual
const handleConfirmarMatchPair = async () => {
  if (!confirmMatchPair) return;
  const { p1, p2 } = confirmMatchPair;

  if (modoAtivo === "simulacao") {
    // Adicionar in-memory
    const novaPair: ZiplinePair = {
      grupoIdx: 9999, // GRUPO SOLO
      familiaId: p1.familia_id ?? 0,
      participante1: p1,
      participante2: p2,
      peso1: p1.peso ?? 0,
      peso2: p2.peso ?? 0,
      pesoTotal: (p1.peso ?? 0) + (p2.peso ?? 0),
      ordem: matchManualPairs.length + 1,
    };
    setMatchManualPairs(prev => [...prev, novaPair]);
    toast({ title: "Dupla formada!" });
  } else {
    // Salvar no banco com grupo_tipo = 'manual'
    setSavingMatchPair(true);
    try {
      const { error } = await (supabase.from("tirolesa_duplas" as any) as any).insert({
        familia_id: p1.familia_id ?? null,
        participante_1_id: p1.id,
        participante_2_id: p2.id,
        peso_1: p1.peso ?? 0,
        peso_2: p2.peso ?? 0,
        peso_total: (p1.peso ?? 0) + (p2.peso ?? 0),
        ordem: duplas.length + 1,
        status: "aguardando",
        observacao: null,
        top_id: topId,
        desceu: false,
        desceu_em: null,
        grupo_tipo: "manual",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["tirolesa_duplas"] });
      toast({ title: "Dupla salva!" });
    } catch (e: any) {
      toast({ title: e.message || "Erro ao salvar dupla", variant: "destructive" });
    } finally {
      setSavingMatchPair(false);
    }
  }
  setConfirmMatchPair(null);
  setMatchSelecionado(null);
};
```

**8. Cards — linha 558-632**

Substituir Card 1 ("Aptos (Peso)") e Card 2 ("Termo Aceito"):

**Card 1 — "Aptos (Peso) / Termo":**
```jsx
<Card>
  <CardHeader className="pb-1 p-3">
    <CardTitle className="text-xs font-medium text-muted-foreground">Aptos (Peso) / Termo</CardTitle>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-2xl font-bold">
      <span className="text-green-600">{totalAptoPeso}</span>
      <span className="text-sm text-muted-foreground"> / {totalTermoAceito}</span>
    </div>
  </CardContent>
</Card>
```

**Card 2 — "Descida Individual" (clicável):**
```jsx
<Card
  className={`cursor-pointer transition-colors hover:border-primary ${modoAtivo === "none" ? "opacity-50 pointer-events-none" : ""}`}
  onClick={() => modoAtivo !== "none" && setShowMatchManual(true)}
>
  <CardHeader className="pb-1 p-3">
    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
      <User className="h-3 w-3" /> Descida Individual
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-2xl font-bold text-orange-600">{totalSolo}</div>
    <div className="text-xs text-muted-foreground">solos</div>
  </CardContent>
</Card>
```

**9. Dialog de Match Manual**

Um `Dialog` completo inserido antes dos dialogs existentes (após linha 935):

```jsx
<Dialog open={showMatchManual} onOpenChange={(v) => { setShowMatchManual(v); if (!v) setMatchSelecionado(null); }}>
  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" /> Formação Manual de Duplas — Solos
      </DialogTitle>
      <p className="text-sm text-muted-foreground">{solosAtivos.length} participantes sem dupla</p>
    </DialogHeader>

    {/* Banner de seleção ativa */}
    {matchSelecionado && (() => {
      const sel = solosAtivos.find(s => s.id === matchSelecionado);
      const pesoMax = 170 - (sel?.peso ?? 0);
      return sel ? (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
          Selecionado: <strong>{sel.nome}</strong> ({sel.peso}kg) — Peso máximo do par: <strong>{pesoMax}kg</strong>
          <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => setMatchSelecionado(null)}>
            Cancelar seleção
          </Button>
        </div>
      ) : null;
    })()}

    {/* Mensagem sem combinações */}
    {solosAtivos.length >= 2 && !temCombinacoesPossiveis && (
      <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Não há mais combinações possíveis dentro do limite de 170kg
      </div>
    )}

    {solosAtivos.length === 0 && (
      <div className="text-center text-sm text-muted-foreground py-4">
        Todos os solos foram emparelhados ou não há solos no resultado atual.
      </div>
    )}

    {/* Tabela de solos */}
    {solosAtivos.length > 0 && (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="w-8"></th>
            <th className="text-left py-2 font-medium">Nome</th>
            <th className="text-left py-2 font-medium">Família</th>
            <th className="text-right py-2 font-medium">Peso</th>
          </tr>
        </thead>
        <tbody>
          {solosAtivos.map(solo => {
            const isSelecionado = matchSelecionado === solo.id;
            const pesoMaxAtual = matchSelecionado && !isSelecionado
              ? 170 - (solosAtivos.find(s => s.id === matchSelecionado)?.peso ?? 0)
              : null;
            const isDesabilitado = pesoMaxAtual !== null && (solo.peso ?? 0) > pesoMaxAtual;
            const fam = familiaMap.get(solo.familia_id ?? 0);
            return (
              <tr key={solo.id}
                className={`border-b transition-colors ${isSelecionado ? "bg-primary/10" : isDesabilitado ? "opacity-40" : "hover:bg-muted/50 cursor-pointer"}`}
                onClick={() => !isDesabilitado && handleMatchClick(solo)}
              >
                <td className="py-2 pr-2">
                  <Checkbox checked={isSelecionado} disabled={isDesabilitado} readOnly />
                </td>
                <td className="py-2">{solo.nome}</td>
                <td className="py-2 text-muted-foreground">Fam. {fam?.numero ?? "?"}</td>
                <td className="py-2 text-right font-medium">{solo.peso}kg</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}

    {/* Sub-dialog de confirmação embutido */}
    {confirmMatchPair && (
      <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
        <p className="font-medium">Formar dupla?</p>
        <p className="text-sm">
          {confirmMatchPair.p1.nome} ({confirmMatchPair.p1.peso}kg, Fam.{familiaMap.get(confirmMatchPair.p1.familia_id ?? 0)?.numero}) + {confirmMatchPair.p2.nome} ({confirmMatchPair.p2.peso}kg, Fam.{familiaMap.get(confirmMatchPair.p2.familia_id ?? 0)?.numero}) = <strong>{(confirmMatchPair.p1.peso ?? 0) + (confirmMatchPair.p2.peso ?? 0)}kg</strong>
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleConfirmarMatchPair} disabled={savingMatchPair}>
            ✅ Confirmar Dupla
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setConfirmMatchPair(null); setMatchSelecionado(null); }}>
            ✖ Cancelar
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

**10. GRUPO SOLO na lista de duplas (após linha 932)**

Renderizado após o `</Accordion>`, antes do `</>` de fechamento do bloco de conteúdo (linha 933):

```jsx
{/* GRUPO SOLO — Duplas Manuais */}
{(matchManualPairs.length > 0 || duplas.filter(d => d.grupo_tipo === 'manual').length > 0) && (() => {
  const duplasManuais = modoAtivo === "simulacao" ? matchManualPairs : duplas.filter(d => d.grupo_tipo === 'manual');
  const solosRestantes = solosAtivos;

  return (
    <Card className="border-purple-500/40 bg-purple-500/5">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 flex-wrap">
          <Users className="h-4 w-4 text-purple-600" />
          GRUPO SOLO — Duplas Manuais
          <Badge variant="secondary" className="text-xs">{duplasManuais.filter(p => modoAtivo === "simulacao" ? !!(p as ZiplinePair).participante2 : !!(p as DuplaRow).participante_2_id).length} duplas</Badge>
          {solosRestantes.length > 0 && (
            <Badge className="text-xs bg-orange-500/20 text-orange-700 border-orange-300">
              {solosRestantes.length} solo restante
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {/* Duplas manuais — simulação */}
        {modoAtivo === "simulacao" && (matchManualPairs as ZiplinePair[]).filter(p => p.participante2).map((p, i) => {
          const fam1 = familiaMap.get(p.participante1.familia_id ?? 0);
          const fam2 = familiaMap.get(p.participante2!.familia_id ?? 0);
          return (
            <div key={i} className="flex items-center gap-2 p-3 rounded-md border bg-card">
              <Users className="h-4 w-4 text-purple-600 shrink-0" />
              <span className="text-sm">
                <strong>Dupla {i + 1}:</strong>{" "}
                {p.participante1.nome} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({p.peso1}kg)
                {" "}+ {p.participante2!.nome} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({p.peso2}kg)
                {" "}= <strong>{p.pesoTotal}kg</strong>
              </span>
            </div>
          );
        })}

        {/* Duplas manuais — oficial */}
        {modoAtivo === "oficial" && (duplas.filter(d => d.grupo_tipo === 'manual' && d.participante_2_id) as DuplaRow[]).map((d) => {
          const p1 = partMap.get(d.participante_1_id);
          const p2 = partMap.get(d.participante_2_id!);
          const fam1 = p1 ? familiaMap.get(p1.familia_id ?? 0) : null;
          const fam2 = p2 ? familiaMap.get(p2.familia_id ?? 0) : null;
          return (
            <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Users className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="text-sm truncate">
                  <strong>Dupla:</strong>{" "}
                  {p1?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam1?.numero})</span> ({d.peso_1}kg)
                  {" "}+ {p2?.nome ?? "?"} <span className="text-muted-foreground text-xs">(Fam.{fam2?.numero})</span> ({d.peso_2}kg)
                  {" "}= <strong>{d.peso_total}kg</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.desceu && <Badge className="text-xs bg-green-500/20 text-green-700 border-green-300">✅ Desceu</Badge>}
                <div className="flex items-center gap-1">
                  <Checkbox
                    id={`desceu-manual-${d.id}`}
                    checked={d.desceu ?? false}
                    onCheckedChange={(checked) => handleToggleDesceu(d.id, !!checked)}
                  />
                  <label htmlFor={`desceu-manual-${d.id}`} className="text-xs cursor-pointer select-none">Desceu</label>
                </div>
              </div>
            </div>
          );
        })}

        {/* Solos restantes */}
        {solosRestantes.map(solo => {
          const fam = familiaMap.get(solo.familia_id ?? 0);
          return (
            <div key={solo.id} className="flex items-center gap-2 p-3 rounded-md border border-orange-300/40 bg-orange-500/5">
              <User className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong>Solo restante:</strong> {solo.nome} <span className="text-xs">(Fam.{fam?.numero})</span> — {solo.peso}kg
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
})()}
```

---

### Arquivos a modificar

| Arquivo | Linhas | O que muda |
|---|---|---|
| `src/pages/Tirolesa.tsx` | 59-73 | Adicionar `grupo_tipo: string \| null` ao tipo `DuplaRow` |
| `src/pages/Tirolesa.tsx` | 107-113 | Corrigir filtro de famílias (usar `familia_id` dos participantes) |
| `src/pages/Tirolesa.tsx` | ~99-115 | Adicionar 5 novos estados do Match Manual |
| `src/pages/Tirolesa.tsx` | ~193-237 | Adicionar `solosAtivos`, `temCombinacoesPossiveis`, atualizar `totalSolo` e `totalDuplas` |
| `src/pages/Tirolesa.tsx` | 558-590 | Substituir Card 1 e Card 2 (novos layouts) |
| `src/pages/Tirolesa.tsx` | ~305-360 | Adicionar handlers `handleMatchClick` e `handleConfirmarMatchPair` |
| `src/pages/Tirolesa.tsx` | 932-934 | Inserir bloco GRUPO SOLO após o Accordion |
| `src/pages/Tirolesa.tsx` | 936 | Inserir Dialog do Match Manual antes dos dialogs existentes |

---

### Resetar matchManualPairs ao simular novamente

Ao chamar `handleSimular`, limpar `matchManualPairs` e `matchSelecionado`:

```typescript
const handleSimular = () => {
  setMatchManualPairs([]);  // ← adicionar esta linha
  setMatchSelecionado(null); // ← adicionar esta linha
  const result = generateZiplinePairs(...);
  ...
};
```

---

### Invariantes garantidos

- Famílias exibidas: somente as 10 com `familia_id` nos participantes
- solosAtivos: exclui quem já está em `matchManualPairs`
- Limite 170kg: verificado antes de abrir confirmação (desabilita visuais incompatíveis)
- Oficial: INSERT com `grupo_tipo = 'manual'` — aparece na mesma query `duplasQuery`
- GRUPO SOLO: sempre por último, após todos os grupos automáticos
