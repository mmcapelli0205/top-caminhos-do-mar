

## Bug: Logout não limpa sessão — precisa limpar cache para logar novamente

### Causa raiz

Existem **3 problemas** que se somam:

1. **`signOut()` falha silenciosamente e tokens ficam no localStorage**: O `useAuth.signOut()` faz `try/catch` e ignora erros. Se o `supabase.auth.signOut()` falha (rede instável, token expirado), os tokens JWT permanecem no localStorage. Na próxima visita, `getSession()` encontra esses tokens "fantasma" e a Login page redireciona imediatamente para `/dashboard`, onde o profile fetch falha e o usuário fica preso num loading infinito.

2. **Navegação dupla conflitante no logout**: Quando `signOut()` funciona, dois redirecionamentos competem ao mesmo tempo:
   - O listener global em `client.ts`: `window.location.href = '/'` (hard redirect)
   - O `handleLogout` em `AppLayout.tsx`: `navigate("/", { replace: true })` (SPA navigation)
   
   Essa race condition pode deixar o app num estado inconsistente.

3. **Login page não valida se a sessão é realmente válida**: O `useEffect` na Login page chama `getSession()` e, se retornar qualquer sessão (mesmo com token expirado), redireciona para `/dashboard` sem verificar se o token ainda funciona.

### Correção

**Arquivo 1: `src/hooks/useAuth.ts` — signOut robusto**

Alterar o `signOut` para:
- Usar `signOut({ scope: 'local' })` para garantir limpeza local mesmo se o servidor não responder
- Após o signOut, limpar manualmente TODAS as chaves do Supabase do localStorage (padrão `sb-*-auth-token`)
- Remover o `top_user` do localStorage (já faz)

```tsx
const signOut = useCallback(async () => {
  localStorage.removeItem("top_user");
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // ignored
  }
  // Force-clear any remaining Supabase auth tokens
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && key.includes('-auth-')) {
      localStorage.removeItem(key);
    }
  });
  setSession(null);
  setProfile(null);
  setRole(null);
}, []);
```

**Arquivo 2: `src/integrations/supabase/client.ts` — remover hard redirect**

Remover o `window.location.href = '/'` do listener global. Esse redirect compete com a navegação do React Router e causa problemas. O `useAuth` + `AppLayout` já cuidam do redirect quando `session` fica `null`.

```ts
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    // Don't force hard redirect — let React handle it via useAuth
    // The useAuth hook sets session=null, and AppLayout redirects to "/"
  }
});
```

Ou simplesmente remover o listener inteiro.

**Arquivo 3: `src/pages/Login.tsx` — validar sessão antes de redirecionar**

No `getSession()` da Login page, verificar se a sessão tem um token válido (não expirado) antes de redirecionar. Se expirado, chamar `signOut` para limpar:

```tsx
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session) {
    // Check if token is expired
    const expiresAt = session.expires_at ?? 0;
    if (expiresAt * 1000 < Date.now()) {
      // Stale session — clean up
      await supabase.auth.signOut({ scope: 'local' });
      return;
    }
    // ... proceed with redirect
  }
});
```

**Arquivo 4: `src/hooks/useInactivityTimeout.ts` — mesmo padrão robusto**

O `doLogout` também chama `supabase.auth.signOut()` sem scope e sem limpeza manual. Aplicar o mesmo padrão:

```tsx
const doLogout = useCallback(async () => {
  clearTimers();
  toast.error("Sessão encerrada por inatividade");
  localStorage.removeItem("top_user");
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch { /* ignored */ }
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && key.includes('-auth-')) {
      localStorage.removeItem(key);
    }
  });
  navigate("/", { replace: true });
}, [clearTimers, navigate]);
```

### Resumo das mudanças

| Arquivo | Mudança |
|---------|---------|
| `useAuth.ts` | signOut com `scope: 'local'` + limpeza manual de tokens |
| `client.ts` | Remover hard redirect no listener global |
| `Login.tsx` | Verificar expiração do token antes de redirecionar |
| `useInactivityTimeout.ts` | Mesmo padrão robusto de signOut |

### Impacto
- 4 arquivos editados, zero mudanças no banco
- Resolve definitivamente o problema de "precisa limpar cache"
- Funciona em mobile, Safari private mode, e redes instáveis

