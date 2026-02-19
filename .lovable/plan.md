
## Bug Fix — KmzMapa.tsx linha 295

### Causa Raiz Identificada

O código define corretamente um fallback na linha 194:
```typescript
const locList: KmzLocalizacao[] = localizacoes ?? [];
```

Porém, no JSX da linha 295, foi usado `localizacoes.map(...)` em vez de `locList.map(...)`. Quando a query está desabilitada (sem `topId`, offline ou `showEquipes=false`), `localizacoes` é `undefined` — e chamar `.map()` em `undefined` causa o crash.

### Correção

**Arquivo:** `src/pages/KmzMapa.tsx`  
**Linha 295:** Substituir `localizacoes.map(` por `locList.map(`

```tsx
// ANTES (bugado):
{showEquipes &&
  localizacoes.map((loc) => {

// DEPOIS (correto):
{showEquipes &&
  locList.map((loc) => {
```

### Por que isso resolve

- `locList` é sempre um array (nunca `undefined`), pois é definido como `localizacoes ?? []`
- Quando `localizacoes` está `undefined` (estado inicial, query desabilitada ou pendente), `locList` será `[]` — o `.map()` retorna vazio sem erro
- Quando `localizacoes` tem dados, `locList` os reflete normalmente

### Escopo

Alteração de **1 palavra** em 1 linha do arquivo `src/pages/KmzMapa.tsx`. Nenhum outro arquivo precisa ser modificado.
