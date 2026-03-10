

## Bug: Badge mostra "Coordenação" ao invés da área real (ex: "ADM")

### Causa raiz

Em `AppLayout.tsx`, o badge usa `CARGO_LABELS[role]` que mapeia `"coordenacao"` → `"Coordenação"`. Isso é o **role** do sistema, não o nome da área. O hook `useAreaServico()` já está sendo chamado e retorna `areaServico` (ex: "ADM"), mas não é usado no badge.

### Correção

**Arquivo: `src/components/AppLayout.tsx`**

Alterar as duas ocorrências do badge (layout servidor e layout normal) para mostrar `areaServico` quando disponível, com fallback para o cargo label:

- Linha 153-155 (layout servidor):
  ```tsx
  <Badge variant="secondary" className="text-xs">
    {areaServico || CARGO_LABELS[cargo || ""] || cargo}
  </Badge>
  ```

- Linha 188-190 (layout normal com sidebar):
  ```tsx
  <Badge variant="secondary" className="text-xs">
    {areaServico || CARGO_LABELS[role || profile.cargo || ""] || profile.cargo}
  </Badge>
  ```

Isso faz com que:
- Juliano (role=coordenacao, area_servico=ADM) → badge mostra **"ADM"**
- Diretoria (sem area_servico) → badge mostra **"Diretoria"** (fallback)
- Servidor comum → badge mostra a área ou **"Servidor"** (fallback)

### Impacto
- Apenas `AppLayout.tsx` precisa ser editado
- Nenhuma mudança no backend ou queries
- O hook `useAreaServico` já busca corretamente de `servidores.area_servico` pelo email do usuário logado

