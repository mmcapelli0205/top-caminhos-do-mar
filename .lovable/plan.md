

## Correção: Tela azul ao sair (fallback visual na tela de Login)

### Problema real

As imagens do bucket Storage estão OK e acessíveis publicamente. O problema é que a página de Login depende da imagem de fundo carregar para ficar visível. Quando ela demora ou falha:
- O fundo fica com a cor padrão do CSS do app (azul escuro HSL 240)
- O card do formulário tem `bg-black/40` com `backdrop-blur`, que sem imagem fica praticamente invisível

### Correções

**Arquivo: `src/pages/Login.tsx`**

1. Adicionar `bg-black` como cor de fallback no container principal (div raiz), garantindo que mesmo sem a imagem o fundo fique escuro e legível
2. Aumentar a opacidade do card do formulário de `bg-black/40` para `bg-black/70`, tornando-o visível independente da imagem de fundo

**Arquivo: `src/hooks/useAuth.ts`**

3. Adicionar `localStorage.removeItem("top_user")` na função `signOut` para limpar estado local ao sair

### Detalhes das mudanças

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `Login.tsx` | Container principal | `className="relative flex min-h-screen..."` | Adicionar `bg-black` |
| `Login.tsx` | Card do formulário | `bg-black/40` | `bg-black/70` |
| `useAuth.ts` | Função signOut | `await supabase.auth.signOut()` | Adicionar `localStorage.removeItem("top_user")` antes do signOut |

### Resultado esperado

Ao clicar em "Sair", a tela de login aparecerá com fundo preto sólido e o formulário será visível imediatamente, sem depender do carregamento da imagem de fundo.

