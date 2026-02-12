
## Correção do loop "Carregando..." ao clicar em Sair

### Problema

A função `signOut` no `useAuth.ts` trava se a chamada `supabase.auth.signOut()` falhar (token expirado, erro de rede), porque o estado local nunca é limpo.

### Solução

Envolver `supabase.auth.signOut()` em try/catch para garantir que o estado local seja sempre limpo.

### Arquivo modificado

**`src/hooks/useAuth.ts`** - Função `signOut` (linha ~93):

De:
```typescript
const signOut = useCallback(async () => {
  localStorage.removeItem("top_user");
  await supabase.auth.signOut();
  setSession(null);
  setProfile(null);
  setRole(null);
}, []);
```

Para:
```typescript
const signOut = useCallback(async () => {
  localStorage.removeItem("top_user");
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Erro ao deslogar (ignorado):", err);
  }
  setSession(null);
  setProfile(null);
  setRole(null);
}, []);
```

### Resultado

O botão "Sair" sempre redireciona para a tela de login, permitindo novo login normalmente.
