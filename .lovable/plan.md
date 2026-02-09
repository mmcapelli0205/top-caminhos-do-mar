

## Alterar limite de peso da dupla de 160kg para 170kg

### Alteracao

Atualizar o limite de peso total por dupla de **160kg** para **170kg** em todos os pontos do codigo.

### Arquivos alterados

| Arquivo | Linha | Alteracao |
|---|---|---|
| `src/lib/tiralesaAlgorithm.ts` | Linha 100 | `p.pesoTotal > 160` -> `p.pesoTotal > 170` |
| `src/lib/tiralesaAlgorithm.ts` | Linha 120 | `total <= 160` -> `total <= 170` |
| `src/pages/Tirolesa.tsx` | Linha 202 | `d.peso_total > 160` -> `d.peso_total > 170` (icone de aviso na UI) |

Nenhuma alteracao de logica — apenas o valor numerico muda em 3 pontos.

